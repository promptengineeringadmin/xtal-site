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
  saveCardTemplate,
  saveProductUrlPattern,
} from "../lib/admin/admin-settings"

const COLLECTION = "willow"

// ─── Card Template ─────────────────────────────────────────
// Matches Willow's native product card style (Manrope font, SKU, title, price)

const TEMPLATE_HTML = `<div class="willow-card" data-xtal-action="view-product">
  <div class="willow-card-image">
    <img src="{{image_url}}" alt="{{title}}" loading="lazy" />
  </div>
  <div class="willow-card-body">
    {{#sku}}<div class="willow-sku">{{sku}}</div>{{/sku}}
    <div class="willow-name">{{title}}</div>
    {{#dimensions}}<div class="willow-dims">{{dimensions}}</div>{{/dimensions}}
    <div class="willow-price-row">
      {{#compare_at_price}}<span class="willow-price-original">\${{compare_at_price}}</span>{{/compare_at_price}}
      <span class="willow-price">\${{price}}</span>
    </div>
    {{#min_qty}}<div class="willow-min-qty">Min Qty: {{min_qty}}</div>{{/min_qty}}
  </div>
</div>`

const TEMPLATE_CSS = `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600&display=swap');

.willow-card {
  display: flex;
  flex-direction: column;
  font-family: 'Manrope', sans-serif;
  color: #1d1d1b;
  cursor: pointer;
  transition: opacity 0.15s;
}
.willow-card:hover { opacity: 0.85; }
.willow-card-image {
  aspect-ratio: 1;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  overflow: hidden;
}
.willow-card-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.willow-card-body { padding: 4px 0; }
.willow-sku { font-size: 13px; color: #787878; margin-bottom: 2px; }
.willow-name { font-size: 15px; font-weight: 600; line-height: 1.3; margin-bottom: 4px; }
.willow-dims { font-size: 13px; color: #555; margin-bottom: 4px; }
.willow-price-row { font-size: 14px; margin-bottom: 4px; }
.willow-price-original { text-decoration: line-through; color: #999; margin-right: 6px; }
.willow-price { font-weight: 600; }
.willow-min-qty { font-size: 12px; color: #787878; }`

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log(`Configuring snippet for collection: ${COLLECTION}`)

  await Promise.all([
    saveSnippetEnabled(COLLECTION, true),
    saveSnippetSearchSelector(COLLECTION, "#search_field"),
    saveSnippetSiteUrl(COLLECTION, "https://www.willowgroupltd.com"),
    saveCardTemplate(COLLECTION, { html: TEMPLATE_HTML, css: TEMPLATE_CSS }),
    saveProductUrlPattern(COLLECTION, "https://www.willowgroupltd.com/shop/{sku}?position=-1"),
  ])

  console.log("Done! Settings saved:")
  console.log("  snippet_enabled: true")
  console.log('  search_selector: #search_field')
  console.log("  site_url: https://www.willowgroupltd.com")
  console.log("  product_url_pattern: https://www.willowgroupltd.com/shop/{sku}?position=-1")
  console.log("  card_template: Willow-styled (Manrope, SKU, title, price)")
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
