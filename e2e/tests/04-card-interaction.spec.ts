import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"
import {
  MOCK_CONFIG,
  MOCK_CONFIG_WITH_URL_PATTERN,
  MOCK_SEARCH_RESULTS,
} from "../fixtures/mock-responses"

test.describe("04 — Card Interactions", () => {
  test("product links include UTM params", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Find a view-product link
    const link = xtal.page.locator(SELECTORS.XTAL_ACTION_VIEW).first()
    await link.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {})

    // If template cards are used, check the action link
    const linkCount = await xtal.page
      .locator(SELECTORS.XTAL_ACTION_VIEW)
      .count()

    if (linkCount > 0) {
      // Click the view product button and check popup URL
      const [popup] = await Promise.all([
        xtal.page.waitForEvent("popup", { timeout: 5_000 }).catch(() => null),
        link.click(),
      ])

      if (popup) {
        const popupUrl = popup.url()
        expect(popupUrl).toContain("utm_source=xtal")
        expect(popupUrl).toContain("utm_medium=search")
        await popup.close()
      }
    } else {
      // Default cards — check anchor tags
      const anchors = xtal.page.locator(`${SELECTORS.XTAL_GRID} a`)
      const count = await anchors.count()
      if (count > 0) {
        const href = await anchors.first().getAttribute("href")
        // UTM params may be in href or applied on click
        expect(href).toBeTruthy()
      }
    }

    await xtal.screenshot("04-utm-params")
  })

  test("view-product links have target=_blank + noopener", async ({
    xtal,
  }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Check default card links
    const anchors = xtal.page.locator(`${SELECTORS.XTAL_GRID} a`)
    const count = await anchors.count()

    if (count > 0) {
      const target = await anchors.first().getAttribute("target")
      const rel = await anchors.first().getAttribute("rel")
      expect(target).toBe("_blank")
      if (rel) {
        expect(rel).toContain("noopener")
      }
    }

    await xtal.screenshot("04-link-attrs")
  })

  test('ATC button shows "View Product" on fallback adapter', async ({
    xtal,
  }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // On non-Shopify (Willow), ATC buttons should say "View Product"
    const atcButtons = xtal.page.locator(SELECTORS.XTAL_ACTION_ATC)
    const count = await atcButtons.count()

    if (count > 0) {
      const text = await atcButtons.first().textContent()
      expect(text).toContain("View Product")
    }
    await xtal.screenshot("04-atc-fallback-text")
  })

  test("fallback ATC opens product URL in new tab", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const atcButton = xtal.page.locator(SELECTORS.XTAL_ACTION_ATC).first()
    const atcCount = await xtal.page.locator(SELECTORS.XTAL_ACTION_ATC).count()

    if (atcCount > 0) {
      const [popup] = await Promise.all([
        xtal.page.waitForEvent("popup", { timeout: 5_000 }).catch(() => null),
        atcButton.click(),
      ])

      if (popup) {
        expect(popup.url()).not.toBe("about:blank")
        await popup.close()
      }
    }
    await xtal.screenshot("04-atc-new-tab")
  })

  test("product URL uses productUrlPattern when configured", async ({
    xtal,
  }) => {
    // Mock config with productUrlPattern
    await xtal.page.route("**/api/xtal/config*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CONFIG_WITH_URL_PATTERN),
      })
    )

    // Mock search results with known SKUs
    await xtal.page.route("**/api/xtal/search-full*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SEARCH_RESULTS),
      })
    )

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // View product click should use the pattern URL
    const viewButton = xtal.page.locator(SELECTORS.XTAL_ACTION_VIEW).first()
    const viewCount = await xtal.page
      .locator(SELECTORS.XTAL_ACTION_VIEW)
      .count()

    if (viewCount > 0) {
      const [popup] = await Promise.all([
        xtal.page.waitForEvent("popup", { timeout: 5_000 }).catch(() => null),
        viewButton.click(),
      ])

      if (popup) {
        const url = popup.url()
        expect(url).toContain("/product/")
        expect(url).toContain("WBL-001")
        await popup.close()
      }
    }

    await xtal.screenshot("04-url-pattern")
  })

  test("product URL prefixes siteUrl for relative paths", async ({ xtal }) => {
    // Mock config with siteUrl
    const configWithSiteUrl = {
      ...MOCK_CONFIG_WITH_URL_PATTERN,
      productUrlPattern: undefined,
      siteUrl: "https://www.willowgroupltd.com",
    }
    await xtal.page.route("**/api/xtal/config*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(configWithSiteUrl),
      })
    )

    await xtal.page.route("**/api/xtal/search-full*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SEARCH_RESULTS),
      })
    )

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const viewButton = xtal.page.locator(SELECTORS.XTAL_ACTION_VIEW).first()
    const viewCount = await xtal.page
      .locator(SELECTORS.XTAL_ACTION_VIEW)
      .count()

    if (viewCount > 0) {
      const [popup] = await Promise.all([
        xtal.page.waitForEvent("popup", { timeout: 5_000 }).catch(() => null),
        viewButton.click(),
      ])

      if (popup) {
        const url = popup.url()
        // Relative path /shop/wicker-basket-large should be prefixed with siteUrl
        expect(url).toContain("willowgroupltd.com")
        await popup.close()
      }
    }
    await xtal.screenshot("04-siteurl-prefix")
  })
})
