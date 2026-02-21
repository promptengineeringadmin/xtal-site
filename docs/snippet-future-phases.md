# JS Snippet Embed — Future Phases

> Extracted from the implementation plan. These phases are deferred to future branches.

---

## Phase 5: AI Style Analyzer

**New file:** `src/app/api/admin/settings/snippet/analyze-styles/route.ts`

`POST /api/admin/settings/snippet/analyze-styles`
Body: `{ "url": "https://merchant-site.com", "collection": "..." }`

**Implementation:**
1. Fetch the merchant's homepage HTML server-side (no CORS issues)
2. Extract `<link rel="stylesheet">` URLs and inline `<style>` blocks
3. Fetch external stylesheets (first 3-5, skip large CDN frameworks like Bootstrap/Tailwind CDN)
4. Send HTML + CSS to Claude with a structured prompt:

```
Analyze this website's CSS and HTML to extract a design system config:
- Primary/secondary/accent colors (from buttons, links, headings)
- Font family stack (body and heading)
- Border radius convention
- Card/product styling patterns (shadows, padding, gaps)
- Background colors (page, cards, overlays)
- Text colors (headings, body, muted)

Return JSON matching this schema: { primaryColor, secondaryColor, accentColor,
  fontFamily, headingFontFamily, borderRadius, cardShadow, cardPadding,
  pageBg, cardBg, overlayBg, headingColor, bodyColor, mutedColor }
```

5. Parse Claude's JSON response
6. Save to Redis as `snippet_style_config` for the collection
7. Return the style config to the admin UI for preview

**Reference pattern:** `lib/admin/optimizer-scoring.ts` for Claude API usage (lazy-init Anthropic client, JSON response parsing)

**Admin UI integration (addition to Phase 2's snippet page):**
- "Analyze Styles" button next to the Merchant Site URL input
- Loading spinner during analysis (~5-10 seconds)
- Style preview panel: color swatches, font names, sample product card mockup
- "Apply" button saves extracted styles to Redis
- Manual override inputs for each style property (merchant can tweak AI's output)

---

## Phase 6: Client Library (xtal.js) — Resilience-First Architecture

The client library is designed for zero-setup deployment on merchant sites via Google Tag Manager or a `<script>` tag. It must work on any site (SPA, SSR, static) without breaking the merchant's existing functionality.

### Loader Pattern (Two-Stage)

Replace the single-script approach with a two-stage loader for production reliability:

**Stage 1 — Loader (~1-2KB, served from CDN)**

The merchant pastes this snippet (or adds it via GTM). It:
- Defines `window.XTAL` namespace with a command queue
- Creates a `<script>` tag for the versioned main bundle
- Handles load errors gracefully (merchant site unaffected)

URL: `https://cdn.xtalsearch.com/loader/v1/xtal-loader.js` (or `/client/v1/xtal-loader.js` initially)

```html
<!-- What merchants paste (or add to GTM) -->
<link rel="preconnect" href="https://xtalsearch.com">
<script>
  (function(){
    window.XTAL = window.XTAL || { q: [], init: function() { this.q.push(arguments); } };
    var s = document.createElement('script');
    s.src = 'https://cdn.xtalsearch.com/loader/v1/xtal-loader.js';
    s.async = true;
    s.dataset.shopId = 'COLLECTION_ID';
    s.onerror = function() { /* silent fail — merchant search works normally */ };
    document.head.appendChild(s);
  })();
</script>
```

**Stage 2 — Main bundle (~30-50KB, versioned with content hash)**

- URL: `/client/v1/xtal-{hash}.js` with `Cache-Control: public, max-age=31536000, immutable`
- The loader fetches this; hash changes on each release
- Enables:
  - **Instant rollback** — change the hash the loader points to
  - **Canary deploys** — route a % of merchants to a new hash
  - **Emergency kill switch** — loader can check a `kill` flag in config before loading main bundle

### Client Module Architecture

```
XtalClient (entry point)
├── ConfigManager
│   ├── Fetches /api/xtal/config on init
│   ├── Caches in localStorage with timestamp
│   ├── Falls back to stale cached config if fetch fails
│   └── Re-fetches on visibility change after staleness threshold
│
├── SearchManager
│   ├── Debounce (300ms default, configurable)
│   ├── RequestDeduplicator — same query within 100ms = skip
│   ├── AbortController pool — cancel in-flight on new query
│   ├── Uses /api/xtal/search-full (combined endpoint)
│   ├── RetryWithBackoff — 1 retry, exponential, max 2s
│   └── CircuitBreaker — 5 failures in 30s → open for 60s, then probe
│
├── UIManager
│   ├── Shadow DOM host element (style isolation)
│   ├── Result rendering (product cards from search response)
│   ├── Aspect chips (from combined response)
│   ├── Loading skeleton (shows after 1s if no response)
│   ├── Error states (degraded, timeout, circuit-open messages)
│   └── Event delegation — single click listener on shadow root
│
├── InputInterceptor
│   ├── querySelector on init using configured selector
│   ├── MutationObserver fallback for SPA sites
│   │   (watches document.body for added nodes matching selector)
│   ├── Re-attaches on input removal/recreation
│   ├── Listens: input, keydown (Enter), focus, blur
│   └── Exposes XTAL.init() for manual re-initialization
│
├── LifecycleManager
│   ├── Teardown registry — cleanup all listeners, observers, DOM
│   ├── SPA navigation detection (popstate + pushState monkey-patch)
│   ├── Visibility API — pause search when tab hidden
│   └── Re-init on navigation back to search page
│
└── Telemetry
    ├── Error reporting via navigator.sendBeacon
    ├── Batched — max 1 report per 30s per error type
    ├── Payload: error, shopId, UA, snippet version, page URL (no query params)
    └── Opt-in analytics (impressions, clicks) for Phase 7
```

### Key Design Decisions

- **Vanilla JS + CSS** — no React/Preact. Keeps bundle ~30-50KB gzipped, avoids framework conflicts with merchant's site
- **Shadow DOM** — render overlay inside Shadow DOM to isolate styles bidirectionally
- **esbuild** — fast bundler, single IIFE output file
- **Dynamic CSS variables** — inject from `styleConfig` into Shadow DOM root
- **Zero global pollution** — only `window.XTAL` namespace is added

### Graceful Degradation Tiers

The snippet must **never** break the merchant's site. Degradation is always graceful:

| Tier | Condition | User Experience |
|------|-----------|----------------|
| **Normal** | All services responding | Full search + aspects + explain |
| **Aspects Degraded** | Aspects call fails or times out | Search results shown, aspect chips hidden |
| **Slow** | No response after 1s | Loading skeleton; after 8s: "Taking longer than usual..." |
| **Failed** | Circuit breaker open (5 failures in 30s) | "Search temporarily unavailable" inline message, circuit stays open 60s then probes |
| **Critical** | xtal.js fails to load entirely | Merchant's native search works unaffected — zero impact |

**Invariant:** The snippet MUST NEVER throw an uncaught exception into the merchant's global scope. All entry points wrapped in top-level try/catch.

### CSP Compatibility Notes

Merchants with strict Content Security Policy headers need to allow:

| Directive | Required Value | Reason |
|-----------|---------------|--------|
| `script-src` | XTAL CDN domain (or `nonce` on inline loader) | Load xtal.js |
| `connect-src` | `xtalsearch.com` (or Vercel deployment domain) | API fetch calls |
| `style-src` | Generally not needed | Shadow DOM styles are CSP-exempt |

**Recommendation:** Provide a CSP-compatible loader variant that uses `nonce` attributes. Document CSP requirements in merchant integration guide.

### GTM Deployment Model

For Google Tag Manager deployment:
1. Merchant adds the loader snippet as a Custom HTML tag
2. Tag fires on "All Pages" or a page-specific trigger
3. xtal.js handles its own lifecycle (no GTM interaction after load)
4. GTM's built-in consent mode can gate the tag for privacy compliance

For server-side rendering (SSR) or "page takeover" use cases:
- The same snippet works — it attaches to existing DOM elements via CSS selectors
- For full page takeover, the `displayMode` config can switch from "overlay" to "embedded" rendering

---

## Phase 6a: Combined Search+Aspects Endpoint ✅ IMPLEMENTED

**File:** `src/app/api/xtal/search-full/route.ts`

`POST /api/xtal/search-full` — returns both search results and aspects in a single response.

- Fires backend `/api/search` and `/api/aspects` in parallel via `Promise.allSettled`
- Handles partial failures: if aspects fails, search results still returned with `aspects: [], aspects_enabled: false`
- Server-Timing header tracks `redis`, `backend`, and `aspects-failed` durations
- Reduces two CORS preflights to one for the snippet scenario
- Saves ~100-500ms from eliminating one OPTIONS round trip + cold start
- Client library uses this instead of separate search + aspects calls

---

## Phase 7: Analytics Events

**New file:** `src/app/api/xtal/events/route.ts`

`POST /api/xtal/events`
Body:
```json
{
  "shopId": "COLLECTION_ID",
  "event": "impression | click | add_to_cart | conversion",
  "productId": "...",
  "query": "...",
  "position": 3,
  "timestamp": "ISO-8601",
  "sessionId": "auto-generated"
}
```

- CORS enabled (same helper from `lib/api/cors.ts`)
- Proxies to backend analytics pipeline
- Fire-and-forget from client (`navigator.sendBeacon` for page unload, `fetch` otherwise)
- No response needed beyond 200
- Rate limiting: max 100 events/minute per shopId

---

## Phase 8: Public API Security Architecture

### The oauth2-proxy Clash

When oauth2-proxy is deployed in front of the XTAL dashboard, it will intercept all requests and demand OAuth authentication. The JS snippet runs in anonymous shoppers' browsers on third-party merchant sites — these users cannot authenticate via OAuth.

### Solution: "Public Sub-Router" Pattern

Configure oauth2-proxy to bypass authentication for public API routes:

```
oauth2-proxy configuration:
  --skip-auth-route=^/api/xtal/.*

Result:
  /admin/*       → REQUIRE OAuth session (dashboard)
  /api/admin/*   → REQUIRE OAuth session (admin APIs)
  /api/xtal/*    → SKIP auth → application-layer security
```

### Application-Layer Security for Public Routes

Since `/api/xtal/*` bypasses the OAuth proxy, security is enforced at the application level:

| Layer | Mitigation | Description |
|-------|-----------|-------------|
| **Origin validation** | Check `Origin` header against `siteUrl` in Redis | Only allow requests from the merchant's registered domain. Reject mismatched origins with 403. |
| **Snippet enabled check** | Check `snippet_enabled` flag per collection | If the merchant hasn't enabled the snippet, reject with 403. Kill switch for compromised deployments. |
| **Rate limiting** | Per-shopId request quota | Prevent abuse. Return 429 when exceeded. Can use Vercel Edge Middleware or Upstash Redis-based rate limiting. |
| **Collection validation** | Validate against known collections | Already implemented — rejects unknown collection IDs with 400. |
| **Request timeouts** | AbortSignal.timeout on backend calls | Already implemented — prevents resource exhaustion from slow backends. |
| **CORS** | Wildcard `*` initially, restrict to merchant origins later | Already implemented with wildcard; will be tightened when origin validation is built. |

### Backend Authentication Context

The backend (xtal-shopify-backend) has its own auth model:

- **Internal APIs** (`/api/search`, `/api/aspects`, etc.): Protected by AWS Cognito JWT. The Vercel proxy routes authenticate to the backend using a service-level JWT.
- **External APIs** (`/api/v1/recommend`): Protected by API key (`X-API-Key` header) with `slowapi` rate limiting (100 req/min per key).
- **Public routes** via the Vercel proxy: Application-layer security only (origin check, snippet_enabled, rate limiting). No per-user authentication required.

This two-tier model (proxy-level bypass + application-level enforcement) satisfies both Peenak's security requirements and the "zero setup" product goal for merchants.
