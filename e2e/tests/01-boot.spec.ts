import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"
import { MOCK_CONFIG_DISABLED } from "../fixtures/mock-responses"

const API_BASE = process.env.E2E_API_BASE || "https://www.xtalsearch.com"
const COLLECTION = process.env.E2E_COLLECTION || "willow"

test.describe("01 — SDK Boot Lifecycle", () => {
  test("boots successfully and exposes window.XTAL", async ({ xtal }) => {
    await xtal.inject()
    const active = await xtal.isActive()
    expect(active).toBe(true)
    await xtal.screenshot("01-boot-success")
  })

  test("fetches config with correct shopId", async ({ xtal }) => {
    let configUrl = ""
    await xtal.page.route("**/api/xtal/config*", async (route) => {
      configUrl = route.request().url()
      await route.continue()
    })
    await xtal.inject()
    expect(configUrl).toContain(`shopId=${COLLECTION}`)
  })

  test("injects card template CSS into head", async ({ xtal }) => {
    await xtal.inject()
    // <style> tags are invisible — use state: 'attached' not 'visible'
    await xtal.page.waitForSelector(SELECTORS.XTAL_CARD_STYLES, {
      state: "attached",
      timeout: 10_000,
    })
    const styleContent = await xtal.page.$eval(
      SELECTORS.XTAL_CARD_STYLES,
      (el) => el.textContent
    )
    expect(styleContent).toBeTruthy()
    expect(styleContent!.length).toBeGreaterThan(0)
  })

  test("logs fallback cart adapter for non-Shopify", async ({ xtal }) => {
    const logs: string[] = []
    xtal.page.on("console", (msg) => {
      if (msg.type() === "log") logs.push(msg.text())
    })
    await xtal.inject()
    // Willow is not Shopify, so should use fallback adapter
    const adapterLog = logs.find((l) => l.includes("Cart adapter:"))
    expect(adapterLog).toContain("fallback")
  })

  test("handles disabled config gracefully", async ({ xtal }) => {
    await xtal.page.route("**/api/xtal/config*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CONFIG_DISABLED),
      })
    )

    // Inject SDK — it should boot but not expose window.XTAL (disabled config exits early)
    const { page } = xtal
    await page.evaluate(
      ({ apiBase, collection }) => {
        const script = document.createElement("script")
        script.setAttribute("data-shop-id", collection)
        script.src = `${apiBase}/client/v1/xtal.js`
        document.head.appendChild(script)
      },
      { apiBase: xtal.apiBase, collection: xtal.collection }
    )

    // Give it time to fetch config and decide
    await page.waitForTimeout(5000)
    const active = await xtal.isActive()
    expect(active).toBe(false)
  })

  test("handles config fetch failure gracefully", async ({ xtal }) => {
    const errors: string[] = []
    xtal.page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })

    await xtal.page.route("**/api/xtal/config*", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" })
    )

    await xtal.page.evaluate(
      ({ apiBase, collection }) => {
        const script = document.createElement("script")
        script.setAttribute("data-shop-id", collection)
        script.src = `${apiBase}/client/v1/xtal.js`
        document.head.appendChild(script)
      },
      { apiBase: xtal.apiBase, collection: xtal.collection }
    )

    await xtal.page.waitForTimeout(5000)

    // SDK should log an error but not crash the page
    const configError = errors.find((e) => e.includes("Failed to fetch config"))
    expect(configError).toBeTruthy()

    // Page should still be functional
    const title = await xtal.page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test("auto-triggers search if input has existing value", async ({ xtal }) => {
    // Willow's search input is #search_field — wait for it
    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    await input.waitFor({ state: "visible", timeout: 15_000 })

    // Pre-fill the input with a query (simulating navigated-from-homepage scenario)
    await input.fill("baskets")

    // Now inject SDK — it should detect the existing value and auto-trigger search
    await xtal.inject()
    await xtal.waitForResults()
    await xtal.screenshot("01-auto-trigger")
  })
})
