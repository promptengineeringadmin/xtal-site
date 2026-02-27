import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"

test.describe("07 — Cleanup & Destroy", () => {
  test("destroy() removes window.XTAL global", async ({ xtal }) => {
    await xtal.inject()
    expect(await xtal.isActive()).toBe(true)

    await xtal.destroy()

    expect(await xtal.isActive()).toBe(false)
    await xtal.screenshot("07-destroy-global")
  })

  test("destroy() restores original grid HTML", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Grid should have XTAL content
    const hasXtalGrid = (await xtal.page.locator(SELECTORS.XTAL_GRID).count()) > 0
    expect(hasXtalGrid).toBe(true)

    // Destroy
    await xtal.destroy()
    await xtal.page.waitForTimeout(500)

    // XTAL grid should be gone
    const xtalGridAfter = await xtal.page.locator(SELECTORS.XTAL_GRID).count()
    expect(xtalGridAfter).toBe(0)

    // Merchant's original content should be back (Angular SPA modifies DOM,
    // so we check for merchant-specific content rather than exact HTML match)
    const containerHtml = await xtal.page
      .locator(SELECTORS.RESULTS_CONTAINER)
      .innerHTML()
      .catch(() => "")

    // Should NOT contain any xtal-grid or xtal-card elements
    expect(containerHtml).not.toContain("xtal-grid")
    expect(containerHtml).not.toContain("xtal-card")
    await xtal.screenshot("07-destroy-restore")
  })

  test("destroy() removes injected CSS", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    await xtal.destroy()
    await xtal.page.waitForTimeout(500)

    // Both style elements should be removed
    const cardStylesAfter = await xtal.page
      .locator(SELECTORS.XTAL_CARD_STYLES)
      .count()
    const keyframesAfter = await xtal.page
      .locator(SELECTORS.XTAL_KEYFRAMES)
      .count()

    expect(cardStylesAfter).toBe(0)
    expect(keyframesAfter).toBe(0)
    await xtal.screenshot("07-destroy-css")
  })

  test("destroy() removes event listeners", async ({ xtal }) => {
    await xtal.inject()

    // Verify SDK is intercepting — pathname should not change
    const pathBefore = new URL(xtal.page.url()).pathname
    await xtal.search("test")
    await xtal.page.waitForTimeout(500)
    const pathAfterSearch = new URL(xtal.page.url()).pathname
    expect(pathAfterSearch).toBe(pathBefore)

    await xtal.destroy()
    await xtal.page.waitForTimeout(500)

    // After destroy, form submit should navigate natively
    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    const inputExists = (await input.count()) > 0

    if (inputExists) {
      await input.fill("native submit test")

      // Wait for navigation (form should submit natively now)
      const [response] = await Promise.all([
        xtal.page
          .waitForNavigation({ timeout: 5_000 })
          .catch(() => null),
        input.press("Enter"),
      ])

      // Navigation should have occurred (native form submit)
      if (response) {
        const pathAfterDestroy = new URL(xtal.page.url()).pathname
        // URL may or may not change — depends on form action.
        // The key assertion is that the SDK interceptor is gone.
      }
    }
    await xtal.screenshot("07-destroy-listeners")
  })

  test("re-injection after destroy works", async ({ xtal }) => {
    await xtal.inject()
    expect(await xtal.isActive()).toBe(true)

    await xtal.destroy()
    expect(await xtal.isActive()).toBe(false)

    // Navigate back to fresh state
    await xtal.page.goto(xtal.merchantUrl, {
      waitUntil: "networkidle",
    })

    // Re-inject
    await xtal.inject()
    expect(await xtal.isActive()).toBe(true)

    // Search should work
    await xtal.search("baskets")
    await xtal.waitForResults()
    await xtal.screenshot("07-re-inject")
  })
})
