# JS Snippet Embed — Architectural Review

> For review by Peenak. Branch: `feature/js-snippet`.

---

## 1. What This Is

A set of foundational changes that enable XTAL search to be embedded as a JavaScript snippet on merchant websites. The **client library itself (`xtal.js`) is not built yet** — this branch delivers the server-side infrastructure, admin configuration UI, public APIs, and test harness that the client library will consume.

### What ships now (this branch)

| Layer | What's built | Key files |
|-------|-------------|-----------|
| **Admin UI** | Snippet configuration page (enable/disable, CSS selectors, display mode, generated embed code) | `src/app/(admin)/admin/settings/snippet/page.tsx` |
| **Admin API** | CRUD for snippet settings in Redis | `src/app/api/admin/settings/snippet/route.ts`, `lib/admin/admin-settings.ts` |
| **Config API** | Public endpoint returning per-collection snippet config | `src/app/api/xtal/config/route.ts` |
| **CORS layer** | Wildcard CORS on all `/api/xtal/*` routes | `lib/api/cors.ts` |
| **Search/Aspects/Explain APIs** | Enriched with geo headers, per-collection prompt interpolation, CORS headers | `src/app/api/xtal/{search,aspects,explain}/route.ts` |
| **UTM tracking** | Immutable UTM params on all product links | `lib/utm.ts` |
| **Contextual loading** | Query intent detection + store-type-specific messages | `lib/loading-content.ts` |
| **Test harness** | Simulated merchant storefront that loads config API | `src/app/(public)/test/storefront/page.tsx` |

### What's deferred (documented in `docs/snippet-future-phases.md`)

- **Phase 5**: AI style analyzer (extract merchant CSS into a style config)
- **Phase 6**: `xtal.js` client library (vanilla JS, Shadow DOM, ~30-50KB)
- **Phase 7**: Analytics events endpoint (`/api/xtal/events`)
- **Phase 8**: Combined `search-full` endpoint to reduce CORS round trips

---

## 2. Data Flow

```
Merchant site                         XTAL (Vercel)                   Backend
─────────────                         ─────────────                   ───────

1. <script> loads xtal.js
       │
       ▼
2. GET /api/xtal/config?shopId=X ───► Validates shopId against       (no backend call)
       │                              COLLECTIONS list, fetches
       │                              snippet settings from Redis,
       │                              returns config + feature flags
       │                              Cache: 5min public
       ▼
3. xtal.js hooks search input
   (CSS selector from config)

4. User types → debounce 300ms
       │
       ├──► POST /api/xtal/search ──► Enriches with geo headers ───► POST /api/search
       │         { query,              (x-vercel-ip-country)          (Qdrant vector search)
       │           collection }
       │
       └──► POST /api/xtal/aspects ─► Fetches prompt + storeType ──► POST /api/aspects
                 { query,              from Redis, interpolates        (LLM aspect gen)
                   collection }        {store_type} in prompt

5. Results rendered in overlay
   Product links include UTM params:
     utm_source=xtal  utm_medium=search
     utm_campaign={collection}  utm_content={productId}  utm_term={query}

6. User refines (aspects/facets/price) → POST /api/xtal/search
   with cached search_context (avoids re-embedding)
```

---

## 3. Architectural Concerns and How They're Addressed

### 3.1 CORS: Wildcard Origin (`Access-Control-Allow-Origin: *`)

**What it does**: All `/api/xtal/*` routes return `*` as the allowed origin. This means any website on the internet can call these endpoints.

**Why this is the design**: The snippet will run on arbitrary merchant domains. We don't know which domains in advance, so a restrictive origin list isn't practical at this stage.

**Risks**:
- Any third party can use the search API without authorization
- No way to attribute or limit traffic by origin
- Backend cost exposure (every search triggers Qdrant vector search; aspects trigger LLM calls)

**Mitigations in place**:
- `shopId` is validated against the hardcoded `COLLECTIONS` list — unknown collection IDs are rejected (404)
- Config endpoint has `enabled` flag — can disable a collection's snippet without removing the collection

**Potential future mitigations to consider**:
- **Origin allowlist per collection**: Store `siteUrl` in snippet settings (already captured in admin) and validate `Origin`/`Referer` header against it at the API layer. Reject requests from unknown origins.
- **Rate limiting**: Per-`shopId` rate limits at the Vercel edge or within the route handlers
- **API key in config**: Config endpoint returns a short-lived token; subsequent search/aspects calls include it. Prevents casual abuse without burdening the merchant embed.

### 3.2 No Authentication on Public APIs

**Current state**: The `/api/xtal/search`, `/api/xtal/aspects`, `/api/xtal/explain` routes have **zero authentication**. No API key, no token, no origin check.

**Context**: These routes already existed for the Try page (same-origin). Adding CORS was the only change needed for cross-origin snippet use. But the Try page runs on our own domain — the snippet makes them truly public.

**The admin routes** (`/api/admin/settings/snippet`) are protected by the existing SSO/admin auth layer and are not CORS-enabled. This is correct.

**Recommendation**: Before the client library ships, consider at minimum:
1. Checking the `snippet_enabled` flag in the search/aspects routes (not just the config route) so disabled collections can't be queried cross-origin
2. Validating `Origin` header against the stored `siteUrl` for the collection

### 3.3 Cost Exposure from Public APIs

**Concern**: Each search triggers a Qdrant vector query. Each aspects call triggers an LLM generation. These have real per-request costs. With wildcard CORS and no auth, there's no throttle on who can generate these costs.

**Current mitigation**: Only hardcoded collection IDs work (can't be used to search arbitrary data).

**Recommended before going live**:
- Per-collection rate limiting (at minimum on the aspects endpoint, which is the most expensive)
- Monitoring/alerting on request volume per collection
- The `enabled` flag should gate the search and aspects routes, not just config

### 3.4 Collection ID as the Only Tenant Identifier

**How it works**: `shopId` in query params (config) or `collection` in POST body (search/aspects) is the only tenant identifier. It maps to a Qdrant collection name and Redis key prefix.

**Risk**: Collection IDs are short, predictable strings (`xtaldemo`, `bestbuy`, `willow`). Anyone who knows or guesses the ID can query the collection. The COLLECTIONS list is validated, but the IDs themselves are exposed in the embed snippet (`data-shop-id`).

**This is probably fine for now** since these are demo/test collections. For production merchant collections, consider whether collection IDs should be opaque (UUIDs) or whether the API key approach from 3.1 is sufficient.

### 3.5 UTM Parameter Strategy

**Design**: UTM params are hardcoded and immutable — merchants can't customize them. They're appended client-side by `appendUtm()` in `lib/utm.ts`.

**Good**:
- Clean attribution: every click from XTAL search is trackable in the merchant's analytics
- `utm_term` captures the actual search query — valuable for understanding what searches drive conversions
- Graceful fallback: if URL is malformed, returns unchanged (no crash)

**Consideration**: `utm_term` contains the raw user search query. If a merchant is in a jurisdiction covered by GDPR/privacy regulations, search queries could be considered personal data. This is a business/legal decision, not a code concern, but worth flagging.

### 3.6 Config Caching and Staleness

**Current**: Config endpoint returns `Cache-Control: public, max-age=300` (5 minutes).

**Implication**: If an admin disables a snippet, it takes up to 5 minutes for live snippets to see the change. This is a reasonable tradeoff for reducing Redis load. Worth documenting for support/ops.

### 3.7 Snippet Settings Storage (Redis)

**Pattern**: Each setting is stored as a separate Redis key (`admin:settings:{collection}:snippet_enabled`, `...snippet_site_url`, etc.). Reads use `Promise.all` across 6 `kv.get()` calls.

**This is consistent** with how other admin settings are stored in this codebase (same pattern for BM25 weight, query enhancement, etc.).

**No concerns here** — the pattern is established and the read volume is low (admin pages + config endpoint with caching).

### 3.8 Test Harness Uses `dangerouslySetInnerHTML`

**What**: The test storefront page injects a `<script>` tag using React's `dangerouslySetInnerHTML` with the `collection` query param interpolated into it.

**Risk**: The `collection` value comes from `useSearchParams()` (client-side), and is interpolated into a script tag. If the value contained a quote and closing script tag, it could break out of the script context.

**Mitigation**: The value is also used in a `fetch()` URL where it would fail validation (COLLECTIONS check returns 404). But the script injection itself isn't sanitized.

**Severity**: Low — this is a test/debug page, not user-facing. But worth sanitizing the interpolation (e.g., `JSON.stringify(collection)` instead of template literal) for defense in depth.

### 3.9 Admin Snippet API Has No Input Validation

**What**: The `PUT /api/admin/settings/snippet` route accepts arbitrary JSON and passes it directly to `saveSnippetSettings()`, which writes values to Redis if the keys are present.

**Risk**: Low, since it's behind admin auth. But there's no validation that `displayMode` is one of `"overlay"|"fullpage"`, that `searchSelector` is a valid CSS selector, or that `siteUrl` is a valid URL.

**Recommendation**: Add basic validation before the client library ships, since these values will be consumed by JavaScript running on merchant sites.

---

## 4. What's NOT in This Branch (Confirming Scope)

These are explicitly deferred and documented in `docs/snippet-future-phases.md`:

1. **`xtal.js` client library** — the actual embeddable script. Currently the generated snippet code references `/client/v1/xtal.js` which doesn't exist yet.
2. **AI style analyzer** — extracts merchant site CSS to style the widget
3. **Analytics events** — impression/click/conversion tracking
4. **Combined search+aspects endpoint** — optimization to reduce CORS round trips
5. **CDN hosting** — snippet code currently points to origin (`window.location.origin`); production will need CDN delivery

---

## 5. Summary of Recommendations

| # | Item | Priority | When |
|---|------|----------|------|
| 1 | Gate search/aspects routes on `snippet_enabled` for cross-origin requests | High | Before client library ships |
| 2 | Validate `Origin` header against stored `siteUrl` per collection | High | Before client library ships |
| 3 | Add per-collection rate limiting (especially on aspects endpoint) | High | Before client library ships |
| 4 | Sanitize collection param in test harness `dangerouslySetInnerHTML` | Low | This branch or next |
| 5 | Add input validation to admin snippet settings PUT | Medium | Before client library ships |
| 6 | Decide on privacy stance for `utm_term` (user search queries in URLs) | Medium | Before merchant rollout |
| 7 | Consider opaque collection IDs for production merchants | Low | When onboarding real merchants |

---

## 6. Files Changed (Quick Reference)

**New files:**
- `lib/api/cors.ts` — CORS helper (wildcard origin, OPTIONS handler)
- `lib/utm.ts` — immutable UTM parameter appender
- `lib/loading-content.ts` — query intent detection + contextual messages
- `src/app/(admin)/admin/settings/snippet/page.tsx` — admin snippet config UI
- `src/app/api/admin/settings/snippet/route.ts` — admin snippet settings API
- `src/app/api/xtal/config/route.ts` — public config endpoint for snippets
- `src/app/(public)/test/storefront/page.tsx` — test harness
- `docs/snippet-future-phases.md` — deferred phases documentation

**Modified files:**
- `lib/admin/admin-settings.ts` — added `SnippetSettings` interface, get/save functions, Redis keys
- `src/app/api/xtal/search/route.ts` — added CORS, geo header enrichment
- `src/app/api/xtal/aspects/route.ts` — added CORS, per-collection prompt interpolation
- `src/app/api/xtal/explain/route.ts` — added CORS, optional custom prompt
- `components/try/ProductCard.tsx` — UTM param appending on product links
- `components/try/ProductGrid.tsx` — store-type-aware empty states
- `components/try/SearchLoadingSpinner.tsx` — query intent detection messages
- `components/try/TrySearch.tsx` — accepts collection/storeType props, wide layout support
- `src/app/(public)/try/page.tsx` — passes storeType/resultsPerPage from settings
- `src/app/(public)/bestbuy/page.tsx` — loads collection-specific settings
- `src/app/(public)/willow/page.tsx` — loads collection-specific settings
- `src/app/(public)/demo/[slug]/page.tsx` — loads per-demo settings
- `src/app/(admin)/admin/settings/page.tsx` — added "Embed Snippet" nav item
