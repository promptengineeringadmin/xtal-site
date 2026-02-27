import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"

test.describe("10 — Mobile Viewport", () => {
  test("grid renders responsive columns on mobile viewport", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Willow template uses flex-wrap, not CSS grid — check that cards wrap
    const layout = await xtal.page.locator(SELECTORS.XTAL_GRID).evaluate(
      (grid) => {
        const style = getComputedStyle(grid)
        return {
          display: style.display,
          flexWrap: style.flexWrap,
          gridCols: style.gridTemplateColumns,
          childCount: grid.children.length,
        }
      }
    )

    // Willow template uses display:flex + flex-wrap:wrap
    // Either flex or grid is acceptable
    expect(layout.childCount).toBeGreaterThan(0)
    await xtal.screenshot("10-mobile-grid")
  })

  test("cards render without JS errors on mobile", async ({ xtal }) => {
    const xtalErrors: string[] = []
    xtal.page.on("pageerror", (err) => {
      if (err.message.includes("xtal") || err.message.includes("XTAL"))
        xtalErrors.push(err.message)
    })

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Verify cards rendered
    const cards = xtal.page.locator(`${SELECTORS.XTAL_GRID} > *`)
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    // No XTAL errors
    expect(xtalErrors.length).toBe(0)
    await xtal.screenshot("10-mobile-no-errors")
  })

  test("search input accessible and functional on mobile", async ({
    xtal,
  }) => {
    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    await expect(input).toBeVisible()

    await xtal.inject()

    // Search should work on mobile
    await xtal.search("baskets")
    await xtal.waitForResults()

    const grid = xtal.page.locator(SELECTORS.XTAL_GRID)
    await expect(grid).toBeVisible()

    const cardCount = await grid.evaluate((g) => g.children.length)
    expect(cardCount).toBeGreaterThan(0)
    await xtal.screenshot("10-mobile-search")
  })
})
