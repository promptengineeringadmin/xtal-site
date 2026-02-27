/**
 * Fetch Prospect Catalog — Download full product catalogs from Shopify stores
 *
 * Reads probe results to find teardown-ready vendors, then fetches their
 * full product catalog from /products.json (paginated, 250/page).
 *
 * Generic Shopify product transform: strips HTML, parses tags, normalizes prices.
 * No domain-specific extraction (unlike goldcanna which extracts terpenes/effects).
 *
 * Usage:
 *   npx tsx scripts/fetch-prospect-catalog.ts                     # all ready vendors
 *   npx tsx scripts/fetch-prospect-catalog.ts --vendor sixpenny   # single vendor
 *   npx tsx scripts/fetch-prospect-catalog.ts --force             # refetch existing
 */

import * as fs from "fs"
import * as path from "path"
import type { ProbeResult } from "./teardown/types"

// ── Types ────────────────────────────────────────────────────

interface ShopifyProduct {
  id: number
  title: string
  handle: string
  body_html: string | null
  vendor: string
  product_type: string
  tags: string
  created_at: string
  updated_at: string
  images: { src: string; alt?: string }[]
  variants: {
    id: number
    title: string
    price: string
    compare_at_price: string | null
    sku: string
    available: boolean
  }[]
}

interface OutputProduct {
  id: string
  title: string
  description: string
  vendor: string
  product_type: string
  tags: string[]
  price: number
  compare_at_price: number | null
  image_url: string | null
  product_url: string
  handle: string
  available: boolean
  sku: string
  images: { src: string }[]
}

// ── Logging ──────────────────────────────────────────────────

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

// ── Product transform ────────────────────────────────────────

function transformProduct(
  raw: ShopifyProduct,
  domain: string,
): OutputProduct {
  const bodyHtml = raw.body_html || ""

  // Strip HTML for description
  const description = bodyHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // Parse comma-separated tags
  const tags = raw.tags
    ? raw.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : []

  // Parse variants
  const firstVariant = raw.variants[0]
  const price = firstVariant ? parseFloat(firstVariant.price) : 0
  const compareAt = firstVariant?.compare_at_price
    ? parseFloat(firstVariant.compare_at_price)
    : null

  // Availability: true if any variant is available
  const available = raw.variants.some((v) => v.available)

  // SKU from first variant
  const sku = firstVariant?.sku || ""

  return {
    id: String(raw.id),
    title: raw.title,
    description,
    vendor: raw.vendor || domain,
    product_type: raw.product_type || "",
    tags,
    price,
    compare_at_price: compareAt,
    image_url: raw.images?.[0]?.src || null,
    product_url: `https://${domain}/products/${raw.handle}`,
    handle: raw.handle,
    available,
    sku,
    images: raw.images.map((img) => ({ src: img.src })),
  }
}

// ── Fetch full catalog ───────────────────────────────────────

async function fetchCatalog(
  domain: string,
  slug: string,
): Promise<OutputProduct[]> {
  const products: OutputProduct[] = []
  let page = 1

  while (true) {
    const url = `https://${domain}/products.json?limit=250&page=${page}`
    log(`    Page ${page}: ${url}`)

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      log(`    Page ${page}: HTTP ${res.status} — stopping pagination`)
      break
    }

    const data = (await res.json()) as { products: ShopifyProduct[] }
    if (!data.products || data.products.length === 0) break

    for (const raw of data.products) {
      products.push(transformProduct(raw, domain))
    }

    log(`    Page ${page}: ${data.products.length} products (total: ${products.length})`)

    if (data.products.length < 250) break

    page++
    // Pause between pages to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1500))
  }

  return products
}

// ── CLI ──────────────────────────────────────────────────────

interface CliArgs {
  vendorFilter?: string
  force: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: CliArgs = { force: false }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--vendor") {
      parsed.vendorFilter = args[++i]
    } else if (args[i] === "--force") {
      parsed.force = true
    }
  }

  return parsed
}

async function main() {
  const args = parseArgs()

  // Load probe results
  const probePath = path.join(process.cwd(), "data", "prospect-probe-results.json")
  if (!fs.existsSync(probePath)) {
    console.error(`No probe results found at ${probePath}`)
    console.error("Run: npx tsx scripts/prospect-probe.ts")
    process.exit(1)
  }

  const probeResults: ProbeResult[] = JSON.parse(
    fs.readFileSync(probePath, "utf-8"),
  )

  // Filter to teardown-ready vendors
  let targets = probeResults.filter((r) => r.teardownReady)

  if (args.vendorFilter) {
    targets = targets.filter(
      (r) =>
        r.slug === args.vendorFilter ||
        r.name.toLowerCase() === args.vendorFilter!.toLowerCase(),
    )
    if (targets.length === 0) {
      // Also try non-ready vendors if specifically requested
      const all = probeResults.filter(
        (r) =>
          r.slug === args.vendorFilter ||
          r.name.toLowerCase() === args.vendorFilter!.toLowerCase(),
      )
      if (all.length > 0 && all[0].productsJsonAccessible) {
        targets = all
        log(`Warning: ${args.vendorFilter} not teardown-ready but has products.json — fetching anyway`)
      } else {
        console.error(`No matching vendor: ${args.vendorFilter}`)
        const ready = probeResults
          .filter((r) => r.teardownReady)
          .map((r) => r.slug)
        console.error(`Teardown-ready: ${ready.join(", ")}`)
        process.exit(1)
      }
    }
  }

  log(`Fetching catalogs for ${targets.length} vendor(s)...`)

  const dataDir = path.join(process.cwd(), "data")
  fs.mkdirSync(dataDir, { recursive: true })

  let fetched = 0
  let skipped = 0

  for (let i = 0; i < targets.length; i++) {
    const vendor = targets[i]
    const outFile = path.join(dataDir, `${vendor.slug}-catalog.jsonl`)

    // Skip if already fetched (unless --force)
    if (fs.existsSync(outFile) && !args.force) {
      const stat = fs.statSync(outFile)
      const lineCount = fs
        .readFileSync(outFile, "utf-8")
        .split("\n")
        .filter(Boolean).length
      log(
        `[${i + 1}/${targets.length}] Skipping ${vendor.name} — ${lineCount} products cached (${(stat.size / 1024).toFixed(0)} KB)`,
      )
      skipped++
      continue
    }

    log(`[${i + 1}/${targets.length}] Fetching ${vendor.name} (${vendor.domain})...`)

    try {
      const products = await fetchCatalog(vendor.domain, vendor.slug)

      if (products.length === 0) {
        log(`  No products fetched for ${vendor.name}`)
        continue
      }

      // Write JSONL
      const ws = fs.createWriteStream(outFile)
      for (const p of products) {
        ws.write(JSON.stringify(p) + "\n")
      }
      await new Promise<void>((resolve, reject) => {
        ws.end(() => resolve())
        ws.on("error", reject)
      })

      const fileSize = (fs.statSync(outFile).size / 1024).toFixed(1)
      log(`  Wrote ${products.length} products to ${outFile} (${fileSize} KB)`)

      // Quick quality summary
      const withDesc = products.filter((p) => p.description.length > 20)
      const withImages = products.filter((p) => p.image_url)
      const avgPrice =
        products.reduce((s, p) => s + p.price, 0) / products.length
      log(
        `  Quality: ${withDesc.length}/${products.length} descriptions, ${withImages.length}/${products.length} images, avg $${avgPrice.toFixed(2)}`,
      )

      fetched++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log(`  ERROR: ${msg}`)
    }

    // Pause between vendors
    if (i < targets.length - 1) {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  log("")
  log("═══════════════════════════════════════════")
  log(`  Catalog fetch complete`)
  log(`  Fetched: ${fetched}`)
  log(`  Skipped (cached): ${skipped}`)
  log(`  Total vendors: ${targets.length}`)
  log("═══════════════════════════════════════════")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
