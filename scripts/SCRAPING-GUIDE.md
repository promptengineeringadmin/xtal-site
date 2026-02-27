# Site Scraping Guide

Standardized reference for `scrape-site.mjs` — what works, what doesn't, and how to diagnose failures.

## Pipeline Overview

```
scrape-site.mjs <home-url> --slug <name> --search <search-url> [--query <q>]
```

1. Launch Chromium via Playwright (headless, uses local Chrome/Edge)
2. Scrape **home page** — intercept CSS/font network responses, capture rendered HTML
3. Scrape **search page** — same interception, wait for product elements
4. Auto-detect search input selector (priority: `form[role=search]` > `id*=search` > `type=search` > `name*=search` > `aria-label` > `placeholder`)
5. Extract inline/dynamic stylesheets from `document.styleSheets`
6. **Rewrite HTML** — strip `<script>`, strip `<base>`, rewrite `<link href>` to local paths
7. **Rewrite CSS** — localize font `url()` references, proxy remaining `url()` to origin
8. Save everything to `public/sandbox/<slug>/`
9. Write `manifest.json` (collection, searchSelector, sourceUrl, searchUrl)

### Output Structure
```
public/sandbox/<slug>/
  home.html              # Rendered home page (scripts stripped)
  search.html            # Rendered search results page
  home-screenshot.png    # Full-page screenshot
  search-screenshot.png
  css/
    style-0.css          # Intercepted external stylesheets
    style-1.css
    dynamic-home.css     # Inline/dynamic styles extracted from DOM
    dynamic-search.css
  fonts/
    font-0.woff2         # Intercepted font files
  manifest.json          # SDK config (collection, searchSelector)
```

## CSS URL Rewriting Rules

### The Core Problem
Playwright's `response.url()` returns the **full absolute URL** (e.g., `https://example.com/css/main.css`), but `page.content()` returns HTML with **original attribute values** — typically relative paths (`/css/main.css`). A naive regex match against the full URL silently fails for same-origin resources.

### Solution: Triple-Matching Strategy
Every URL rewrite must try the full URL, pathname+query, and pathname alone:

```js
// Strategy 1: Full URL (catches CDN/cross-origin)
html.replace(new RegExp(`href=["']${fullUrl}["']`), localPath);

// Strategy 2: Pathname + query string (catches versioned URLs like /css/main.css?v=1.2)
const { pathname, search } = new URL(fullUrl);
html.replace(new RegExp(`href=["']${pathname + search}["']`), localPath);

// Strategy 3: Pathname only (catches same-origin relative paths without query strings)
html.replace(new RegExp(`href=["']${pathname}["']`), localPath);
```

**This applies to:**
- `<link href="...">` tags in HTML (CSS files)
- `url()` references in CSS (fonts)
- Any other asset URL matching

### Query String Gotcha
Some sites use versioned CSS URLs like `/css/main.css?version=1.00000005`. Playwright's `response.url()` includes the query string, and `new URL().pathname` strips it — but the HTML has the full path+query. You need Strategy 2 to match these.

### Font URL Rewriting
Same dual-matching for font references inside CSS files. Match both:
- `url("https://example.com/fonts/font.woff2")` (full URL)
- `url("/fonts/font.woff2")` (pathname)

### Remaining url() References
After font rewriting, CSS files still contain `url("/images/bg.jpg")`, `url("/media/icon.svg")` etc. These are rewritten to absolute origin URLs:
```
url("/images/bg.jpg") → url("https://example.com/images/bg.jpg")
```
The negative lookahead `(?!sandbox/)` prevents double-rewriting paths already localized.

## Known Edge Cases

### `<base href="/">` Tag
Many sites include `<base href="/">` which makes all relative URLs resolve to the server root. In our sandbox, this means `/sandbox/slug/css/style.css` resolves to the Next.js root instead. **Always strip `<base>` tags** from saved HTML.

### SPA / Angular Hash Routes
Sites like Willow use Angular with hash routing (`/#/search/query`). The scraper:
- Waits for `domcontentloaded` + `networkidle` (with timeout fallback)
- Adds 3s extra delay for client-side rendering
- Uses `waitForSelector` on product-like elements for search pages

### Preload / Onload Patterns
Some `<link>` tags use `rel="preload"` with `onload="this.rel='stylesheet'"`. After stripping `<script>`, these never activate. The scraper captures these CSS files via network interception and saves them, but the HTML `<link>` tags may still have `rel="preload"`. The dynamic stylesheet extraction (`document.styleSheets`) captures the applied styles as a fallback.

### `<noscript>` Fallback Stylesheets
Some sites put `<link>` tags inside `<noscript>` blocks. Since Playwright runs with JS enabled, these aren't loaded. The rendered HTML may still contain them. Not harmful but they won't match intercepted CSS.

### CORS-Blocked Fonts
CDN-hosted fonts (Google Fonts, Adobe Fonts) may block body reads due to CORS. The scraper logs these as `Font (CORS blocked)` and continues. These fonts will load from CDN at runtime if the CSS `@font-face` URL wasn't rewritten.

### Cross-Origin CSS
CSS files from CDNs (e.g., `fonts.googleapis.com`) are intercepted by full URL. These already match correctly because the HTML `<link href>` uses the full CDN URL. The dual-matching strategy handles this case via Strategy 1.

## Post-Scrape Checklist

After every scrape, verify:

1. **CSS rewriting**: `grep 'href="/css/' public/sandbox/<slug>/home.html` should return **zero** matches. All should be `href="/sandbox/<slug>/css/..."`.

2. **No `<base>` tag**: `grep '<base' public/sandbox/<slug>/home.html` should return zero.

3. **No `<script>` tags**: `grep '<script' public/sandbox/<slug>/home.html` should return zero.

4. **Font references**: Open a CSS file and check `url()` references — should be either `/sandbox/<slug>/fonts/...` or `https://origin/path/...`, never bare `/fonts/...`.

5. **Visual check**: Load `http://localhost:3000/sandbox/site-clone/<slug>` and compare to the original site. Key things: layout, fonts, colors, images.

6. **Search selector**: Check `manifest.json` has a `searchSelector`. If missing, the SDK won't hook the search input. Re-run with `--search-selector '<css>'`.

7. **DevTools Network**: Open Network tab — no 404s for CSS or font files.

## Common Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Page completely unstyled | CSS `<link>` hrefs not rewritten | Check dual-matching is working (full URL + pathname) |
| Fonts missing / wrong | Font `url()` in CSS not rewritten | Same dual-matching issue in CSS body |
| Images/backgrounds missing | `url("/path")` in CSS 404s locally | Origin rewriting should proxy these to source |
| Layout broken but styles load | `<base href="/">` present | Strip `<base>` tags |
| Search SDK doesn't activate | No `searchSelector` in manifest | Run with `--search-selector` or verify auto-detection |
| Page blank / no content | SPA didn't render in time | Increase `waitForTimeout` or add specific selector waits |

## What the SDK Needs

The SDK snippet (`xtal.js`) injected into a scraped page needs exactly:
1. A **search input** matching the `searchSelector` from `manifest.json`
2. The input must be inside a `<form>` (preferred) or standalone (Enter key fallback)
3. The `data-shop-id` attribute maps to the backend collection

The SDK uses Shadow DOM — it doesn't care about the page's CSS. The scraper's CSS rewriting is purely for **visual fidelity** of the sandbox demo page, not for SDK functionality.
