/**
 * Per-query LLM analysis for teardown comparisons.
 *
 * After search results are collected and graded, this module calls Claude
 * to generate rich per-query narratives: shopper intent, what happened,
 * and customer impact. These fill the whitespace in comparison slides.
 *
 * Single API call batches all comparisons (~$0.50 per teardown).
 */

import Anthropic from "@anthropic-ai/sdk"
import type { QueryComparison, QueryAnalysis } from "./types"

// Store type descriptions from COLLECTION_CONFIG in apply-search-settings.mjs
const STORE_TYPES: Record<string, string> = {
  sixpenny: "Modern modular furniture retailer",
  arhaus: "Luxury home furnishings retailer",
  parachute: "Sustainable home goods retailer",
  "maiden-home": "Custom upholstered furniture retailer",
  revival: "Vintage rug marketplace",
  "lulu-and-georgia": "Contemporary home decor retailer",
  "the-citizenry": "Artisan home goods retailer",
  "abc-carpet-and-home": "Home furnishings and decor retailer",
  floyd: "Modular furniture retailer",
  brooklinen: "Premium bedding and linens retailer",
  "dania-furniture": "Modern furniture retailer",
  "clive-coffee": "Espresso equipment specialty retailer",
  "simon-pearce": "Handblown glass artisan retailer",
  threadheads: "Graphic t-shirt retailer",
  micas: "Women's fashion apparel retailer",
  bloomchic: "Plus-size fashion retailer",
  volcom: "Surf and skate apparel brand",
  "tony-bianco": "Women's footwear retailer",
  "nine-west": "Women's footwear retailer",
  veiled: "Modest fashion apparel retailer",
  "lola-and-the-boys": "Kids' fashion apparel retailer",
  "jenni-kayne": "Contemporary apparel and home goods retailer",
  "260-sample-sale": "Luxury sample sale marketplace",
  kosas: "Clean beauty retailer",
  colourpop: "Makeup and cosmetics retailer",
  glossier: "Prestige beauty brand",
  "rare-beauty-rare-beauty-brands": "Prestige beauty brand",
  "fenty-beauty-kendo-brands": "Prestige beauty brand",
  "kylie-cosmetics": "Celebrity beauty brand",
  "pacifica-beauty": "Natural beauty and skincare retailer",
  morphe: "Makeup and cosmetics retailer",
  "khy-by-kylie-jenner": "Celebrity fashion and beauty brand",
  nonda: "Car tech accessories retailer",
  skullcandy: "Consumer audio brand",
  "turtle-beach": "Gaming headset manufacturer",
  jlab: "Audio equipment retailer",
  "headphones-com": "Audio equipment specialty retailer",
  wyze: "Smart home device manufacturer",
  casely: "Phone case and tech accessories retailer",
  bluetti: "Portable power station manufacturer",
  "speck-products": "Phone case manufacturer",
  plugable: "USB and docking station specialist",
  "alien-gear-holsters": "Gun holster manufacturer",
  spyderco: "Tactical knife and EDC gear retailer",
  "pair-eyewear": "Online eyewear retailer",
  "goal-zero": "Portable solar power equipment manufacturer",
  "shop-solar-kits": "Solar panel systems retailer",
  "mustang-survival": "Marine safety equipment retailer",
  westinghouse: "Home appliance manufacturer",
  olipop: "Functional soda beverage brand",
  spindrift: "Functional sparkling water brand",
  "liquid-death": "Lifestyle beverage brand",
  "liquid-death-merch": "Lifestyle merchandise brand",
  "supermarket-italy": "Italian specialty foods retailer",
  "new-era-cap": "Licensed sports apparel and headwear retailer",
  "books-of-wonder": "Children's bookstore",
  "film-art-gallery": "Vintage entertainment memorabilia retailer",
  gspawn: "Numismatic and rare coins retailer",
  ohuhu: "Art supplies and markers retailer",
  "heirloom-roses": "Heirloom plant nursery",
  "uncommon-goods": "Unique gift and lifestyle retailer",
  "bonus-home-heatonist": "Hot sauce specialty retailer",
  bestbuy: "Consumer electronics big-box retailer",
  willow: "Wicker basket and hamper retailer",
  goldcanna: "Cannabis dispensary",
  xtaldemo: "Multi-category demo store",
}

const MODEL = "claude-sonnet-4-6"

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return client
}

function formatPrice(price: number | number[] | undefined): string {
  if (price == null) return "no price"
  const val = Array.isArray(price) ? price[0] : price
  return `$${val.toFixed(2)}`
}

function buildComparisonBlock(comp: QueryComparison, idx: number): string {
  const merchantItems = comp.merchant.results
    .slice(0, 6)
    .map((r, i) => `  ${i + 1}. "${r.title}" (${formatPrice(r.price)})`)
    .join("\n")

  const xtalItems = comp.xtal.results
    .slice(0, 6)
    .map((r, i) => `  ${i + 1}. "${r.title}" (${formatPrice(r.price)})`)
    .join("\n")

  const grade = comp.grade
    ? `Grade: ${comp.grade.letter} (${comp.grade.score}/100) — ${comp.grade.reason}`
    : "Grade: not available"

  return `--- Query ${idx + 1} ---
Query: "${comp.query}"
Category: ${comp.category}
Intent: ${comp.intent}
${grade}

Merchant results (${comp.merchant.resultCount} total${comp.merchant.error ? `, ERROR: ${comp.merchant.error}` : ""}):
${merchantItems || "  (no results)"}

XTAL results (${comp.xtal.resultCount} total):
${xtalItems || "  (no results)"}`
}

export async function analyzeComparisons(
  comparisons: QueryComparison[],
  merchantName: string,
  merchantId: string,
): Promise<QueryAnalysis[]> {
  const storeType = STORE_TYPES[merchantId] || "online retailer"

  const comparisonBlocks = comparisons
    .map((c, i) => buildComparisonBlock(c, i))
    .join("\n\n")

  const systemPrompt = `You are a search quality analyst specializing in e-commerce. You write concise, specific analysis — never generic filler. You reference actual product names, prices, and catalog gaps. Your tone is direct, analytical, and focused on business impact.

You have deep knowledge of retail brands and their product catalogs. Use this knowledge to contextualize search results — e.g., if a beauty brand's search fails on a product category they're known for, call that out specifically.`

  const userPrompt = `Analyze these ${comparisons.length} search comparison results for ${merchantName} (${storeType}).

For EACH query, provide exactly 3 fields:
- shopperIntent: What a real shopper typing this query expects to find. One sentence, specific to this brand. Reference actual product categories or lines when relevant.
- whatHappened: What the merchant's search actually returned vs what XTAL returned. Be specific — mention product names, prices, whether results are relevant or off-topic. Two to three sentences.
- customerImpact: Why this specific failure (or success) matters for revenue or customer experience. One sentence.

${comparisonBlocks}

Respond with a JSON array of ${comparisons.length} objects, one per query in the same order. Each object has exactly these 3 string fields: shopperIntent, whatHappened, customerImpact.

Return ONLY the JSON array, no markdown fences or explanation.`

  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  // Parse JSON — handle possible markdown wrapping
  const jsonStr = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()

  const parsed = JSON.parse(jsonStr) as QueryAnalysis[]

  if (!Array.isArray(parsed) || parsed.length !== comparisons.length) {
    throw new Error(
      `Expected ${comparisons.length} analyses, got ${Array.isArray(parsed) ? parsed.length : "non-array"}`,
    )
  }

  return parsed
}
