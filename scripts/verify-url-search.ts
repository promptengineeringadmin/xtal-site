/**
 * verify-url-search.ts - Playwright verification for URL query parameter support
 *
 * Tests that ?q= URL parameters trigger SSR search results (visible in raw HTML)
 * and work correctly in a full browser environment.
 *
 * Usage:
 *   npx tsx scripts/verify-url-search.ts
 *   npx tsx scripts/verify-url-search.ts --base-url https://www.xtalsearch.com
 *   npx tsx scripts/verify-url-search.ts --collection willow
 */

import { chromium, type Browser, type Page } from "playwright-core"
import * as fs from "fs"
import * as path from "path"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback
}

const BASE_URL = getArg("base-url", "http://localhost:3000")
const COLLECTION = getArg("collection", "bestbuy")
const VIEWPORT = { width: 1280, height: 800 }
const OUTPUT_DIR = path.resolve(__dirname, "qa-output")
const RESULTS_TIMEOUT_MS = 30_000

const TEST_QUERIES = [
  "tablet for kids under 200",
  "quiet dishwasher that actually cleans well",
  "upgrade TV audio without running wires",
  "best soundbar for small living room",
]

// ---------------------------------------------------------------------------
// Browser discovery (cross-platform)
// ---------------------------------------------------------------------------

function findBrowser(): string {
  const candidates = [
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    // Windows
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    // Env override
    process.env.CHROME_PATH,
  ].filter(Boolean) as string[]

  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  throw new Error(
    `No Chromium browser found. Tried:\n${candidates.join("\n")}\nSet CHROME_PATH env to your browser executable.`
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

interface TestResult {
  name: string
  passed: boolean
  details: string
  screenshotFile?: string
}

const results: TestResult[] = []

function record(name: string, passed: boolean, details: string, screenshotFile?: string) {
  results.push({ name, passed, details, screenshotFile })
  const icon = passed ? "PASS" : "FAIL"
  log(`  ${icon}: ${name} — ${details}`)
}

/** Wait for product cards or "no results" to appear */
async function waitForResults(page: Page) {
  const deadline = Date.now() + RESULTS_TIMEOUT_MS
  while (Date.now() < deadline) {
    const found = await page.evaluate(() => {
      if (document.querySelectorAll(".grid h3").length > 0) return "results"
      if (document.body.textContent?.includes("No results found")) return "empty"
      if (document.querySelector(".bg-red-50")) return "error"
      return null
    })
    if (found) break
    await sleep(300)
  }
  await sleep(500)
}

/** Extract result count from the info bar */
async function getResultCount(page: Page): Promise<number> {
  try {
    return await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span.font-medium"))
      for (const span of spans) {
        const match = (span.textContent ?? "").match(/^(\d+)\s+results?\s/)
        if (match) return parseInt(match[1], 10)
      }
      return 0
    })
  } catch {
    return 0
  }
}

// ---------------------------------------------------------------------------
// Test: SSR (raw HTML fetch, no JavaScript)
// ---------------------------------------------------------------------------

async function testSSR() {
  log("--- SSR Tests (raw HTTP fetch, no JS) ---")

  for (const query of TEST_QUERIES) {
    const url = `${BASE_URL}/${COLLECTION}?q=${encodeURIComponent(query)}`
    const name = `SSR: "${query}"`

    try {
      const res = await fetch(url)
      const html = await res.text()

      // Check that the HTML contains product data (h3 tags with product titles inside grid)
      // In SSR, React renders the product cards into the HTML
      const hasProductCards = html.includes('class="grid') && html.includes("<h3")
      const hasResultCount = /\d+\s+results?\s+for/.test(html)
      const hasInputValue = html.includes(`value="${query}"`) || html.includes(`value="${query.replace(/"/g, "&quot;")}"`)

      if (hasProductCards) {
        record(name, true, `HTML contains product cards, resultCount=${hasResultCount}, inputValue=${hasInputValue}`)
      } else {
        record(name, false, "HTML does NOT contain product cards — SSR not working")
      }
    } catch (err) {
      record(name, false, `Fetch failed: ${err instanceof Error ? err.message : err}`)
    }
  }

  // Test: no query param should NOT have product cards
  try {
    const url = `${BASE_URL}/${COLLECTION}`
    const res = await fetch(url)
    const html = await res.text()
    const hasProductCards = html.includes("<h3") && /\d+\s+results?\s+for/.test(html)
    record(
      "SSR: no ?q= param",
      !hasProductCards,
      hasProductCards ? "Unexpected product cards in no-query page" : "Clean landing page as expected"
    )
  } catch (err) {
    record("SSR: no ?q= param", false, `Fetch failed: ${err instanceof Error ? err.message : err}`)
  }
}

// ---------------------------------------------------------------------------
// Test: Browser (full Playwright with JS execution)
// ---------------------------------------------------------------------------

async function testBrowser() {
  log("--- Browser Tests (Playwright with JS) ---")

  const browserPath = findBrowser()
  log(`Using browser: ${browserPath}`)

  let browser: Browser
  try {
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
      args: ["--disable-gpu", "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    })
  } catch (err) {
    record("Browser launch", false, `Failed to launch: ${err instanceof Error ? err.message : err}`)
    return
  }

  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent: "Mozilla/5.0 XTAL-Verify/1.0",
  })
  const page = await context.newPage()

  try {
    // Test each query via URL
    for (let i = 0; i < TEST_QUERIES.length; i++) {
      const query = TEST_QUERIES[i]
      const url = `${BASE_URL}/${COLLECTION}?q=${encodeURIComponent(query)}`
      const name = `Browser: "${query}"`
      const screenshotFile = `verify-${String(i + 1).padStart(2, "0")}.png`

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 })
        await waitForResults(page)

        // Check input value
        const inputValue = await page.evaluate(() => {
          const input = document.querySelector('input[placeholder*="Describe"]') as HTMLInputElement | null
          return input?.value ?? ""
        })

        // Check result count
        const resultCount = await getResultCount(page)

        // Check URL
        const currentUrl = page.url()
        const urlHasQ = currentUrl.includes("q=")

        await page.screenshot({ path: path.join(OUTPUT_DIR, screenshotFile), fullPage: false })

        const inputMatch = inputValue.trim().toLowerCase() === query.toLowerCase()
        const passed = inputMatch && resultCount > 0 && urlHasQ

        record(
          name,
          passed,
          `input="${inputValue}", results=${resultCount}, urlHasQ=${urlHasQ}`,
          screenshotFile
        )
      } catch (err) {
        record(name, false, `Error: ${err instanceof Error ? err.message : err}`)
      }

      if (i < TEST_QUERIES.length - 1) await sleep(1000)
    }

    // Test: no query param — should show suggestion chips, no results
    {
      const name = "Browser: no ?q= param"
      const screenshotFile = "verify-no-param.png"

      try {
        await page.goto(`${BASE_URL}/${COLLECTION}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
        await sleep(2000)

        const hasSuggestions = await page.evaluate(() => {
          return document.body.textContent?.includes("Example queries:") ?? false
        })
        const resultCount = await getResultCount(page)

        await page.screenshot({ path: path.join(OUTPUT_DIR, screenshotFile), fullPage: false })

        record(
          name,
          hasSuggestions && resultCount === 0,
          `suggestions=${hasSuggestions}, results=${resultCount}`,
          screenshotFile
        )
      } catch (err) {
        record(name, false, `Error: ${err instanceof Error ? err.message : err}`)
      }
    }

    // Test: manual search updates URL
    {
      const name = "Browser: manual search updates URL"
      const screenshotFile = "verify-manual-search.png"

      try {
        await page.goto(`${BASE_URL}/${COLLECTION}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
        await page.waitForSelector('input[placeholder*="Describe"]', { timeout: 10_000 })

        const input = page.locator('input[placeholder*="Describe"]')
        await input.fill("laptop for college student")
        await page.getByRole("button", { name: "Search" }).click()
        await waitForResults(page)

        const currentUrl = page.url()
        const urlHasQ = currentUrl.includes("q=laptop")

        await page.screenshot({ path: path.join(OUTPUT_DIR, screenshotFile), fullPage: false })

        record(name, urlHasQ, `URL after search: ${currentUrl}`, screenshotFile)
      } catch (err) {
        record(name, false, `Error: ${err instanceof Error ? err.message : err}`)
      }
    }
  } finally {
    await context.close()
    await browser.close()
    log("Browser closed")
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("==============================================")
  console.log("  XTAL URL Search Verification")
  console.log(`  Base URL: ${BASE_URL}`)
  console.log(`  Collection: ${COLLECTION}`)
  console.log("==============================================\n")

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  await testSSR()
  console.log()
  await testBrowser()

  // Summary
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  console.log("\n==============================================")
  console.log("  VERIFICATION SUMMARY")
  console.log("==============================================")
  console.log(`  Total:  ${total}`)
  console.log(`  Passed: ${passed}`)
  console.log(`  Failed: ${failed}`)
  console.log("==============================================\n")

  if (failed > 0) {
    console.log("Failed tests:")
    results.filter((r) => !r.passed).forEach((r) => console.log(`  - ${r.name}: ${r.details}`))
    console.log()
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
