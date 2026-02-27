# XTAL Snippet Testing Guide

How to test the SDK snippet locally, and how to deploy it on a live merchant site via GTM.

---

## Prerequisites

### 1. Build the SDK

```bash
npm run build:client
```

This compiles `client/src/index.ts` → `public/client/v1/xtal.js`. There is **no watch mode** — you must re-run this after every change to `client/src/`.

### 2. Configure Snippet in Redis (Willow)

```bash
# Load env vars
export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)

# Run setup script
npx tsx scripts/setup-willow-snippet.ts
```

This sets in Redis:
| Setting | Value |
|---------|-------|
| `snippet_enabled` | `true` |
| `search_selector` | `#search_field` |
| `display_mode` | `inline` |
| `results_selector` | `.product-grid` |
| `site_url` | `https://www.willowgroupltd.com` |
| `product_url_pattern` | `https://www.willowgroupltd.com/shop/{sku}?position=-1` |
| `card_template` | Willow-native HTML+CSS (Manrope font, SKU, price, ATC) |

### 3. Start Dev Server

```bash
npm run dev
```

---

## Local Testing

### Option A: Sandbox Storefront (quick, any collection)

**URL:** http://localhost:3000/sandbox/storefront

A fake Willow-style storefront with a Dev Tools panel (bottom-right button).

**Steps:**
1. Open the storefront URL
2. Click "Dev Tools" (bottom-right)
3. Go to **Script Injection** tab
4. Select the "Willow" preset (or paste custom snippet)
5. Click **Inject**
6. Type a search query in the search bar and press Enter
7. Results should appear in the product grid

**Dev Tools tabs:**
- **DOM Scenarios** — switch search input patterns (Shopify Dawn, WooCommerce, BigCommerce, SPA delayed, etc.) to test MutationObserver and selector detection
- **Script Injection** — inject/clear SDK scripts with presets for Willow, Best Buy, XTAL Demo
- **CORS Debug** — monitor all `/api/xtal/*` requests, check CORS headers, manual probe

**Good for:** rapid iteration, testing different DOM patterns, CORS debugging, SDK inject/destroy lifecycle.

---

### Option B: Site Clone (verisimilitude, real merchant HTML)

**URL:** http://localhost:3000/sandbox/site-clone/willow-real

The scraped Willow HTML is served in an iframe with the SDK auto-injected. Cards render using the card template from Redis, matching Willow's native design.

**Available slugs:**
| Slug | What's in it |
|------|-------------|
| `willow-real` | Full scrape + extracted styles + card template |
| `willow-clone` | Minimal scrape (no card template) |

**Query params:**
- `?q=baskets` — pre-fill search input with a query
- `?xtal=off` — load page without SDK injection
- `?page=home` — show homepage instead of search page

**Good for:** visual QA of card rendering, verifying the SDK matches the merchant's native look and feel.

#### Re-scraping (if site has changed)

```bash
# Step 1: Scrape pages
node scripts/scrape-site.mjs https://www.willowgroupltd.com \
  --slug willow-real \
  --search "https://www.willowgroupltd.com/#/search/{query}" \
  --query baskets

# Step 2: Extract styles from search page
node scripts/extract-search-styles.mjs \
  "https://www.willowgroupltd.com/shop?Search=baskets" \
  --slug willow-real

# Step 3: Generate card template (requires env vars)
export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
node scripts/generate-card-template.mjs \
  --input public/sandbox/willow-real/extracted-styles.json \
  --collection willow
```

---

## Live Testing on Willow

### Quick Test: Browser DevTools (instant, no deployment needed)

Open https://www.willowgroupltd.com in your browser, open DevTools console, and paste:

```js
var s = document.createElement('script');
s.src = 'https://www.xtalsearch.com/client/v1/xtal.js';
s.async = true;
s.dataset.shopId = 'willow';
document.head.appendChild(s);
```

**Prerequisites:**
- SDK must be deployed to Vercel production (`vercel --prod` from repo root)
- Snippet must be enabled in Redis (run `setup-willow-snippet.ts`)

### GTM Deployment (persistent, all visitors see it)

1. Log into [Google Tag Manager](https://tagmanager.google.com/) for the Willow container
2. Create a new **Tag** → **Custom HTML**
3. Paste this snippet:

```html
<script>
  (function(){
    var s = document.createElement('script');
    s.src = 'https://www.xtalsearch.com/client/v1/xtal.js';
    s.async = true;
    s.dataset.shopId = 'willow';
    document.head.appendChild(s);
  })();
</script>
```

4. Set **Trigger** to **All Pages**
5. **Submit** and **Publish** the container

The SDK will load on every page, fetch config from `https://www.xtalsearch.com/api/xtal/config?shopId=willow`, and hook the search input.

### Bookmarklet (one-click live-site injection)

Create a browser bookmark with this URL to instantly inject the SDK on any page:

```
javascript:void((function(){if(window.XTAL){window.XTAL.destroy()}var s=document.createElement('script');s.src='https://www.xtalsearch.com/client/v1/xtal.js?t='+Date.now();s.async=true;s.dataset.shopId='willow';document.head.appendChild(s)})())
```

**What it does:**
1. Destroys any existing SDK instance (`window.XTAL.destroy()`)
2. Injects a cache-busted `xtal.js` from production
3. Boots with `data-shop-id="willow"`

**Usage:**
1. Navigate to `willowgroupltd.com/shop?Search=baskets`
2. Click the bookmarklet
3. XTAL results should replace the product grid
4. Check Network tab for `/api/xtal/search-full` requests
5. Check Console for `[xtal.js]` log messages

**Changing shop ID:** Edit the bookmark and replace `'willow'` with another collection name.

### GTM Preview Mode (safe testing before publish)

Instead of publishing immediately:
1. After creating the tag, click **Preview** in GTM
2. Enter the Willow site URL
3. GTM opens the site in a debug session where only you see the tag firing
4. Verify the SDK works correctly
5. Then **Submit** and **Publish** when satisfied

---

## Willow-Specific Notes

- **Angular hash routing:** Willow uses `/#/search/...` hash routes. The SDK hooks the search `<input>`, not the router — this should work regardless of routing strategy.
- **Search selector:** `#search_field` — a standard ID selector.
- **Inline mode:** The SDK replaces the content of `.product-grid` with XTAL results. When the user navigates away and back, Angular re-renders the original grid.
- **Known risk:** If Angular re-renders `.product-grid` while the SDK is displaying results (e.g., on a route change the SDK didn't trigger), it could clobber the XTAL results. The SDK's `restore()` function handles cleanup, but mid-search re-renders could cause a flash.
- **Product URLs:** Pattern `https://www.willowgroupltd.com/shop/{sku}?position=-1` — clicking a result navigates to the product page.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| No results appearing | Verify config: `curl https://www.xtalsearch.com/api/xtal/config?shopId=willow` — should return `enabled: true` |
| SDK not hooking search input | Inspect DOM for `#search_field`. If it's not present at page load, the SDK's MutationObserver has 10s to find it. |
| CORS errors in console | All `/api/xtal/*` routes respond with `Access-Control-Allow-Origin: *`. If you see CORS errors, check that you're hitting the Vercel deployment, not localhost. |
| Cards look wrong | Re-run `generate-card-template.mjs` to regenerate from extracted styles |
| Config changes not taking effect | The config endpoint has a 5-minute browser cache (`Cache-Control: public, max-age=300`). Hard-refresh or wait. |
| "Collection not found" from config | The `shopId` must match a known collection in `COLLECTIONS` (hardcoded) or `demo:collections` (Redis) |
| SDK loads but nothing happens | Check console for `[XTAL]` log messages. The SDK logs its boot sequence. If config returns `enabled: false`, it silently stops. |

---

## SDK Architecture (Quick Reference)

```
<script data-shop-id="willow" src="/client/v1/xtal.js">
  │
  ├─ GET /api/xtal/config?shopId=willow
  │   → { enabled, searchSelector, displayMode, resultsSelector, cardTemplate, ... }
  │
  ├─ attachInterceptor(searchSelector)
  │   → hooks form submit + Enter key on the search input
  │   → MutationObserver fallback if input not in DOM yet
  │
  └─ on search query:
      POST /api/xtal/search-full
        → { results, aspects, ... }
        → InlineRenderer.renderCards() replaces resultsSelector innerHTML
        → Cards use cardTemplate (Mustache-style {{field}} tokens)
```

**Key files:**
- SDK source: `client/src/`
- Built output: `public/client/v1/xtal.js`
- Config endpoint: `src/app/api/xtal/config/route.ts`
- Search endpoint: `src/app/api/xtal/search-full/route.ts`
- Admin settings: `lib/admin/admin-settings.ts`
- Willow setup: `scripts/setup-willow-snippet.ts`
- Sandbox storefront: `src/app/(sandbox)/sandbox/storefront/`
- Site clone route: `src/app/(sandbox)/sandbox/site-clone/[slug]/`
