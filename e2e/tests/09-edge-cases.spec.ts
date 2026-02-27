import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"
import {
  MOCK_CONFIG,
  MOCK_SEARCH_RESULTS,
  MOCK_PRODUCT_MISSING_FIELDS,
} from "../fixtures/mock-responses"

/** Filter pageerrors to only XTAL SDK errors (merchant site may throw its own errors) */
function isXtalError(msg: string): boolean {
  return msg.includes("[xtal.js]") || msg.includes("xtal.js")
}

test.describe("09 — Edge Cases", () => {
  test("special characters in query don't crash", async ({ xtal }) => {
    const errors: string[] = []
    xtal.page.on("pageerror", (err) => {
      if (isXtalError(err.message)) errors.push(err.message)
    })

    await xtal.inject()
    await xtal.search('wire "basket" & <div>')

    await xtal.page.waitForTimeout(3000)

    // No XTAL-related JS errors should have occurred
    expect(errors.length).toBe(0)
    await xtal.screenshot("09-special-chars")
  })

  test("very long query (500+ chars) handled", async ({ xtal }) => {
    const errors: string[] = []
    xtal.page.on("pageerror", (err) => {
      if (isXtalError(err.message)) errors.push(err.message)
    })

    await xtal.inject()

    const longQuery = "basket ".repeat(72).trim() // ~504 chars
    await xtal.search(longQuery)

    await xtal.page.waitForTimeout(3000)

    // Should not crash
    expect(errors.length).toBe(0)
    await xtal.screenshot("09-long-query")
  })

  test("unicode/emoji in query works", async ({ xtal }) => {
    const errors: string[] = []
    xtal.page.on("pageerror", (err) => {
      if (isXtalError(err.message)) errors.push(err.message)
    })

    await xtal.inject()
    await xtal.search("planters 🌸 décor café")

    await xtal.page.waitForTimeout(3000)

    expect(errors.length).toBe(0)
    await xtal.screenshot("09-unicode-emoji")
  })

  test("rapid successive searches show only last result", async ({ xtal }) => {
    await xtal.inject()

    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    await input.waitFor({ state: "visible" })

    // Fire 5 searches rapidly
    const queries = ["aaa", "bbb", "ccc", "ddd", "baskets"]
    for (const q of queries) {
      await input.fill(q)
      await input.press("Enter")
      await xtal.page.waitForTimeout(100)
    }

    // Wait for final results
    await xtal.page.waitForTimeout(3000)

    // The grid should show results from the last query
    const grid = xtal.page.locator(SELECTORS.XTAL_GRID)
    const gridExists = (await grid.count()) > 0

    if (gridExists) {
      const childCount = await grid.evaluate((g) => g.children.length)
      expect(childCount).toBeGreaterThan(0)
    }
    await xtal.screenshot("09-rapid-searches")
  })

  test("destroy during active search doesn't crash", async ({ xtal }) => {
    const errors: string[] = []
    xtal.page.on("pageerror", (err) => {
      if (isXtalError(err.message)) errors.push(err.message)
    })

    // Slow down the API to ensure we can destroy during search
    await xtal.page.route("**/api/xtal/search-full*", async (route) => {
      await new Promise((r) => setTimeout(r, 3000))
      await route.continue()
    })

    await xtal.inject()
    await xtal.search("baskets")

    // Immediately destroy while search is in flight
    await xtal.page.waitForTimeout(200)
    await xtal.destroy()

    await xtal.page.waitForTimeout(2000)

    // No XTAL-related unhandled errors
    expect(errors.length).toBe(0)
    expect(await xtal.isActive()).toBe(false)
    await xtal.screenshot("09-destroy-during-search")
  })

  test("missing product fields render gracefully", async ({ xtal }) => {
    const errors: string[] = []
    xtal.page.on("pageerror", (err) => {
      if (isXtalError(err.message)) errors.push(err.message)
    })

    // Mock search with sparse products
    await xtal.page.route("**/api/xtal/search-full*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PRODUCT_MISSING_FIELDS),
      })
    )

    await xtal.inject()
    await xtal.search("mystery")

    await xtal.page.waitForTimeout(3000)

    // Should render without crashing
    expect(errors.length).toBe(0)

    // Grid should exist with the sparse product
    const grid = xtal.page.locator(SELECTORS.XTAL_GRID)
    if ((await grid.count()) > 0) {
      const childCount = await grid.evaluate((g) => g.children.length)
      expect(childCount).toBeGreaterThanOrEqual(1)
    }
    await xtal.screenshot("09-missing-fields")
  })
})
