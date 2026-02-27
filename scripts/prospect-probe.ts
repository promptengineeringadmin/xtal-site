/**
 * Prospect Probe — Test Shopify stores for teardown readiness
 *
 * Probes each vendor from the CSV leads list to determine:
 * - Whether /products.json is accessible
 * - Total product count (paginated)
 * - Quality signals (descriptions, images)
 * - Search URL accessibility
 * - Brand color extraction
 *
 * Usage:
 *   npx tsx scripts/prospect-probe.ts                     # all vendors
 *   npx tsx scripts/prospect-probe.ts --vendor sixpenny   # single vendor
 *   npx tsx scripts/prospect-probe.ts --resume            # resume from last run
 */

import * as fs from "fs"
import * as path from "path"

// ── Types ────────────────────────────────────────────────────

interface CsvVendor {
  vendor: string
  category: string
  site: string
}

interface ProbeResult {
  slug: string
  domain: string
  name: string
  category: string
  site: string
  productsJsonAccessible: boolean
  totalProducts: number
  hasDescriptions: boolean
  hasImages: boolean
  searchUrl: string | null
  primaryColor: string
  teardownReady: boolean
  error?: string
}

// ── CSV Parsing ──────────────────────────────────────────────

function parseCsv(csvPath: string): CsvVendor[] {
  const content = fs.readFileSync(csvPath, "utf-8")
  const lines = content.split("\n")
  const seen = new Set<string>()
  const vendors: CsvVendor[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",")
    const vendor = (cols[2] || "").trim()
    const category = (cols[3] || "").trim()
    const site = (cols[4] || "").trim()

    if (!vendor || !site || seen.has(vendor)) continue
    // Skip entries without valid URLs
    if (!site.includes(".")) continue
    seen.add(vendor)

    vendors.push({ vendor, category, site })
  }

  return vendors
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function extractDomain(url: string): string {
  let u = url.trim()
  if (!u.startsWith("http")) u = "https://" + u
  try {
    return new URL(u).hostname
  } catch {
    // Fallback: strip protocol and path
    return u.replace(/^https?:\/\//, "").split("/")[0]
  }
}

// ── Logging ──────────────────────────────────────────────────

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

// ── Shopify /products.json probe ─────────────────────────────

interface ShopifyProduct {
  id: number
  title: string
  body_html: string | null
  images: { src: string }[]
}

async function probeProductsJson(
  domain: string,
): Promise<{
  accessible: boolean
  totalProducts: number
  hasDescriptions: boolean
  hasImages: boolean
  sampleProducts: ShopifyProduct[]
}> {
  const url = `https://${domain}/products.json?limit=1`

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    return {
      accessible: false,
      totalProducts: 0,
      hasDescriptions: false,
      hasImages: false,
      sampleProducts: [],
    }
  }

  const data = (await res.json()) as { products: ShopifyProduct[] }
  if (!data.products || data.products.length === 0) {
    return {
      accessible: true,
      totalProducts: 0,
      hasDescriptions: false,
      hasImages: false,
      sampleProducts: [],
    }
  }

  // Paginate to count total products (250/page, max 10 pages = 2500 products)
  let totalProducts = 0
  let page = 1
  let allSample: ShopifyProduct[] = []

  while (true) {
    const pageUrl = `https://${domain}/products.json?limit=250&page=${page}`
    const pageRes = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!pageRes.ok) break

    const pageData = (await pageRes.json()) as { products: ShopifyProduct[] }
    if (!pageData.products || pageData.products.length === 0) break

    totalProducts += pageData.products.length
    if (page === 1) allSample = pageData.products.slice(0, 10)

    // Shopify returns empty array when past last page
    if (pageData.products.length < 250) break

    page++
    // Brief pause between pages
    await new Promise((r) => setTimeout(r, 500))
  }

  // Quality signals from sample
  const sample = allSample
  const withDesc = sample.filter(
    (p) => p.body_html && p.body_html.replace(/<[^>]*>/g, "").trim().length > 20,
  )
  const withImages = sample.filter((p) => p.images && p.images.length > 0)

  return {
    accessible: true,
    totalProducts,
    hasDescriptions: withDesc.length >= sample.length * 0.5,
    hasImages: withImages.length >= sample.length * 0.5,
    sampleProducts: sample,
  }
}

// ── Search URL test ──────────────────────────────────────────

async function testSearchUrl(
  domain: string,
): Promise<string | null> {
  const searchUrl = `https://${domain}/search?q=test&type=product`
  try {
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    })
    if (res.ok) {
      return `https://${domain}/search?q=`
    }
  } catch {
    // Search not accessible
  }
  return null
}

// ── Brand color extraction ───────────────────────────────────

async function extractBrandColor(domain: string): Promise<string> {
  try {
    const res = await fetch(`https://${domain}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) return "#1a1a1a"

    const html = await res.text()

    // Try theme-color meta tag
    const themeColor = html.match(
      /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i,
    )
    if (themeColor) return themeColor[1]

    // Try msapplication-TileColor
    const tileColor = html.match(
      /<meta[^>]*name=["']msapplication-TileColor["'][^>]*content=["']([^"']+)["']/i,
    )
    if (tileColor) return tileColor[1]

    // Try CSS --brand or --primary custom property
    const cssVar = html.match(
      /--(?:brand|primary)(?:-color)?:\s*(#[0-9a-fA-F]{3,8})/i,
    )
    if (cssVar) return cssVar[1]
  } catch {
    // Couldn't fetch homepage
  }

  return "#1a1a1a"
}

// ── Main probe function ──────────────────────────────────────

async function probeVendor(v: CsvVendor): Promise<ProbeResult> {
  const slug = slugify(v.vendor)
  const domain = extractDomain(v.site)

  log(`  Probing ${v.vendor} (${domain})...`)

  try {
    // Run probes
    const [productsResult, searchUrl, primaryColor] = await Promise.all([
      probeProductsJson(domain),
      testSearchUrl(domain),
      extractBrandColor(domain),
    ])

    const teardownReady =
      productsResult.accessible &&
      productsResult.totalProducts >= 20 &&
      searchUrl !== null

    const result: ProbeResult = {
      slug,
      domain,
      name: v.vendor,
      category: v.category,
      site: v.site,
      productsJsonAccessible: productsResult.accessible,
      totalProducts: productsResult.totalProducts,
      hasDescriptions: productsResult.hasDescriptions,
      hasImages: productsResult.hasImages,
      searchUrl,
      primaryColor,
      teardownReady,
    }

    const status = teardownReady ? "READY" : "SKIP"
    const reason = !productsResult.accessible
      ? "no products.json"
      : productsResult.totalProducts < 20
        ? `only ${productsResult.totalProducts} products`
        : !searchUrl
          ? "no search"
          : ""
    log(
      `    [${status}] ${productsResult.totalProducts} products, search: ${searchUrl ? "yes" : "no"}${reason ? ` (${reason})` : ""}`,
    )

    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log(`    [ERROR] ${msg}`)
    return {
      slug,
      domain,
      name: v.vendor,
      category: v.category,
      site: v.site,
      productsJsonAccessible: false,
      totalProducts: 0,
      hasDescriptions: false,
      hasImages: false,
      searchUrl: null,
      primaryColor: "#1a1a1a",
      teardownReady: false,
      error: msg,
    }
  }
}

// ── CLI ──────────────────────────────────────────────────────

interface CliArgs {
  vendorFilter?: string
  resume: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: CliArgs = { resume: false }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--vendor") {
      parsed.vendorFilter = args[++i]
    } else if (args[i] === "--resume") {
      parsed.resume = true
    }
  }

  return parsed
}

async function main() {
  const args = parseArgs()

  const csvPath = path.join(
    process.cwd(),
    "Shopify Leads List - specific contacts.csv",
  )
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const vendors = parseCsv(csvPath)
  log(`Parsed ${vendors.length} unique vendors from CSV`)

  // Filter if --vendor specified
  const targets = args.vendorFilter
    ? vendors.filter(
        (v) =>
          slugify(v.vendor) === args.vendorFilter ||
          v.vendor.toLowerCase() === args.vendorFilter!.toLowerCase(),
      )
    : vendors

  if (targets.length === 0) {
    console.error(`No vendors matched: ${args.vendorFilter}`)
    console.error(
      `Available: ${vendors.map((v) => slugify(v.vendor)).join(", ")}`,
    )
    process.exit(1)
  }

  log(`Probing ${targets.length} vendor(s)...`)

  // Always load existing results to avoid data loss on --vendor runs
  const outPath = path.join(process.cwd(), "data", "prospect-probe-results.json")
  let existingResults: ProbeResult[] = []
  if (fs.existsSync(outPath)) {
    existingResults = JSON.parse(fs.readFileSync(outPath, "utf-8"))
    log(`Loaded ${existingResults.length} existing results`)
  }

  const existingSlugs = new Set(existingResults.map((r) => r.slug))
  const results: ProbeResult[] = [...existingResults]

  for (let i = 0; i < targets.length; i++) {
    const v = targets[i]
    const slug = slugify(v.vendor)

    // Skip if already probed (--resume)
    if (args.resume && existingSlugs.has(slug)) {
      log(`  [${i + 1}/${targets.length}] Skipping ${v.vendor} (cached)`)
      continue
    }

    log(`[${i + 1}/${targets.length}] ${v.vendor}`)
    const result = await probeVendor(v)

    // Update or append
    const existingIdx = results.findIndex((r) => r.slug === slug)
    if (existingIdx >= 0) {
      results[existingIdx] = result
    } else {
      results.push(result)
    }

    // Save after each vendor (crash-safe)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2))

    // Brief pause between vendors
    if (i < targets.length - 1) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // ── Summary ──
  const ready = results.filter((r) => r.teardownReady)
  const noProducts = results.filter((r) => !r.productsJsonAccessible)
  const tooSmall = results.filter(
    (r) => r.productsJsonAccessible && r.totalProducts < 20,
  )
  const noSearch = results.filter(
    (r) => r.productsJsonAccessible && r.totalProducts >= 20 && !r.searchUrl,
  )

  log("")
  log("═══════════════════════════════════════════")
  log(`  Probe complete: ${results.length} vendors`)
  log(`  Teardown-ready: ${ready.length}`)
  log(`  No products.json: ${noProducts.length}`)
  log(`  Too few products (<20): ${tooSmall.length}`)
  log(`  No search URL: ${noSearch.length}`)
  log(`  Errors: ${results.filter((r) => r.error).length}`)
  log("═══════════════════════════════════════════")

  if (ready.length > 0) {
    log("")
    log("  Ready vendors:")
    for (const r of ready) {
      log(`    ${r.name} (${r.domain}) — ${r.totalProducts} products`)
    }
  }

  log(`\n  Results saved to: ${outPath}`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
