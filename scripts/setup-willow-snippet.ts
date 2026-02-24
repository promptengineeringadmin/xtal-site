/**
 * One-shot script to configure the Willow snippet in Redis.
 * Sets: snippet_enabled, search_selector, site_url, card_template
 *
 * Usage: npx tsx scripts/setup-willow-snippet.ts
 * (requires .env.local to be loaded — see README)
 */

import {
  saveSnippetEnabled,
  saveSnippetSearchSelector,
  saveSnippetSiteUrl,
  saveSnippetDisplayMode,
  saveSnippetResultsSelector,
  saveCardTemplate,
  saveProductUrlPattern,
} from "../lib/admin/admin-settings"

const COLLECTION = "willow"

// ─── Card Template ─────────────────────────────────────────
// Matches Willow's native product card style (Manrope font, SKU, title, price)

// Uses merchant-native CSS classes so inline mode inherits page styles.
// The CSS below mirrors the scraped page styles for overlay fallback.
const TEMPLATE_HTML = `<div class="product-card" data-xtal-action="view-product">
  <div class="product-image">
    <img src="{{image_url}}" alt="{{title}}" loading="lazy" />
  </div>
  {{#sku}}<div class="product-sku">{{sku}}</div>{{/sku}}
  <div class="product-name">{{title}}</div>
  {{#dimensions}}<div class="product-dims">{{dimensions}}</div>{{/dimensions}}
  <div class="product-price-row">
    <div class="product-price">{{#compare_at_price}}<span class="original">\${{compare_at_price}}</span> {{/compare_at_price}}<span>\${{price}}</span></div>
    {{#min_qty}}<div class="product-min-qty">Min Qty: {{min_qty}}</div>{{/min_qty}}
  </div>
  <button class="product-cta" data-xtal-action="add-to-cart">Add To Cart</button>
</div>`

const TEMPLATE_CSS = `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600&display=swap');

.xtal-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  padding: 20px 0 40px 32px;
  align-content: flex-start;
}
.product-card {
  width: calc((100% - 64px) / 3);
  cursor: pointer;
  font-family: 'Manrope', sans-serif;
  color: #1d1d1b;
}
.product-image {
  width: 100%;
  aspect-ratio: 1;
  background: #f0eeea;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 8px;
}
.product-image img { width: 100%; height: 100%; object-fit: contain; }
.product-sku { font-size: 14px; color: #787878; margin-bottom: 2px; }
.product-name { font-size: 16px; font-weight: 600; color: #1d1d1b; margin-bottom: 2px; }
.product-dims { font-size: 14px; color: #1d1d1b; }
.product-price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 4px;
}
.product-price { font-size: 14px; color: #1d1d1b; }
.product-price .original { text-decoration: line-through; color: #787878; margin-right: 4px; }
.product-price .sale { color: rgb(200, 50, 50); }
.product-min-qty { font-size: 14px; color: #787878; }
.product-cta {
  display: block;
  width: 100%;
  padding: 10px 0;
  margin-top: 8px;
  background: #1d1d1b;
  color: #fff;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
}`

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log(`Configuring snippet for collection: ${COLLECTION}`)

  await Promise.all([
    saveSnippetEnabled(COLLECTION, true),
    saveSnippetSearchSelector(COLLECTION, "#search_field"),
    saveSnippetDisplayMode(COLLECTION, "inline"),
    saveSnippetResultsSelector(COLLECTION, ".product-grid"),
    saveSnippetSiteUrl(COLLECTION, "https://www.willowgroupltd.com"),
    saveCardTemplate(COLLECTION, { html: TEMPLATE_HTML, css: TEMPLATE_CSS }),
    saveProductUrlPattern(COLLECTION, "https://www.willowgroupltd.com/shop/{sku}?position=-1"),
  ])

  console.log("Done! Settings saved:")
  console.log("  snippet_enabled: true")
  console.log('  search_selector: #search_field')
  console.log("  display_mode: inline")
  console.log("  results_selector: .product-grid")
  console.log("  site_url: https://www.willowgroupltd.com")
  console.log("  product_url_pattern: https://www.willowgroupltd.com/shop/{sku}?position=-1")
  console.log("  card_template: Willow-native classes (product-card, product-image, etc.)")
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
