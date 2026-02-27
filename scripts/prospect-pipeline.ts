/**
 * Prospect Pipeline — End-to-end orchestrator
 *
 * For each vendor:
 *   1. Load probe results, confirm teardownReady
 *   2. Fetch catalog if not cached
 *   3. Ingest into XTAL collection (skip if exists)
 *   4. Run teardown: 20 queries, Playwright scrape vs XTAL API
 *   5. Generate outreach package (separate script)
 *
 * Usage:
 *   # Load env first:
 *   export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
 *
 *   npx tsx scripts/prospect-pipeline.ts sixpenny           # single vendor
 *   npx tsx scripts/prospect-pipeline.ts --all              # all teardown-ready
 *   npx tsx scripts/prospect-pipeline.ts sixpenny --skip-ingest
 *   npx tsx scripts/prospect-pipeline.ts sixpenny --reuse-data
 *   npx tsx scripts/prospect-pipeline.ts sixpenny --step fetch   # run only fetch step
 */

import * as fs from "fs"
import * as path from "path"
import type { ProbeResult } from "./teardown/types"
import { buildShopifyMerchantConfig, registerMerchant } from "./teardown/merchants"
import { runTeardown } from "./search-teardown"
import { ingestToXtal } from "./lib/ingest-to-xtal"

// ── Logging ──────────────────────────────────────────────────

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

// ── Catalog fetch (inline — reuses fetch-prospect-catalog logic) ──

interface ShopifyProduct {
  id: number
  title: string
  handle: string
  body_html: string | null
  vendor: string
  product_type: string
  tags: string
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

async function fetchCatalogIfNeeded(
  vendor: ProbeResult,
  force: boolean,
): Promise<string> {
  const dataDir = path.join(process.cwd(), "data")
  const outFile = path.join(dataDir, `${vendor.slug}-catalog.jsonl`)

  if (fs.existsSync(outFile) && !force) {
    const lineCount = fs
      .readFileSync(outFile, "utf-8")
      .split("\n")
      .filter(Boolean).length
    log(`  Catalog cached: ${lineCount} products in ${outFile}`)
    return outFile
  }

  log(`  Fetching catalog from ${vendor.domain}...`)
  fs.mkdirSync(dataDir, { recursive: true })

  const ws = fs.createWriteStream(outFile)
  let totalProducts = 0
  let page = 1

  while (true) {
    const url = `https://${vendor.domain}/products.json?limit=250&page=${page}`

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) break

    const data = (await res.json()) as { products: ShopifyProduct[] }
    if (!data.products || data.products.length === 0) break

    for (const raw of data.products) {
      const bodyHtml = raw.body_html || ""
      const description = bodyHtml
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      const tags = raw.tags
        ? raw.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : []
      const firstVariant = raw.variants[0]
      const price = firstVariant ? parseFloat(firstVariant.price) : 0
      const compareAt = firstVariant?.compare_at_price
        ? parseFloat(firstVariant.compare_at_price)
        : null

      const product = {
        id: String(raw.id),
        title: raw.title,
        description,
        vendor: raw.vendor || vendor.domain,
        product_type: raw.product_type || "",
        tags,
        price,
        compare_at_price: compareAt,
        image_url: raw.images?.[0]?.src || null,
        product_url: `https://${vendor.domain}/products/${raw.handle}`,
        handle: raw.handle,
        available: raw.variants.some((v) => v.available),
        sku: firstVariant?.sku || "",
        images: raw.images.map((img) => ({ src: img.src })),
      }
      ws.write(JSON.stringify(product) + "\n")
      totalProducts++
    }

    if (data.products.length < 250) break
    page++
    await new Promise((r) => setTimeout(r, 1500))
  }

  await new Promise<void>((resolve, reject) => {
    ws.end(() => resolve())
    ws.on("error", reject)
  })

  log(`  Fetched ${totalProducts} products → ${outFile}`)
  return outFile
}

// ── Map CSV category to vertical ─────────────────────────────

function categoryToVertical(
  category: string,
): "food" | "home" | "beauty" | "outdoor" | "pet" | "electronics" | "cannabis" | "niche" | "apparel" | "general" {
  const c = category.toLowerCase()
  if (
    c.includes("furniture") ||
    c.includes("home") ||
    c.includes("decor") ||
    c.includes("rugs")
  )
    return "home"
  if (c.includes("beauty") || c.includes("cosmetic")) return "beauty"
  if (c.includes("apparel") || c.includes("fashion")) return "apparel"
  if (c.includes("food") || c.includes("beverage")) return "food"
  if (c.includes("outdoor")) return "outdoor"
  if (c.includes("pet")) return "pet"
  if (
    c.includes("electronic") ||
    c.includes("audio") ||
    c.includes("smart home") ||
    c.includes("camera") ||
    c.includes("energy") ||
    c.includes("gaming") ||
    c.includes("auto tech")
  )
    return "electronics"
  if (c.includes("cannabis")) return "cannabis"
  if (
    c.includes("accessories") ||
    c.includes("lifestyle") ||
    c.includes("specialty")
  )
    return "niche"
  return "general"
}

// ── CLI ──────────────────────────────────────────────────────

interface CliArgs {
  vendorFilter?: string
  all: boolean
  skipIngest: boolean
  reuseData: boolean
  step?: "fetch" | "ingest" | "teardown"
  force: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: CliArgs = {
    all: false,
    skipIngest: false,
    reuseData: false,
    force: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--all") {
      parsed.all = true
    } else if (arg === "--skip-ingest") {
      parsed.skipIngest = true
    } else if (arg === "--reuse-data") {
      parsed.reuseData = true
    } else if (arg === "--step") {
      parsed.step = args[++i] as "fetch" | "ingest" | "teardown"
    } else if (arg === "--force") {
      parsed.force = true
    } else if (!arg.startsWith("--")) {
      parsed.vendorFilter = arg
    }
  }

  return parsed
}

// ── Pipeline for one vendor ──────────────────────────────────

async function runPipelineForVendor(
  vendor: ProbeResult,
  opts: { skipIngest: boolean; reuseData: boolean; step?: string; force: boolean },
): Promise<{
  slug: string
  success: boolean
  error?: string
  catalogProducts?: number
  teardownQueries?: number
}> {
  log(`\n${"═".repeat(50)}`)
  log(`  Pipeline: ${vendor.name} (${vendor.domain})`)
  log(`${"═".repeat(50)}`)

  try {
    // ── Step 1: Register merchant config ──
    const config = buildShopifyMerchantConfig({
      slug: vendor.slug,
      name: vendor.name,
      domain: vendor.domain,
      primaryColor: vendor.primaryColor,
    })
    registerMerchant(config)
    log(`  Registered merchant config: ${vendor.slug}`)

    // ── Step 2: Fetch catalog ──
    if (!opts.step || opts.step === "fetch") {
      const catalogPath = await fetchCatalogIfNeeded(vendor, opts.force)
      const lineCount = fs
        .readFileSync(catalogPath, "utf-8")
        .split("\n")
        .filter(Boolean).length

      if (opts.step === "fetch") {
        return { slug: vendor.slug, success: true, catalogProducts: lineCount }
      }
    }

    // ── Step 3: Ingest into XTAL ──
    if (!opts.skipIngest && (!opts.step || opts.step === "ingest")) {
      const catalogPath = path.join(
        process.cwd(),
        "data",
        `${vendor.slug}-catalog.jsonl`,
      )

      if (!fs.existsSync(catalogPath)) {
        throw new Error(`Catalog not found: ${catalogPath}. Run fetch step first.`)
      }

      const result = await ingestToXtal({
        slug: vendor.slug,
        label: vendor.name,
        jsonlPath: catalogPath,
        vertical: categoryToVertical(vendor.category),
        source: "shopify-import",
        sourceUrl: vendor.site,
      })

      if (result.status === "failed") {
        log(`  Ingest failed: ${result.error}`)
        if (opts.step === "ingest") {
          return { slug: vendor.slug, success: false, error: result.error }
        }
        // Continue to teardown anyway if not step-specific
      } else {
        log(`  Ingest complete: ${result.productsProcessed ?? "?"} products`)
      }

      if (opts.step === "ingest") {
        return { slug: vendor.slug, success: true }
      }
    }

    // ── Step 4: Run teardown ──
    if (!opts.step || opts.step === "teardown") {
      log(`  Running teardown...`)
      const report = await runTeardown(vendor.slug, {
        reuseData: opts.reuseData,
        collection: vendor.slug,
      })

      log(
        `  Teardown complete: ${report.summary.totalQueries} queries, ` +
          `merchant avg ${report.summary.merchantAvgResults.toFixed(0)} results, ` +
          `XTAL avg ${report.summary.xtalAvgResults.toFixed(0)} results`,
      )

      return {
        slug: vendor.slug,
        success: true,
        teardownQueries: report.summary.totalQueries,
      }
    }

    return { slug: vendor.slug, success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log(`  Pipeline ERROR: ${msg}`)
    return { slug: vendor.slug, success: false, error: msg }
  }
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const args = parseArgs()

  if (!args.vendorFilter && !args.all) {
    console.error(
      "Usage: npx tsx scripts/prospect-pipeline.ts <vendor-slug> [options]",
    )
    console.error("       npx tsx scripts/prospect-pipeline.ts --all [options]")
    console.error("")
    console.error("Options:")
    console.error("  --all           Process all teardown-ready vendors")
    console.error("  --skip-ingest   Skip catalog ingest step")
    console.error("  --reuse-data    Reuse cached teardown comparison data")
    console.error("  --step <step>   Run only: fetch, ingest, or teardown")
    console.error("  --force         Re-fetch catalog even if cached")
    process.exit(1)
  }

  // Validate env
  const required = ["XTAL_BACKEND_URL"]
  if (!args.skipIngest && args.step !== "fetch" && args.step !== "teardown") {
    required.push("COGNITO_URL", "COGNITO_CLIENT_ID", "COGNITO_CLIENT_SECRET")
  }
  if (!args.reuseData && args.step !== "fetch" && args.step !== "ingest") {
    required.push("ANTHROPIC_API_KEY")
  }
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Missing env var: ${key}`)
      process.exit(1)
    }
  }

  // Load probe results
  const probePath = path.join(
    process.cwd(),
    "data",
    "prospect-probe-results.json",
  )
  if (!fs.existsSync(probePath)) {
    console.error(`No probe results found at ${probePath}`)
    console.error("Run: npx tsx scripts/prospect-probe.ts")
    process.exit(1)
  }

  const probeResults: ProbeResult[] = JSON.parse(
    fs.readFileSync(probePath, "utf-8"),
  )

  // Select vendors
  let targets: ProbeResult[]

  if (args.all) {
    targets = probeResults.filter((r) => r.teardownReady)
    log(`Found ${targets.length} teardown-ready vendors`)
  } else {
    targets = probeResults.filter(
      (r) =>
        r.slug === args.vendorFilter ||
        r.name.toLowerCase() === args.vendorFilter!.toLowerCase(),
    )
    if (targets.length === 0) {
      console.error(`No vendor found: ${args.vendorFilter}`)
      console.error(
        `Available: ${probeResults.map((r) => r.slug).join(", ")}`,
      )
      process.exit(1)
    }
  }

  // Run pipeline for each vendor
  const results: Array<{
    slug: string
    success: boolean
    error?: string
  }> = []

  for (let i = 0; i < targets.length; i++) {
    const vendor = targets[i]
    log(`\n[${ i + 1}/${targets.length}] Processing ${vendor.name}...`)

    const result = await runPipelineForVendor(vendor, {
      skipIngest: args.skipIngest,
      reuseData: args.reuseData,
      step: args.step,
      force: args.force,
    })

    results.push(result)

    // Pause between vendors
    if (i < targets.length - 1) {
      log(`  Pausing 5s before next vendor...`)
      await new Promise((r) => setTimeout(r, 5000))
    }
  }

  // ── Summary ──
  const succeeded = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  log("")
  log("═══════════════════════════════════════════")
  log(`  Pipeline complete`)
  log(`  Processed: ${results.length} vendors`)
  log(`  Succeeded: ${succeeded.length}`)
  log(`  Failed: ${failed.length}`)
  if (failed.length > 0) {
    log(`  Failures:`)
    for (const f of failed) {
      log(`    ${f.slug}: ${f.error}`)
    }
  }
  log("═══════════════════════════════════════════")

  // Save pipeline results
  const outPath = path.join(process.cwd(), "data", "pipeline-results.json")
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
  log(`  Results saved to: ${outPath}`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
