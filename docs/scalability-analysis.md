# XTAL Snippet — Scalability Analysis

> Technical reference for scaling the XTAL JS snippet from demo to production merchant deployments.
> Grounded in the current codebase as of February 2026.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Merchant Site (e.g. coolshoes.com)                                 │
│                                                                     │
│  ┌───────────┐   ┌──────────────────────────────────────────────┐   │
│  │  Search    │──▶│  xtal.js (injected via GTM or <script> tag) │   │
│  │  Input     │   │  - Intercepts search input                  │   │
│  └───────────┘   │  - Renders results overlay (Shadow DOM)      │   │
│                  │  - Manages lifecycle, telemetry               │   │
│                  └───────────────┬───────────────────────────────┘   │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │ HTTPS (cross-origin)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Vercel Edge Network                                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Next.js API Routes (Serverless Functions)                   │    │
│  │                                                              │    │
│  │  /api/xtal/search       POST  → proxy to backend /api/search│    │
│  │  /api/xtal/aspects      POST  → proxy to backend /api/aspects│   │
│  │  /api/xtal/explain      POST  → proxy to backend /api/explain│   │
│  │  /api/xtal/feedback     POST  → proxy to backend /api/feedback│  │
│  │  /api/xtal/search-full  POST  → parallel search + aspects    │   │
│  │  /api/xtal/config       GET   → Redis config lookup (future) │   │
│  └──────────────────┬───────────────────────────────────────────┘    │
│                     │                                                │
│                     │ fetch() over public internet                   │
└─────────────────────┼────────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│  Upstash Redis   │   │  XTAL Backend    │
│  (HTTP/REST)     │   │  (ECS Fargate)   │
│                  │   │                  │
│  Per-collection  │   │  /api/search     │──▶ Qdrant (vector search)
│  settings:       │   │  /api/aspects    │──▶ LLM (Claude/GPT)
│  - aspects prompt│   │  /api/explain    │──▶ LLM (Claude/GPT)
│  - store type    │   │  /api/feedback   │──▶ Qdrant (feedback store)
│  - query enhance │   │                  │
│  - results/page  │   │  Auth: Cognito   │
└──────────────────┘   │  JWT (internal)  │
                       │  API Key         │
                       │  (external /v1)  │
                       └──────────────────┘
```

**Key architectural property:** The Vercel API routes are _thin proxies_. They add CORS headers, enrich requests with geo data and Redis-stored config, then forward to the Python backend. The backend owns all search logic, LLM orchestration, and vector DB access.

---

## 2. Request Lifecycle

A single user search triggers up to 3 API calls from the snippet:

```
User types query
    │
    ├─ 300ms debounce
    │
    ▼
┌─────────────────────────────────────┐
│ Option A: Separate calls            │
│                                     │
│  1. POST /api/xtal/search           │  ~800-1500ms (vector search + rerank)
│  2. POST /api/xtal/aspects          │  ~1000-3000ms (LLM call)
│  3. POST /api/xtal/explain (defer)  │  ~1000-3000ms (LLM call, on demand)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Option B: Combined call (preferred) │
│                                     │
│  1. POST /api/xtal/search-full      │  ~1000-3000ms (parallel search + aspects)
│  2. POST /api/xtal/explain (defer)  │  ~1000-3000ms (LLM, on demand)
└─────────────────────────────────────┘
```

### Per-request breakdown (search-full, worst case)

| Step                        | Duration    | Notes                           |
|-----------------------------|-------------|----------------------------------|
| CORS preflight (OPTIONS)    | 0-100ms     | Cached 1h via max-age=3600    |
| Vercel function cold start  | 0-500ms     | Only on first invocation        |
| Redis config fetch          | 20-80ms     | Upstash HTTP REST (not TCP)     |
| Backend: embedding          | 100-300ms   | OpenAI ada-002                  |
| Backend: Qdrant search      | 50-200ms    | Vector similarity + BM25       |
| Backend: reranking          | 50-150ms    | Merch + keyword rerank         |
| Backend: aspects (LLM)      | 500-2500ms  | Claude/GPT streaming            |
| Response serialization      | 5-20ms      |                                 |
| **Total (warm, P50)**       | **800-1500ms** |                              |
| **Total (cold, P99)**       | **2000-4000ms** |                             |

---

## 3. Bottleneck Analysis

### Critical (P0)

| # | Bottleneck | Severity | Impact | Current State |
|---|-----------|----------|--------|---------------|
| 1 | **No CORS headers** | Critical | Snippet cannot make cross-origin requests at all | Fixed in this PR — `lib/api/cors.ts` |
| 2 | **No request timeouts** | Critical | A slow backend hangs the Vercel function until platform kills it (default 10s) | Fixed in this PR — AbortSignal.timeout per route |
| 3 | **No collection validation** | High | Any string forwarded to backend as collection name — information disclosure risk | Fixed in this PR — validate against `COLLECTIONS` |
| 4 | **Request multiplication** | High | Each search = 2-3 separate HTTP round trips, each with CORS preflight + cold start | Mitigated — `search-full` combined endpoint |
| 5 | **`system_prompt` injection via `...body` spread** | Critical | Attacker can inject `system_prompt` in POST body to override LLM instructions on any route where `isCustom` is false | Fixed in this PR — explicit field allowlisting replaces `...body` spread in all 5 route files |
| 6 | **No rate limiting on LLM-hitting routes** | Critical | A `while true; do curl ...` loop against `search-full` or `aspects` could burn $50-100/hr in LLM costs. No auth, no rate limit, wildcard CORS. Backend slowapi only covers `/api/v1/*`, not internal endpoints. | Not yet implemented — needs Upstash Redis sliding-window rate limiter (next PR) |

### High (P1)

| # | Bottleneck | Severity | Impact | Current State |
|---|-----------|----------|--------|---------------|
| 7 | **No origin validation** | High | Any website can use the API — no way to restrict to authorized merchants | Deferred — requires snippet settings (siteUrl per collection in Redis) |
| 8 | **LLM throughput ceiling** | High | Aspects + explain both call LLMs; ~500ms-3s per call; rate-limited by provider | No fix available short of caching or reducing LLM calls |
| 9 | **Hardcoded COLLECTIONS** | High | `lib/admin/collections.ts` is a static array — every new merchant requires a code deploy | Needs dynamic collection registry (Redis or DB) |
| 10 | **No input validation beyond allowlisting** | High | Explicit field picking blocks injection but a 10MB `body.query` could crash the function or exhaust backend memory | Needs Zod schema enforcement (max lengths, strict types) — next PR |

### Medium (P2)

| # | Bottleneck | Severity | Impact | Current State |
|---|-----------|----------|--------|---------------|
| 11 | **No edge caching on search** | Medium | Every identical query hits backend; no CDN cache for search results | Vercel Edge Cache could cache POST responses with cache keys |
| 12 | **Upstash Redis HTTP overhead** | Medium | REST API adds ~20-50ms vs TCP connection; fine for now, problematic at scale | Acceptable for <500 concurrent; consider Upstash Redis TCP or ElastiCache at scale |
| 13 | **Vercel cold starts** | Medium | Each route is a separate function; `search` and `aspects` cold-start independently | Combined endpoint helps; Vercel Pro cron-based warming possible |
| 14 | **No request deduplication** | Medium | Same user typing "blue shoes" fires multiple debounced requests; no server-side dedup | Client-side AbortController cancels in-flight; server-side dedup is future work |
| 15 | **Denial-of-wallet via proxy rotation** | Medium | Even with IP rate limiting, an attacker rotating proxy IPs can impose unbounded LLM costs (Layer 7 denial-of-wallet) | Needs query caching at Edge/Redis level — cache aspects responses keyed on `(collection, query, selected_aspects)` with short TTL (60-300s) |

### Low (P3)

| # | Bottleneck | Severity | Impact | Current State |
|---|-----------|----------|--------|---------------|
| 16 | **No graceful degradation** | Low | If aspects or explain fail, the entire experience breaks | Client library will implement tiered degradation |
| 17 | **No telemetry** | Low | No visibility into snippet performance, errors, or usage in production | Phase 7 — analytics events endpoint. Note: Gemini review recommends promoting to P1 before merchant onboarding |

---

## 4. Capacity Estimates

These are rough estimates based on the architecture. Actual numbers depend heavily on LLM provider rate limits and backend compute.

| Tier | Concurrent Users | Bottleneck | Mitigation |
|------|-------------------|-----------|------------|
| **Comfortable** | 100-500 | None — current infra handles this | Current Vercel Pro + ECS Fargate |
| **Strained** | 500-2,000 | LLM rate limits, Redis HTTP latency, cold starts | Add edge caching, use combined endpoint, warm functions |
| **At Risk** | 2,000-5,000 | Vercel function concurrency, backend saturation | Dedicated infra, Redis TCP, request dedup, LLM response caching |
| **Requires Rearchitecture** | 5,000+ | Everything | Direct backend access (bypass Vercel proxy), dedicated LLM instances, read replicas |

**Cost scaling:** Each search with aspects costs ~$0.002-0.01 in LLM tokens. At 10,000 searches/day = $20-100/day in LLM costs alone, plus Vercel function invocations and Qdrant compute.

---

## 5. Latency Budget (End-to-End)

Worst-case path for a shopper's first search on a merchant site:

```
Event                           Cumulative    Duration
─────────────────────────────── ────────────  ────────
Page load begins                0ms
xtal-loader.js fetched (CDN)    200ms         200ms (async, non-blocking)
Main xtal.js bundle fetched     500ms         300ms (CDN, content-hashed)
Config fetch (/api/xtal/config) 800ms         300ms (cached after first)
User types query                variable
Debounce completes              +300ms        300ms
CORS preflight (OPTIONS)        +100ms        0-100ms (cached 24h)
search-full cold start          +500ms        0-500ms (warm = 0)
Redis config + backend call     +2000ms       1000-2000ms
Response rendered               +50ms         50ms
─────────────────────────────── ────────────
First search result visible     ~1500-3500ms from keystroke (warm)
                                ~2000-4300ms from keystroke (cold)
```

**Target:** P50 < 2s, P99 < 4s from keystroke to results visible.

---

## 6. The oauth2-proxy Architectural Clash

### The Problem

oauth2-proxy will eventually sit in front of the XTAL dashboard to enforce SSO authentication. It intercepts all requests and demands proof of identity (session cookie or Bearer token).

The JS snippet executes in the browsers of **anonymous shoppers on third-party merchant websites**. These shoppers:
- Do not have XTAL accounts
- Cannot be redirected to an OAuth login flow
- Cannot carry a hardcoded Bearer token (it would be public and scrapeable)

If oauth2-proxy guards `/api/xtal/*` without exceptions, the snippet fails for every shopper.

### The Solution: "Public Sub-Router" Pattern

Configure oauth2-proxy to distinguish two classes of API:

```
┌────────────────────────────────────────────────────────┐
│  oauth2-proxy                                          │
│                                                        │
│  /admin/*         → REQUIRE OAuth session              │
│  /api/admin/*     → REQUIRE OAuth session              │
│  /api/xtal/*      → SKIP auth (--skip-auth-route)      │
│  /api/public/*    → SKIP auth (future namespace)       │
│  Everything else  → REQUIRE OAuth session              │
└────────────────────────────────────────────────────────┘
```

**Configuration:**
```
--skip-auth-route=^/api/xtal/.*
```

This tells the proxy: "Pass requests matching this path directly to the backend without demanding an OAuth token."

### Application-Layer Security for Public Routes

Because `/api/xtal/*` bypasses the OAuth proxy, security shifts to the application layer:

| Mitigation | Description | Status |
|-----------|-------------|--------|
| **Origin validation** | Check `Origin` header against `siteUrl` stored in Redis for the shopId. Reject mismatched origins with 403. | Deferred — requires snippet settings infrastructure |
| **Snippet enabled check** | Check `snippet_enabled` flag in Redis. If false, reject with 403. | Deferred — requires snippet settings infrastructure |
| **Rate limiting** | Per-shopId request quota. Return 429 when exceeded. | Not yet implemented on Vercel proxy layer; backend has slowapi on `/api/v1/*` |
| **Collection validation** | Validate collection against known list. Reject unknown collections. | Implemented in this PR |
| **Request timeouts** | AbortSignal.timeout prevents backend hangs from consuming resources. | Implemented in this PR |
| **CORS headers** | Wildcard `*` for now; will restrict to merchant origins when snippet settings are built. | Implemented in this PR (wildcard) |

---

## 7. Snippet-Specific Concerns

### Content Security Policy (CSP)

Merchants with strict CSP headers need to allow:

| Directive | Required Value | Reason |
|-----------|---------------|--------|
| `script-src` | XTAL CDN domain (or nonce on inline loader) | Load xtal.js |
| `connect-src` | `xtalsearch.com` (or Vercel domain) | API fetch calls |
| `style-src` | Generally not needed | Shadow DOM styles are CSP-exempt |

**Recommendation:** Document CSP requirements in merchant integration guide. Provide a CSP-compatible loader that uses `nonce` attributes.

### SPA Merchant Sites

Single-page applications (React, Vue, Next.js storefronts) present challenges:
- Search input may not exist on initial page load
- Navigation doesn't trigger full page reloads
- DOM elements are created/destroyed dynamically

**Solution in xtal.js:** `InputInterceptor` module uses `MutationObserver` on `document.body` to detect when search inputs are added/removed. Re-attaches listeners automatically. Exposes `XTAL.init()` for manual re-initialization.

### Bot Protection (Akamai/DataDome)

Enterprise merchants (Nike, Target, Best Buy) deploy bot protection services that fingerprint all requests pre-inspection. These services block unknown third-party scripts regardless of CSP policy. This is a harder blocker than CSP for enterprise sites — XTAL cannot run where bot protection is active unless the merchant explicitly allowlists the XTAL script domain.

**Impact:** Limits the initial addressable market to WooCommerce, basic Shopify, and Vercel-hosted headless storefronts. Enterprise merchants require partnership-level integration.

### Memory Leaks

The snippet runs for the entire session on a merchant site. Must avoid:
- Unbounded event listener accumulation
- Orphaned DOM nodes in Shadow DOM
- Unclosed AbortControllers
- Growing request/response caches

**Solution:** `LifecycleManager` module maintains a teardown registry. All listeners, observers, and DOM elements are tracked and cleaned up on navigation or teardown.

### Shadow DOM

The snippet renders results inside a Shadow DOM to isolate styles bidirectionally:
- Merchant CSS doesn't affect XTAL results
- XTAL CSS doesn't leak into merchant page

**Gotchas:**
- Some CSS-in-JS libraries don't work inside Shadow DOM
- `document.querySelector` from merchant code can't reach inside the shadow root
- Focus management across shadow boundary requires careful handling

### Target Market Compatibility

Based on expert ecommerce compatibility review:

| Site Type | CSP | Bot Protection | Existing Search | GTM | Rating |
|-----------|-----|----------------|-----------------|-----|--------|
| **WooCommerce (simple)** | Permissive | None | Native | Available | **Works** |
| **Shopify (basic)** | Permissive | Low | Maybe Searchspring | Available | **Works with config** |
| **Shopify Plus** | Stricter | Low | Searchspring/Algolia | Available | **Needs CSP change** |
| **Shopify+ Headless** | Strict | DataDome | Algolia | No | **Blocked** |
| **Nike/Target/BestBuy** | Very strict | Akamai/DataDome | Algolia/Bloomreach/Coveo | Maybe | **Blocked** |

**Recommended initial target market:**
1. WooCommerce stores with native search (largest untapped segment)
2. Entry-to-mid Shopify without third-party search
3. Headless storefronts on Vercel (can use Edge Middleware for CSP)

**Key insight:** Bot protection (Akamai, DataDome) blocks unknown scripts regardless of CSP. These services fingerprint requests pre-inspection. This is a harder blocker than CSP for enterprise merchants.

---

## 8. Tiered Degradation Strategy

The snippet must never break the merchant's site. Degradation is graceful:

| Tier | Condition | User Experience | Technical Response |
|------|-----------|----------------|-------------------|
| **Normal** | All services responding | Full search + aspects + explain | — |
| **Aspects Degraded** | Aspects call fails/times out | Search results shown, aspect chips hidden | `search-full` returns `aspects: [], aspects_enabled: false` |
| **Slow** | No response after 1s | Loading skeleton appears | Show skeleton UI after 1s, "Taking longer..." after 8s |
| **Failed** | Circuit breaker open (5 failures in 30s) | "Search temporarily unavailable" inline | Circuit stays open 60s, then probes with single request |
| **Critical** | xtal.js fails to load entirely | Merchant's native search works unaffected | Zero impact — the snippet is additive, never destructive |

**Invariant:** The snippet MUST NEVER throw an uncaught exception into the merchant's global scope. All entry points wrapped in try/catch.

---

## 9. Prioritized Fix Roadmap

### P0 — This PR (blocking deployment)
- [x] CORS headers on all `/api/xtal/*` routes
- [x] Collection validation (search, aspects, explain, feedback)
- [x] Backend proxy timeouts (AbortSignal.timeout)
- [x] Vercel function maxDuration configuration
- [x] Combined `search-full` endpoint
- [x] Request body allowlisting — replaced `...body` spread with explicit field picks in all 5 route files (blocks `system_prompt` injection)
- [x] CORS max-age reduced from 86400 to 3600 for faster iteration

### P1 — Next PR (blocking merchant onboarding)
- [ ] Rate limiting on Vercel proxy routes — Upstash Redis sliding-window, 30 req/min per IP on LLM routes (aspects, explain, search-full), 120 req/min on search-only
- [ ] Input validation schema (Zod) — enforce max lengths and strict types on all inputs (`query: z.string().max(500)`, `k: z.number().int().min(1).max(100)`)
- [ ] Re-introduce snippet settings infrastructure (config route, admin-settings.ts, admin UI)
- [ ] Origin validation (check `Origin` header against `siteUrl` in Redis)
- [ ] Snippet enabled/disabled check per collection
- [ ] Dynamic collection registry (replace hardcoded `COLLECTIONS` array)
- [ ] Telemetry/error reporting — minimal beacon endpoint (`/api/xtal/telemetry`) before onboarding first 10 merchants

### P2 — Scale preparation
- [ ] Edge caching for search responses (Vercel Edge Cache or CDN)
- [ ] Query caching for denial-of-wallet mitigation — cache aspects responses keyed on `(collection, query, selected_aspects)` with 60-300s TTL
- [ ] Request deduplication (server-side, keyed on query + collection)
- [ ] Vercel function warming (cron-based keep-alive)
- [ ] Upstash Redis TCP connection (or ElastiCache) for lower latency
- [ ] LLM response caching (cache aspects for common queries)
- [ ] Layer IP rate limiting with session cookie or browser fingerprinting to reduce false positives (shared IPs on campuses/offices/carrier-grade NAT)

### P3 — Production hardening
- [ ] Analytics events endpoint (`/api/xtal/events`)
- [ ] Circuit breaker in xtal.js client
- [ ] SPA navigation detection and re-initialization
- [ ] CSP compatibility documentation and nonce-based loader
- [ ] oauth2-proxy `--skip-auth-route` configuration for deployment

---

## Appendix: File Reference

| File | Role |
|------|------|
| `src/app/api/xtal/search/route.ts` | Proxy to backend `/api/search` |
| `src/app/api/xtal/aspects/route.ts` | Proxy to backend `/api/aspects`, fetches prompt/config from Redis |
| `src/app/api/xtal/explain/route.ts` | Proxy to backend `/api/explain` |
| `src/app/api/xtal/feedback/route.ts` | Proxy to backend `/api/feedback/relevance` |
| `src/app/api/xtal/search-full/route.ts` | Combined search + aspects in parallel |
| `lib/api/cors.ts` | Shared CORS headers and OPTIONS handler |
| `lib/admin/collections.ts` | Hardcoded `COLLECTIONS` array (validation source) |
| `lib/admin/admin-settings.ts` | Per-collection Redis settings (Upstash HTTP) |
| `vercel.json` | Function timeout and memory configuration |
| Backend: `app/services/api_key_auth.py` | API key auth for external endpoints |
| Backend: `app/api/v1/recommend.py` | External recommendation API (reference pattern) |
