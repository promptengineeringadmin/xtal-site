/**
 * generate-card-template.mjs — LLM-powered card template generation from extracted styles.
 *
 * Reads extracted-styles.json, sends the product card data to Claude,
 * gets back an HTML template + CSS that visually matches the merchant's native cards,
 * and stores the result in Redis for the SDK overlay to consume.
 *
 * Usage:
 *   # Load env vars first
 *   export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
 *
 *   node scripts/generate-card-template.mjs \
 *     --input public/sandbox/willow-real/extracted-styles.json \
 *     --collection willow
 *
 *   # Or with --dry-run to just see the output without saving to Redis:
 *   node scripts/generate-card-template.mjs \
 *     --input public/sandbox/willow-real/extracted-styles.json \
 *     --collection willow \
 *     --dry-run
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load .env.local ────────────────────────────────────────
try {
  const envPath = path.resolve(__dirname, "../.env.local");
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on existing env vars
}

// ─── Parse CLI args ─────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
}
const inputPath = getArg("input");
const collection = getArg("collection");
const dryRun = args.includes("--dry-run");

if (!inputPath || !collection) {
  console.log(
    "Usage: node scripts/generate-card-template.mjs --input <extracted-styles.json> --collection <name> [--dry-run]"
  );
  process.exit(1);
}

// ─── System prompt for Claude ───────────────────────────────
const SYSTEM_PROMPT = `You are a frontend engineer generating an HTML card template + CSS for an embeddable search overlay. The overlay replaces a merchant's native search results with XTAL-powered results, but the cards must be visually indistinguishable from the merchant's native product cards.

You will receive extracted computed styles and HTML from the merchant's actual product cards. Your job is to produce a card template that recreates that visual design.

## Template syntax

- \`{{field}}\` — replaced with the field value
- \`{{#field}}...{{/field}}\` — included only if field is truthy (non-empty string)
- \`{{^field}}...{{/field}}\` — included only if field is falsy (empty/missing)

## Available template tokens

| Token | Description |
|-------|-------------|
| \`{{image_url}}\` | Product image URL |
| \`{{title}}\` | Product title/name |
| \`{{id}}\` | Product ID (often displayed as SKU) |
| \`{{price}}\` | Current price (formatted, e.g. "5.55") |
| \`{{compare_at_price}}\` | Original price before discount (if on sale) |
| \`{{vendor}}\` | Brand/vendor name |
| \`{{product_type}}\` | Product category |
| \`{{dimensions}}\` | Physical dimensions (from product tags, may be empty) |
| \`{{min_qty}}\` | Minimum order quantity (from product tags, may be empty) |
| \`{{available}}\` | "true" if in stock, empty if not |
| \`{{description}}\` | Product description text |
| \`{{sku}}\` | Variant SKU |
| \`{{tags}}\` | Comma-separated product tags |

## Action attributes

- \`data-xtal-action="view-product"\` — on <a> tags or clickable elements, navigates to product page
- \`data-xtal-action="add-to-cart"\` — on <button> elements, triggers add-to-cart behavior

## Rules

1. Prefix ALL CSS class names with \`xw-\` to avoid conflicts (e.g. \`xw-card\`, \`xw-title\`)
2. The CSS must override the overlay's default \`.xtal-grid\` styles to match the merchant's grid layout (columns, gap, background)
3. Include a \`@import\` for any custom fonts the merchant uses
4. Use the exact colors, font sizes, font weights, and spacing from the extracted styles
5. Make the template responsive: specify breakpoints for tablet (2-col) and mobile (1-col) if the merchant's grid is multi-column
6. Only include fields that the merchant's native cards actually display. If the merchant doesn't show prices, don't include price tokens. If they show SKU, include \`{{id}}\`.
7. Wrap optional fields in conditionals: \`{{#field}}...{{/field}}\`
8. Use \`data-xtal-action="view-product"\` on the image link and title link

## Output format

Return ONLY a JSON object with two fields:
\`\`\`json
{
  "html": "<div class=\\"xw-card\\">...</div>",
  "css": "@import ...; .xw-card { ... } .xtal-grid { ... }"
}
\`\`\`

No markdown code fences, no explanation — just the JSON object.`;

// ─── Build the user prompt from extracted data ──────────────
function buildUserPrompt(extracted) {
  // Extract just the relevant card data — not the full JSON
  const cardData = {
    bodyStyles: extracted.body?.styles,
    productGrid: extracted.productGrid,
    products: (extracted.products || []).slice(0, 3).map((p) => ({
      imgStyles: p.imgStyles,
      cardStyles: p.cardStyles,
      imageContainerStyles: p.imageContainerStyles,
      texts: p.texts,
      cardHTML: p.cardHTML,
    })),
  };

  return `Here is the extracted style data from a merchant's product search page. Generate a card template + CSS that visually matches their native product cards.

## Extracted card data

\`\`\`json
${JSON.stringify(cardData, null, 2)}
\`\`\`

Analyze the card structure:
- Look at the \`texts\` array to understand what fields are displayed and in what order
- Look at \`cardStyles\`, \`imgStyles\`, and individual text element styles for exact CSS values
- Look at \`cardHTML\` to understand the HTML structure
- Look at \`productGrid\` for the grid layout (columns, gap)
- Look at \`bodyStyles\` for the page background color and base font

Generate the template HTML and CSS that recreates this card design using the template tokens listed in your instructions.`;
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  // Read extracted styles
  const fullPath = path.resolve(inputPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }
  const extracted = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  console.log(
    `Read extracted styles: ${extracted.products?.length || 0} products`
  );

  // Check for Claude API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY env var");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userPrompt = buildUserPrompt(extracted);

  console.log("Calling Claude API...");
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Extract the text response
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Parse the JSON response
  let template;
  try {
    // Try parsing directly
    template = JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown code fences
    const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (match) {
      template = JSON.parse(match[1]);
    } else {
      console.error("Failed to parse Claude response as JSON:");
      console.error(text);
      process.exit(1);
    }
  }

  if (!template.html || !template.css) {
    console.error("Response missing html or css field:");
    console.error(JSON.stringify(template, null, 2));
    process.exit(1);
  }

  console.log(`\nGenerated template:`);
  console.log(`  HTML: ${template.html.length} chars`);
  console.log(`  CSS: ${template.css.length} chars`);

  // Save locally for inspection
  const outputDir = path.dirname(fullPath);
  const localPath = path.join(outputDir, "card-template.json");
  fs.writeFileSync(localPath, JSON.stringify(template, null, 2), "utf-8");
  console.log(`  Saved to: ${localPath}`);

  if (dryRun) {
    console.log("\n--dry-run: skipping Redis save");
    console.log("\n=== HTML ===");
    console.log(template.html);
    console.log("\n=== CSS ===");
    console.log(template.css);
    return;
  }

  // Save to Redis
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    console.error(
      "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN — skipping Redis save"
    );
    console.log("Template saved locally only. Set it manually or re-run with env vars.");
    return;
  }

  // Dynamic import for @upstash/redis (ESM)
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url: redisUrl.trim(), token: redisToken.trim() });
  const key = `admin:settings:${collection}:card_template`;
  await redis.set(key, template);

  // Verify
  const stored = await redis.get(key);
  console.log(
    `  Stored in Redis: ${key} (${stored?.html ? "OK" : "FAILED"})`
  );
  console.log("\nDone! Restart dev server or wait for config cache to expire (5 min).");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
