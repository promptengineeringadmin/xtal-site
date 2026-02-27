You are a senior SDK engineer reviewing the **$ARGUMENTS** collection's embeddable SDK overlay. Perform a thorough code-level QA audit of the client SDK and produce a structured markdown report.

## Step 1: Read SDK Source Files

Read ALL of the following files. Do not skip any:

**Core SDK:**
- `client/src/index.ts` — boot, config fetch, search interception, inline rendering, filter rail, FAB, drawer
- `client/src/api.ts` — API client, Product interface, search methods
- `client/src/utm.ts` — UTM parameter appending
- `client/src/interceptor.ts` — search input interception, capture-phase listeners

**UI Layer:**
- `client/src/ui/inline.ts` — inline result container, loading spinner, card rendering
- `client/src/ui/results.ts` — product card rendering (default), loading, empty states
- `client/src/ui/template.ts` — templated card rendering, conditional blocks, token interpolation
- `client/src/ui/styles.ts` — embedded CSS

**Cart Adapters:**
- `client/src/cart/detect.ts` — cart adapter detection (Shopify, WooCommerce, fallback)
- `client/src/cart/shopify.ts` — Shopify cart API adapter
- `client/src/cart/fallback.ts` — fallback adapter (navigate to product page)

**Filter System:**
- `client/src/ui/filter-rail.ts` — desktop filter rail + mobile FAB + drawer

**Config & Setup:**
- `src/app/api/xtal/config/route.ts` — config endpoint (Redis-backed)
- `scripts/setup-willow-snippet.ts` — Willow Redis config (reference for expected config shape)

**QA Reference:**
- `C:\Users\rudcz\.claude\projects\c--vibe-xtal-site\memory\sdk-qa-checklist.md` — checklist to evaluate against
- `C:\Users\rudcz\.claude\projects\c--vibe-xtal-site\memory\overlay-philosophy.md` — design philosophy

## Step 2: Check Collection Config

If `$ARGUMENTS` is a known collection, read its setup script or Redis config to understand:
- `snippet_enabled`, `search_selector`, `display_mode`, `results_selector`
- `product_url_pattern`, `site_url`
- `card_template` (HTML + CSS)

Known setup scripts:
- `willow` → `scripts/setup-willow-snippet.ts`

## Step 3: Evaluate Against SDK QA Checklist

### URL Resolution
- [ ] `resolveProductUrl()` handles `productUrlPattern` with `{sku}` and `{id}` substitution
- [ ] `resolveProductUrl()` is called in ALL card rendering paths (default + templated)
- [ ] Template's `{{product_url}}` token receives resolved URL (not raw `product.product_url`)
- [ ] `data-xtal-action="view-product"` wiring uses resolved URL
- [ ] `onViewProduct` handler uses resolved URL
- [ ] All product URLs are absolute (siteUrl prefix applied when needed)

### UTM Tracking
- [ ] `appendUtm()` called on all outbound product links
- [ ] `appendUtm()` receives absolute URLs (relative paths cause silent failure via `new URL()` catch)
- [ ] UTM params: `utm_source=xtal`, `utm_medium=search`, `utm_campaign={shopId}`, `utm_content={productId}`, `utm_term={query}`

### Search Interception
- [ ] Capture-phase listener registered on correct selector
- [ ] Enter key and submit button both intercepted
- [ ] Framework-specific handlers (Angular ng-submit, React onChange) don't compete
- [ ] Fallback navigation works if interception fails

### Loading States
- [ ] `showLoading(query)` renders spinner with sparkle, query echo, cycling phrases
- [ ] Loading wrapper has `width:100%` (prevents off-center on mobile)
- [ ] Phrase timer cleaned up on renderCards/renderEmpty/destroy

### Filter Rail & Mobile
- [ ] Desktop: filter rail visible (>= 768px), mobile: hidden
- [ ] Mobile: FAB visible (< 768px), slide-up animation, safe-area inset
- [ ] FAB badge shows active filter count
- [ ] Drawer opens/closes, filters apply, backdrop clickable
- [ ] `!important` on critical CSS to prevent merchant bleed

### Card Rendering
- [ ] Template conditionals (`{{#field}}...{{/field}}`) process correctly
- [ ] All product fields mapped in `buildTemplateData()`
- [ ] Image fallback chain: `image_url` → `featured_image` → `images[0].src`
- [ ] Price formatting: `toFixed(2)`, compare-at price conditional
- [ ] Add-to-cart button: loading state, text override for fallback adapter

### Cart Integration
- [ ] Cart adapter detection runs correctly for target platform
- [ ] Fallback adapter overrides button text to "View Product"
- [ ] Add-to-cart events fire to `/api/xtal/events`

### Error Handling
- [ ] Config fetch failure handled gracefully
- [ ] Search API failure doesn't crash the page
- [ ] `sendBeacon` telemetry on errors
- [ ] AbortController cancels in-flight requests on new search

### CSS Defense
- [ ] All XTAL elements use scoped class names (`xtal-*`)
- [ ] Critical properties use `!important` (colors, backgrounds, fonts)
- [ ] Box-sizing, line-height, letter-spacing reset on containers
- [ ] Font-family includes full fallback chain

## Step 4: Output Report

```markdown
# SDK Review: $ARGUMENTS

**Date:** [today's date]
**Reviewer:** Claude (automated)
**Collection:** $ARGUMENTS

## Summary
[2-3 sentence overview of SDK health for this collection]

## Issue Table

| # | Severity | Category | Issue | File | Line | Recommendation |
|---|----------|----------|-------|------|------|----------------|
| 1 | P0 | ... | ... | ... | ... | ... |

**Severity definitions:**
- **P0 (Critical):** Broken functionality — URLs 404, cart fails, search doesn't intercept
- **P1 (Major):** Degraded experience — missing UTM, CSS bleed, loading glitches
- **P2 (Minor):** Code quality, potential edge case, polish opportunity

## Detailed Findings

### URL Resolution
[Analysis of product URL construction for this collection]

### UTM Tracking
[Verification that UTM params are appended correctly]

### Search Interception
[Analysis of selector matching and event capture for the target site]

### Card Rendering
[Template evaluation, data mapping, visual correctness]

### Filter System
[Desktop rail + mobile FAB/drawer analysis]

### CSS Defense
[Merchant CSS bleed risks for this specific site]

## Recommendations
[Prioritized fix list]
```
