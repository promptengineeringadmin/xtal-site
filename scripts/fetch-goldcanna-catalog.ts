/**
 * Fetch the Gold Canna product catalog from their Shopify products.json endpoint.
 * Parses body_html to extract terpenes, strain types, effects, and product formats
 * as structured tags for faceted search.
 *
 * Prices are stored in dollars (matching Qdrant convention).
 * Shopify returns prices as dollar strings — parsed to float, no conversion needed.
 *
 * Usage:
 *   npx tsx scripts/fetch-goldcanna-catalog.ts
 *
 * Output:
 *   data/goldcanna-catalog.jsonl
 */

import fs from "fs";
import path from "path";

const PRODUCTS_URL = "https://goldcanna.com/products.json";
const OUT_DIR = path.join(process.cwd(), "data");
const OUT_FILE = path.join(OUT_DIR, "goldcanna-catalog.jsonl");

// --- Known terpenes ---
const KNOWN_TERPENES = [
  "caryophyllene",
  "myrcene",
  "limonene",
  "pinene",
  "humulene",
  "linalool",
  "terpinolene",
  "ocimene",
  "bisabolol",
  "geraniol",
  "nerolidol",
  "valencene",
];

// --- Effect keyword patterns ---
const EFFECT_PATTERNS: [RegExp, string][] = [
  [/relax(ing|ation)|body\s+relaxation|full[- ]body\s+relaxation|body\s+high/i, "relaxation"],
  [/euphori(a|c)|uplifting\s+euphoria/i, "euphoria"],
  [/\bfocus\b|mental\s+clarity|clear[- ]headed|alertness/i, "focus"],
  [/creativ(ity|e)/i, "creativity"],
  [/\benergy\b|energiz(ing|e)|invigorat(ing|e)/i, "energy"],
  [/stress\s+(reduction|relief)|easing\s+stress/i, "stress-relief"],
  [/restful\s+sleep|\bsleep\b|sedat(ing|ive)/i, "sleep"],
  [/pain\s+relief|eases?\s+tension|melts?\s+away\s+tension/i, "pain-relief"],
  [/mood[- ]boost(ing)?|uplift(ing)?/i, "mood-boost"],
];

// --- Terpene extraction from HTML ---
function extractTerpenes(html: string): string[] {
  const terpenes: string[] = [];
  // Match <strong>TERPENE_NAME</strong> patterns
  const matches = Array.from(html.matchAll(/<strong>([^<]+)<\/strong>/gi));
  for (const match of matches) {
    const name = match[1].trim().toLowerCase();
    if (KNOWN_TERPENES.includes(name)) {
      terpenes.push(name);
    }
  }
  return [...new Set(terpenes)];
}

// --- Strain type extraction ---
function extractStrainType(html: string): string | null {
  const text = html.replace(/<[^>]*>/g, " ").toLowerCase();
  if (/indica[- ]dominant\s+hybrid/i.test(text) || /indica[- ]leaning\s+hybrid/i.test(text)) {
    return "indica-dominant-hybrid";
  }
  if (/sativa[- ]dominant\s+hybrid/i.test(text)) {
    return "sativa-dominant-hybrid";
  }
  if (/balanced\s+hybrid|harmonious\s+balance/i.test(text)) {
    return "hybrid";
  }
  if (/pure\s+indica|purely\s+indica|classic\s+indica|soothing\s+indica|\bindica\s+strain\b/i.test(text)) {
    return "indica";
  }
  if (/pure\s+sativa|true\s+sativa|\bsativa\s+strain\b/i.test(text)) {
    return "sativa";
  }
  if (/\bhybrid\b/i.test(text)) {
    return "hybrid";
  }
  return null;
}

// --- Effect extraction ---
function extractEffects(html: string): string[] {
  const text = html.replace(/<[^>]*>/g, " ").toLowerCase();
  const effects: string[] = [];
  for (const [pattern, effect] of EFFECT_PATTERNS) {
    if (pattern.test(text)) {
      effects.push(effect);
    }
  }
  return [...new Set(effects)];
}

// --- Format extraction from title ---
function extractFormat(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("gummies") || t.includes("gummy")) return "gummies";
  if (t.includes("vape pod")) return "vape-pod";
  if (t.includes("live rosin") && !t.includes("vape")) return "live-rosin";
  if (t.includes("crumble")) return "crumble";
  if (t.includes("badder")) return "badder";
  if (t.includes("nuggets") || t.includes("gold nuggets")) return "nuggets";
  if (t.includes("flower") || t.includes("bulk flower")) return "flower";
  return "other";
}

// --- Human-readable format label ---
function formatLabel(format: string): string {
  const labels: Record<string, string> = {
    flower: "Flower",
    "live-rosin": "Live Rosin",
    crumble: "Crumble",
    badder: "Badder",
    "vape-pod": "Vape Pod",
    nuggets: "Gold Nuggets",
    gummies: "Gummies",
    other: "Other",
  };
  return labels[format] || format;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  images: { src: string; alt?: string }[];
  variants: {
    price: string;
    compare_at_price: string | null;
    available: boolean;
  }[];
}

interface OutputProduct {
  id: string;
  title: string;
  description: string;
  vendor: string;
  product_type: string;
  tags: string[];
  price: number;
  image_url: string | null;
  product_url: string;
  available: boolean;
  images: { src: string }[];
  variants: { price: number; compare_at_price: number | null }[];
}

function transformProduct(raw: ShopifyProduct): OutputProduct {
  const bodyHtml = raw.body_html || "";

  // Extract structured metadata
  const terpenes = extractTerpenes(bodyHtml);
  const strainType = extractStrainType(bodyHtml);
  const effects = extractEffects(bodyHtml);
  const format = extractFormat(raw.title);

  // Build tags array
  const tags: string[] = [];
  for (const t of terpenes) tags.push(`terpene_${t}`);
  if (strainType) tags.push(`strain-type_${strainType}`);
  for (const e of effects) tags.push(`effect_${e}`);
  tags.push(`format_${format}`);

  // Parse variants
  const variants = raw.variants.map((v) => ({
    price: parseFloat(v.price),
    compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
  }));

  // First available variant price, or first variant price
  const price = variants[0]?.price ?? 0;

  // Availability: true if any variant is available
  const available = raw.variants.some((v) => v.available);

  // Strip HTML for description (used for embedding)
  const description = bodyHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    id: String(raw.id),
    title: raw.title,
    description,
    vendor: raw.vendor || "Gold Standard",
    product_type: formatLabel(format),
    tags,
    price,
    image_url: raw.images?.[0]?.src || null,
    product_url: `https://goldcanna.com/products/${raw.handle}`,
    available,
    images: raw.images.map((img) => ({ src: img.src })),
    variants,
  };
}

async function main() {
  console.log(`Fetching products from ${PRODUCTS_URL}...`);
  const res = await fetch(PRODUCTS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { products: ShopifyProduct[] };
  const products = data.products;
  console.log(`Found ${products.length} products`);

  // Ensure output dir exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Transform and write
  const ws = fs.createWriteStream(OUT_FILE);
  let written = 0;

  for (const raw of products) {
    const product = transformProduct(raw);
    ws.write(JSON.stringify(product) + "\n");
    written++;

    // Log extraction details
    const terpTags = product.tags.filter((t) => t.startsWith("terpene_"));
    const effectTags = product.tags.filter((t) => t.startsWith("effect_"));
    const strainTag = product.tags.find((t) => t.startsWith("strain-type_"));
    const formatTag = product.tags.find((t) => t.startsWith("format_"));
    console.log(
      `  ${product.title} | ${formatTag || "?"} | ${strainTag || "?"} | terpenes: [${terpTags.map((t) => t.replace("terpene_", "")).join(", ")}] | effects: [${effectTags.map((t) => t.replace("effect_", "")).join(", ")}] | $${product.price} | ${product.available ? "in-stock" : "out-of-stock"}`
    );
  }

  await new Promise<void>((resolve, reject) => {
    ws.end(() => resolve());
    ws.on("error", reject);
  });
  console.log(`\nDone! ${written} products written to ${OUT_FILE}`);

  const stat = fs.statSync(OUT_FILE);
  const kb = (stat.size / 1024).toFixed(1);
  console.log(`File size: ${kb} KB`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
