import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"

test.describe("05 — Navigation & History", () => {
  test("search results persist after scroll", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Scroll down
    await xtal.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await xtal.page.waitForTimeout(500)

    // Scroll back up
    await xtal.page.evaluate(() => window.scrollTo(0, 0))
    await xtal.page.waitForTimeout(500)

    // Results should still be visible
    const grid = xtal.page.locator(SELECTORS.XTAL_GRID)
    await expect(grid).toBeVisible()

    const cardCount = await grid.evaluate((g) => g.children.length)
    expect(cardCount).toBeGreaterThan(0)
    await xtal.screenshot("05-scroll-persist")
  })

  test("page refresh clears SDK state", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Reload the page
    await xtal.page.reload({ waitUntil: "domcontentloaded" })

    // window.XTAL should be gone
    const active = await xtal.isActive()
    expect(active).toBe(false)

    // Merchant content should be restored (SDK no longer injected)
    await xtal.screenshot("05-refresh-clears")
  })

  test("SDK does not break browser back button", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Navigate to a different page
    await xtal.page.goto("https://www.willowgroupltd.com/", {
      waitUntil: "domcontentloaded",
    })

    // Go back
    await xtal.page.goBack({ waitUntil: "domcontentloaded" })

    // Page should load correctly
    const title = await xtal.page.title()
    expect(title.length).toBeGreaterThan(0)
    await xtal.screenshot("05-back-button")
  })

  test("SDK does not push unwanted history entries", async ({ xtal }) => {
    const historyBefore = await xtal.page.evaluate(() => history.length)

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const historyAfter = await xtal.page.evaluate(() => history.length)

    // SDK should not add history entries
    expect(historyAfter).toBe(historyBefore)
    await xtal.screenshot("05-no-history-push")
  })

  test("re-search after navigation works", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Navigate away
    await xtal.page.goto("https://www.willowgroupltd.com/", {
      waitUntil: "domcontentloaded",
    })

    // Come back to search page — wait for full load so SDK can boot
    await xtal.page.goto(xtal.merchantUrl, {
      waitUntil: "networkidle",
    })

    // Re-inject SDK
    await xtal.inject()

    // Search again
    await xtal.search("hampers")
    await xtal.waitForResults()

    const grid = xtal.page.locator(SELECTORS.XTAL_GRID)
    await expect(grid).toBeVisible()
    await xtal.screenshot("05-re-search")
  })
})
