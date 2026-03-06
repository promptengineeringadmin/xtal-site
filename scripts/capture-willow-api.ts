/**
 * Recon script: Capture Willow's native search API calls.
 * Run: npx tsx scripts/capture-willow-api.ts
 */
import { chromium } from "playwright"
import { writeFileSync } from "fs"

interface CapturedRequest {
  url: string
  method: string
  headers: Record<string, string>
  postData?: string
  resourceType: string
  response?: {
    status: number
    headers: Record<string, string>
    body?: string
  }
}

async function main() {
  const captured: CapturedRequest[] = []

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  // Block our own SDK so we see Willow's native search behavior
  await page.route("**/*xtalsearch.com*/**", (route) => route.abort())
  await page.route("**/xtal.js*", (route) => route.abort())
  await page.route("**/xtal-sdk*", (route) => route.abort())

  // Capture all requests and responses
  page.on("request", (req) => {
    const url = req.url()
    const resourceType = req.resourceType()

    // Skip static assets
    if (["image", "stylesheet", "font", "media"].includes(resourceType)) return
    // Skip common noise
    if (url.includes("google-analytics") || url.includes("gtm.js") || url.includes("facebook") || url.includes("clarity")) return

    captured.push({
      url,
      method: req.method(),
      headers: req.headers(),
      postData: req.postData() || undefined,
      resourceType,
    })
  })

  page.on("response", async (res) => {
    const url = res.url()
    const entry = captured.find((c) => c.url === url && !c.response)
    if (!entry) return

    try {
      const contentType = res.headers()["content-type"] || ""
      entry.response = {
        status: res.status(),
        headers: res.headers(),
        body: contentType.includes("json") ? await res.text() : `[${contentType}]`,
      }
    } catch {
      // Response body may not be available
    }
  })

  console.log("Navigating to Willow shop (no SDK)...")
  await page.goto("https://www.willowgroupltd.com/shop", {
    waitUntil: "networkidle",
    timeout: 30_000,
  })

  // Clear captured so far — we only care about search requests
  const preSearchCount = captured.length
  console.log(`Page loaded (${preSearchCount} requests during load). Now searching...`)

  // Mark where search begins
  const searchStartIndex = captured.length

  // Dismiss any popups
  await page.evaluate(() => {
    document.querySelectorAll(
      '[aria-label="Close dialog"], .kl-private-close-button, button.close, .cky-btn-accept'
    ).forEach((el) => (el as HTMLElement).click())
  }).catch(() => {})

  // Type search and submit
  const input = page.locator("#search_field")
  await input.waitFor({ state: "visible", timeout: 15_000 })
  await input.click({ force: true })
  await input.fill("baskets")
  await input.press("Enter")

  // Wait for results to load
  console.log("Waiting for search results...")
  await page.waitForTimeout(5_000)

  // Separate pre-search and post-search requests
  const searchRequests = captured.slice(searchStartIndex)

  // Filter to just JSON/XHR responses
  const apiCalls = searchRequests.filter(
    (r) =>
      r.response?.headers?.["content-type"]?.includes("json") ||
      r.resourceType === "xhr" ||
      r.resourceType === "fetch"
  )

  console.log(`\n=== SEARCH API CALLS (${apiCalls.length}) ===\n`)
  for (const call of apiCalls) {
    console.log(`${call.method} ${call.url}`)
    console.log(`  Type: ${call.resourceType}`)
    console.log(`  Status: ${call.response?.status}`)
    if (call.postData) console.log(`  Body: ${call.postData.slice(0, 200)}`)
    if (call.response?.body && call.response.body.length < 500) {
      console.log(`  Response: ${call.response.body}`)
    } else if (call.response?.body) {
      console.log(`  Response: ${call.response.body.slice(0, 500)}...`)
    }
    console.log()
  }

  // Also dump ALL search-phase requests for completeness
  console.log(`\n=== ALL POST-SEARCH REQUESTS (${searchRequests.length}) ===\n`)
  for (const r of searchRequests) {
    console.log(`  ${r.method} ${r.resourceType} ${r.url.slice(0, 120)}`)
  }

  // Save full capture
  const output = {
    timestamp: new Date().toISOString(),
    searchQuery: "baskets",
    pageLoadRequests: preSearchCount,
    searchRequests: searchRequests.length,
    apiCalls,
    allSearchRequests: searchRequests.map((r) => ({
      method: r.method,
      url: r.url,
      resourceType: r.resourceType,
      status: r.response?.status,
    })),
  }

  writeFileSync(
    "scripts/willow-api-capture.json",
    JSON.stringify(output, null, 2)
  )
  console.log("\nSaved to scripts/willow-api-capture.json")

  await browser.close()
}

main().catch(console.error)
