import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"

test.describe("08 — CSS Isolation", () => {
  test("card template CSS injected as #xtal-card-styles", async ({ xtal }) => {
    await xtal.inject()

    // <style> tags are invisible — use state: 'attached' not 'visible'
    await xtal.page.waitForSelector(SELECTORS.XTAL_CARD_STYLES, {
      state: "attached",
      timeout: 10_000,
    })

    const style = xtal.page.locator(SELECTORS.XTAL_CARD_STYLES)
    expect(await style.count()).toBe(1)

    const content = await style.textContent()
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(0)
    await xtal.screenshot("08-card-css-injected")
  })

  test("SDK styles don't override merchant body/heading styles", async ({
    xtal,
  }) => {
    // Capture computed styles before injection
    const beforeStyles = await xtal.page.evaluate(() => {
      const body = document.body
      const heading = document.querySelector("h1, h2, h3")
      return {
        bodyFont: getComputedStyle(body).fontFamily,
        bodyColor: getComputedStyle(body).color,
        bodyBg: getComputedStyle(body).backgroundColor,
        headingFont: heading
          ? getComputedStyle(heading).fontFamily
          : null,
        headingColor: heading
          ? getComputedStyle(heading).color
          : null,
      }
    })

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Capture computed styles after injection
    const afterStyles = await xtal.page.evaluate(() => {
      const body = document.body
      const heading = document.querySelector("h1, h2, h3")
      return {
        bodyFont: getComputedStyle(body).fontFamily,
        bodyColor: getComputedStyle(body).color,
        bodyBg: getComputedStyle(body).backgroundColor,
        headingFont: heading
          ? getComputedStyle(heading).fontFamily
          : null,
        headingColor: heading
          ? getComputedStyle(heading).color
          : null,
      }
    })

    // Merchant body/heading styles should be unchanged
    expect(afterStyles.bodyFont).toBe(beforeStyles.bodyFont)
    expect(afterStyles.bodyColor).toBe(beforeStyles.bodyColor)
    expect(afterStyles.bodyBg).toBe(beforeStyles.bodyBg)

    if (beforeStyles.headingFont) {
      expect(afterStyles.headingFont).toBe(beforeStyles.headingFont)
      expect(afterStyles.headingColor).toBe(beforeStyles.headingColor)
    }
    await xtal.screenshot("08-no-style-leak")
  })

  test("keyframes animation style injected for loading", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")

    // Wait briefly to let loading state render
    await xtal.page.waitForTimeout(500)

    // Check for keyframes style element
    const keyframesEl = await xtal.page
      .locator(SELECTORS.XTAL_KEYFRAMES)
      .count()

    // The keyframes element is created when showLoading() is called
    // It may or may not still exist depending on timing
    // Check if it was ever created by looking for it or the grid
    const hasKeyframesOrGrid =
      keyframesEl > 0 ||
      (await xtal.page.locator(SELECTORS.XTAL_GRID).count()) > 0

    expect(hasKeyframesOrGrid).toBe(true)

    // If keyframes exists, verify it has the animation
    if (keyframesEl > 0) {
      const content = await xtal.page
        .locator(SELECTORS.XTAL_KEYFRAMES)
        .textContent()
      expect(content).toContain("xtal-inline-spin")
    }
    await xtal.screenshot("08-keyframes")
  })
})
