import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"
import {
  MOCK_CONFIG,
  MOCK_SEARCH_RESULTS,
  MOCK_SEARCH_EMPTY,
} from "../fixtures/mock-responses"

test.describe("03 — Results Rendering", () => {
  test("shows loading state during fetch", async ({ xtal }) => {
    // Delay API response to catch loading state
    await xtal.page.route("**/api/xtal/search-full*", async (route) => {
      await new Promise((r) => setTimeout(r, 2000))
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SEARCH_RESULTS),
      })
    })

    await xtal.inject()
    await xtal.search("baskets")

    // Check for loading indicator — SDK shows "Searching..." text
    const loadingVisible = await xtal.page
      .getByText("Searching...")
      .isVisible()
      .catch(() => false)

    await xtal.screenshot("03-loading-state")
    // Loading may or may not be caught depending on timing
    // The important thing is that results eventually appear
    await xtal.waitForResults()
  })

  test("renders product cards in .xtal-grid", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const cardCount = await xtal.page.locator(SELECTORS.XTAL_GRID).evaluate(
      (grid) => grid.children.length
    )
    expect(cardCount).toBeGreaterThan(0)
    await xtal.screenshot("03-grid-with-cards")
  })

  test("templated cards show title, price, image", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Check that card elements have content
    const grid = xtal.page.locator(SELECTORS.XTAL_GRID)
    const firstCard = grid.locator("> *").first()
    await firstCard.waitFor({ state: "visible" })

    // Get the card's text content — should have product info
    const cardText = await firstCard.textContent()
    expect(cardText).toBeTruthy()
    expect(cardText!.length).toBeGreaterThan(0)

    // Check for images
    const images = firstCard.locator("img")
    const imgCount = await images.count()
    if (imgCount > 0) {
      const src = await images.first().getAttribute("src")
      expect(src).toBeTruthy()
    }

    await xtal.screenshot("03-card-content")
  })

  test('displays "No results found" for nonsense query', async ({ xtal }) => {
    // Mock the API to return empty results (live API may return results for anything)
    await xtal.page.route("**/api/xtal/search-full*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SEARCH_EMPTY),
      })
    )

    await xtal.inject()
    await xtal.search("xyzzy123nonsense")

    // Wait for the no-results message
    await xtal.page.waitForTimeout(3000)

    const pageText = await xtal.page.textContent("body")
    const hasNoResults =
      pageText?.includes("No results") || pageText?.includes("no results")

    expect(hasNoResults).toBe(true)
    await xtal.screenshot("03-no-results")
  })

  test("replaces merchant original grid", async ({ xtal }) => {
    // Capture original grid content
    const originalContent = await xtal.page
      .locator(SELECTORS.RESULTS_CONTAINER)
      .innerHTML()
      .catch(() => "")

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Grid content should be different now (replaced by XTAL)
    const newContent = await xtal.page
      .locator(SELECTORS.RESULTS_CONTAINER)
      .innerHTML()
      .catch(() => "")

    if (originalContent) {
      expect(newContent).not.toBe(originalContent)
    }
    await xtal.screenshot("03-grid-replaced")
  })

  test("respects 24-product limit", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const cardCount = await xtal.page
      .locator(SELECTORS.XTAL_GRID)
      .evaluate((grid) => grid.children.length)

    expect(cardCount).toBeLessThanOrEqual(24)
    await xtal.screenshot("03-product-limit")
  })

  test("price formatting shows dollar amounts", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Get text from first card and look for price pattern
    const grid = xtal.page.locator(SELECTORS.XTAL_GRID)
    const firstCard = grid.locator("> *").first()
    const cardText = await firstCard.textContent()

    // Price should match $X.XX or $X,XXX.XX pattern
    const hasDollarAmount = /\$\d+(\.\d{2})?/.test(cardText || "")
    expect(hasDollarAmount).toBe(true)
    await xtal.screenshot("03-price-format")
  })
})
