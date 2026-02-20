# JS Snippet Embed — Future Phases

> Extracted from the implementation plan. These phases are deferred to future branches.

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

## Phase 6: Client Library (xtal.js)

**New directory:** `client/`

```
client/
  src/
    index.ts          - Bootloader: read data-shop-id, fetch config, init
    interceptor.ts    - DOM observation, search input hooking
    api.ts            - XTAL API client (search, aspects, debounced)
    ui/
      overlay.ts      - Overlay/dropdown renderer (vanilla DOM)
      results.ts      - Product card rendering
      filters.ts      - Facet/price filter UI
      styles.ts       - Dynamic style injection from config
    analytics.ts      - Event tracking (impressions, clicks, conversions)
    utm.ts            - UTM helper (same logic as lib/utm.ts)
  build.ts            - esbuild bundler config
  package.json        - Separate package for client build
```

**Key decisions:**
- **Vanilla JS + CSS** — no React/Preact. Keeps bundle ~30-50KB gzipped, avoids framework conflicts with merchant's site
- **Shadow DOM** — render overlay inside Shadow DOM to isolate styles bidirectionally
- **esbuild** — fast bundler, single IIFE output file
- **Dynamic CSS variables** — inject from `styleConfig` into Shadow DOM root

**Client flow:**
1. Bootloader loads `xtal.js` (async, non-blocking)
2. Read `data-shop-id` from the `<script>` tag's dataset
3. Eagerly fetch config from `/api/xtal/config?shopId=...` (on page load, before user types)
4. Find search input using configured selector (fallback: common selectors like `input[type="search"]`, `.search-bar`, `#search`)
5. Attach debounced `input` listener (300ms) + `submit` interceptor (`preventDefault`)
6. On query: call `/api/xtal/search` with collection + query
7. Render overlay beneath search input with product results
8. Product links use `product_url` with immutable UTM params appended
9. Fire analytics events on impression/click

**Generated snippet (what merchants paste):**
```html
<link rel="preconnect" href="https://xtalsearch.com">
<script>
  (function(){
    var s = document.createElement('script');
    s.src = 'https://cdn.xtalsearch.com/client/v1/xtal.js';
    s.async = true;
    s.dataset.shopId = 'COLLECTION_ID';
    document.head.appendChild(s);
  })();
</script>
```

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

- CORS enabled (same helper from Phase 3)
- Proxies to backend analytics pipeline
- Fire-and-forget from client (`navigator.sendBeacon` for page unload, `fetch` otherwise)
- No response needed beyond 200
- Rate limiting: max 100 events/minute per shopId

---

## Additional Future Optimization: Combined Search+Aspects Endpoint

**New file:** `src/app/api/xtal/search-full/route.ts`

`POST /api/xtal/search-full` — returns both search results and aspects in a single response.

- Reduces two CORS preflights to one for the snippet scenario
- Server-side: fires both backend calls in parallel, combines responses
- Saves ~100ms on cold start from eliminating one OPTIONS round trip
- Client library uses this instead of separate search + aspects calls
