/**
 * Search Teardown — Automated LinkedIn carousel generator
 *
 * Compares a merchant's native site search against XTAL AI search
 * with side-by-side results for 20 real shopper queries.
 *
 * Usage:
 *   # Load env first:
 *   export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
 *
 *   # Run teardown:
 *   npx tsx scripts/search-teardown.ts bestbuy
 *
 *   # Re-render PDF from cached data (skip search calls):
 *   npx tsx scripts/search-teardown.ts bestbuy --reuse-data
 *
 *   # Use custom queries file:
 *   npx tsx scripts/search-teardown.ts bestbuy --queries path/to/queries.json
 */

import * as fs from "fs"
import * as path from "path"
import { chromium } from "playwright-core"
import { MERCHANTS } from "./teardown/merchants"
import { generateQueries } from "./teardown/query-gen"
import { searchMerchant, sleep } from "./teardown/merchant-search"
import { searchXtal } from "./teardown/xtal-search"
import {
  buildTitleSlideHtml,
  buildComparisonSlideHtml,
  buildCtaSlideHtml,
  renderSlideToBuffer,
} from "./teardown/slide-renderer"
import { assemblePdf } from "./teardown/pdf-assembler"
import type { TeardownQuery, QueryComparison, TeardownReport } from "./teardown/types"

// ── Browser discovery (reused from scrape-site.mjs) ──────────

function findBrowser(): string {
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.CHROME_PATH,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].filter(Boolean) as string[]

  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  throw new Error(
    `No Chromium browser found. Set CHROME_PATH env var.\nTried:\n${candidates.join("\n")}`,
  )
}

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

// ── CLI Arg Parsing ──────────────────────────────────────────

interface Args {
  merchantId: string
  reuseData: boolean
  queriesPath?: string
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  if (args.length === 0 || args[0].startsWith("--")) {
    console.error(
      "Usage: npx tsx scripts/search-teardown.ts <merchant-id> [--reuse-data] [--queries <path>]",
    )
    console.error(`\nAvailable merchants: ${Object.keys(MERCHANTS).join(", ")}`)
    process.exit(1)
  }

  const parsed: Args = { merchantId: args[0], reuseData: false }

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--reuse-data") {
      parsed.reuseData = true
    } else if (args[i] === "--queries") {
      parsed.queriesPath = args[++i]
    }
  }

  return parsed
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const args = parseArgs()
  const merchant = MERCHANTS[args.merchantId]
  if (!merchant) {
    console.error(`Unknown merchant: ${args.merchantId}`)
    console.error(`Available: ${Object.keys(MERCHANTS).join(", ")}`)
    process.exit(1)
  }

  // Validate env
  const required = ["XTAL_BACKEND_URL"]
  if (!args.reuseData) {
    required.push("ANTHROPIC_API_KEY")
  }
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Missing env var: ${key}`)
      process.exit(1)
    }
  }

  // Output directory
  const date = new Date().toISOString().slice(0, 10)
  const outDir = path.join(process.cwd(), "teardown-output", merchant.id, date)
  const slidesDir = path.join(outDir, "slides")
  fs.mkdirSync(slidesDir, { recursive: true })

  log(`Search Teardown: ${merchant.name}`)
  log(`Output: ${outDir}`)

  // ── Launch browser (used for both scraping and slide rendering) ──
  const browserPath = findBrowser()
  log(`Browser: ${browserPath}`)

  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  })

  let comparisons: QueryComparison[]

  if (args.reuseData) {
    // ── Reuse cached data ──
    const dataPath = path.join(outDir, "comparisons.json")
    if (!fs.existsSync(dataPath)) {
      console.error(`No cached data found at ${dataPath}`)
      process.exit(1)
    }
    comparisons = JSON.parse(fs.readFileSync(dataPath, "utf-8"))
    log(`Loaded ${comparisons.length} cached comparisons`)
  } else {
    // ── Step 1: Generate queries ──
    log("Step 1: Generating queries...")
    let queries: TeardownQuery[]

    if (args.queriesPath) {
      queries = JSON.parse(fs.readFileSync(args.queriesPath, "utf-8"))
      log(`  Loaded ${queries.length} queries from ${args.queriesPath}`)
    } else {
      const cachedQueries = path.join(outDir, "queries.json")
      if (fs.existsSync(cachedQueries)) {
        queries = JSON.parse(fs.readFileSync(cachedQueries, "utf-8"))
        log(`  Loaded ${queries.length} cached queries`)
      } else {
        queries = await generateQueries(merchant.id, merchant.name)
        fs.writeFileSync(cachedQueries, JSON.stringify(queries, null, 2))
        log(`  Generated ${queries.length} queries`)
      }
    }

    // ── Step 2: Run searches ──
    log("Step 2: Running searches...")
    comparisons = []

    // Create a scraping page with realistic viewport and user agent
    const scrapePage = await browser.newPage({
      viewport: { width: 1280, height: 900 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    })

    for (let i = 0; i < queries.length; i++) {
      const q = queries[i]
      log(`  [${i + 1}/${queries.length}] "${q.text}"`)

      // Merchant search (scrapes the actual website)
      let merchantResult
      try {
        merchantResult = await searchMerchant(merchant, q.text, scrapePage)
        log(`    ${merchant.name}: ${merchantResult.results.length} results scraped`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        log(`    ${merchant.name}: ERROR - ${msg}`)
        merchantResult = { results: [], count: 0, responseTime: 0 }
      }

      // XTAL search
      let xtalResult
      try {
        xtalResult = await searchXtal(q.text, merchant.id)
        log(`    XTAL: ${xtalResult.resultCount} results`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        log(`    XTAL: ERROR - ${msg}`)
        xtalResult = {
          results: [],
          resultCount: 0,
          responseTime: 0,
        }
      }

      comparisons.push({
        query: q.text,
        category: q.category,
        intent: q.intent,
        merchant: {
          results: merchantResult.results,
          resultCount: merchantResult.count,
          responseTime: merchantResult.responseTime,
        },
        xtal: {
          results: xtalResult.results,
          resultCount: xtalResult.resultCount,
          responseTime: xtalResult.responseTime,
          searchMode: xtalResult.searchMode,
          agentReasoning: xtalResult.agentReasoning,
        },
      })

      // Brief pause between scrape navigations
      if (i < queries.length - 1) {
        await sleep(2000)
      }
    }

    await scrapePage.close()

    // Save comparison data
    fs.writeFileSync(
      path.join(outDir, "comparisons.json"),
      JSON.stringify(comparisons, null, 2),
    )
    log(`  Saved ${comparisons.length} comparisons`)
  }

  // ── Step 3: Render slides ──
  log("Step 3: Rendering slides...")

  const page = await browser.newPage({
    viewport: { width: 1080, height: 1350 },
  })

  const totalComparisonSlides = comparisons.length
  const slides: Buffer[] = []

  // Title slide
  log("  Rendering title slide...")
  const titleHtml = buildTitleSlideHtml(merchant, date, totalComparisonSlides)
  slides.push(await renderSlideToBuffer(page, titleHtml))
  fs.writeFileSync(path.join(slidesDir, "00-title.png"), slides[0])

  // Comparison slides
  for (let i = 0; i < comparisons.length; i++) {
    const comp = comparisons[i]
    log(`  Rendering slide ${i + 1}/${comparisons.length}: "${comp.query}"`)
    const html = buildComparisonSlideHtml(
      comp,
      i + 1,
      totalComparisonSlides,
      merchant,
    )
    const buf = await renderSlideToBuffer(page, html)
    slides.push(buf)
    fs.writeFileSync(
      path.join(slidesDir, `${String(i + 1).padStart(2, "0")}-${comp.category}.png`),
      buf,
    )
  }

  // CTA slide
  log("  Rendering CTA slide...")
  const ctaHtml = buildCtaSlideHtml()
  const ctaBuf = await renderSlideToBuffer(page, ctaHtml)
  slides.push(ctaBuf)
  fs.writeFileSync(path.join(slidesDir, `${String(comparisons.length + 1).padStart(2, "0")}-cta.png`), ctaBuf)

  // ── Step 4: Assemble PDF ──
  log("Step 4: Assembling carousel PDF...")
  const pdfPath = path.join(outDir, `teardown-${merchant.id}-${date}.pdf`)
  await assemblePdf(slides, pdfPath, page)

  await browser.close()

  // ── Summary ──
  const pdfSize = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(1)
  log("")
  log("═══════════════════════════════════════════")
  log(`  Teardown complete: ${merchant.name}`)
  log(`  ${comparisons.length} queries compared`)
  log(`  ${slides.length} slides (title + ${comparisons.length} comparisons + CTA)`)
  log(`  PDF: ${pdfPath} (${pdfSize} MB)`)
  log(`  Slides: ${slidesDir}/`)
  log("═══════════════════════════════════════════")

  // Build report summary
  const report: TeardownReport = {
    merchantId: merchant.id,
    merchantName: merchant.name,
    date,
    comparisons,
    summary: {
      totalQueries: comparisons.length,
      merchantAvgResults:
        comparisons.reduce((s, c) => s + c.merchant.resultCount, 0) /
        comparisons.length,
      xtalAvgResults:
        comparisons.reduce((s, c) => s + c.xtal.resultCount, 0) /
        comparisons.length,
      merchantAvgTime:
        comparisons.reduce((s, c) => s + c.merchant.responseTime, 0) /
        comparisons.length,
      xtalAvgTime:
        comparisons.reduce((s, c) => s + c.xtal.responseTime, 0) /
        comparisons.length,
    },
  }

  fs.writeFileSync(
    path.join(outDir, "report.json"),
    JSON.stringify(report, null, 2),
  )

  log("")
  log(`  ${merchant.name} avg results: ${report.summary.merchantAvgResults.toFixed(0)}`)
  log(`  XTAL avg results: ${report.summary.xtalAvgResults.toFixed(0)}`)
  log(`  ${merchant.name} avg time: ${Math.round(report.summary.merchantAvgTime)}ms`)
  log(`  XTAL avg time: ${Math.round(report.summary.xtalAvgTime)}ms`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
