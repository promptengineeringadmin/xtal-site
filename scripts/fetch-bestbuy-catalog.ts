/**
 * Fetch the entire Best Buy product catalog via their Products API.
 * Paginates through all pages (100 products per page) and writes
 * a single JSONL file (one JSON object per line) for easy streaming ingestion.
 *
 * Usage:
 *   npx tsx scripts/fetch-bestbuy-catalog.ts
 *
 * Env:
 *   BESTBUY_API_KEY  — your Best Buy developer API key
 *
 * Output:
 *   data/bestbuy-catalog.jsonl
 */

import fs from "fs";
import path from "path";

const API_KEY = process.env.BESTBUY_API_KEY;
if (!API_KEY) {
  console.error("Set BESTBUY_API_KEY env var");
  process.exit(1);
}

const BASE = "https://api.bestbuy.com/v1/products";
const PAGE_SIZE = 100;
const CONCURRENT = 1; // sequential — BB rate limit is strict (~1 req/sec)
const DELAY_MS = 1100; // pause between requests to stay under rate limits

// Fields to fetch — covers product info, pricing, images, reviews, availability
const SHOW_FIELDS = [
  "sku",
  "name",
  "type",
  "regularPrice",
  "salePrice",
  "onSale",
  "manufacturer",
  "modelNumber",
  "upc",
  "categoryPath.id",
  "categoryPath.name",
  "shortDescription",
  "longDescription",
  "image",
  "thumbnailImage",
  "largeFrontImage",
  "mediumImage",
  "url",
  "addToCartUrl",
  "customerReviewAverage",
  "customerReviewCount",
  "bestSellingRank",
  "color",
  "condition",
  "inStoreAvailability",
  "onlineAvailability",
  "freeShipping",
  "shippingCost",
  "startDate",
  "new",
  "active",
  "lowPriceGuarantee",
  "productTemplate",
  "genre",
  "platform",
  "releaseDate",
  "weight",
  "height",
  "width",
  "depth",
].join(",");

const OUT_DIR = path.join(process.cwd(), "data");
const OUT_FILE = path.join(OUT_DIR, "bestbuy-catalog.jsonl");

interface BBProduct {
  sku: number;
  name: string;
  [key: string]: unknown;
}

interface BBResponse {
  from: number;
  to: number;
  currentPage: number;
  total: number;
  totalPages: number;
  products: BBProduct[];
}

async function fetchPage(page: number): Promise<BBResponse> {
  const url = `${BASE}?format=json&show=${SHOW_FIELDS}&pageSize=${PAGE_SIZE}&page=${page}&apiKey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Page ${page} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<BBResponse>;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // Ensure output dir exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // First request to get total
  console.log("Fetching page 1 to get total count...");
  const first = await fetchPage(1);
  const totalProducts = first.total;
  const totalPages = first.totalPages;
  console.log(
    `Total: ${totalProducts} products across ${totalPages} pages (${PAGE_SIZE}/page)`
  );

  // Open write stream
  const ws = fs.createWriteStream(OUT_FILE);

  // Write first page
  let written = 0;
  for (const p of first.products) {
    ws.write(JSON.stringify(p) + "\n");
    written++;
  }
  console.log(`Page 1/${totalPages} — ${written} products written`);

  // Fetch remaining pages in batches of CONCURRENT
  let page = 2;
  let retries = 0;
  const MAX_RETRIES = 5;

  while (page <= totalPages) {
    const batch: number[] = [];
    for (let i = 0; i < CONCURRENT && page + i - 1 < totalPages; i++) {
      batch.push(page + i);
    }

    try {
      const results = await Promise.all(batch.map((p) => fetchPage(p)));
      for (const result of results) {
        for (const p of result.products) {
          ws.write(JSON.stringify(p) + "\n");
          written++;
        }
      }
      const lastPage = batch[batch.length - 1];
      if (lastPage % 25 === 0 || lastPage === totalPages) {
        const pct = ((written / totalProducts) * 100).toFixed(1);
        console.log(
          `Page ${lastPage}/${totalPages} — ${written}/${totalProducts} (${pct}%)`
        );
      }
      page += batch.length;
      retries = 0;
      await sleep(DELAY_MS);
    } catch (err: unknown) {
      retries++;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `Error on batch starting page ${page} (retry ${retries}/${MAX_RETRIES}): ${msg}`
      );
      if (retries >= MAX_RETRIES) {
        console.error(`Max retries exceeded at page ${page}, aborting.`);
        break;
      }
      // Back off before retry
      await sleep(2000 * retries);
    }
  }

  ws.end();
  console.log(`\nDone! ${written} products written to ${OUT_FILE}`);

  // File size
  const stat = fs.statSync(OUT_FILE);
  const mb = (stat.size / 1024 / 1024).toFixed(1);
  console.log(`File size: ${mb} MB`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
