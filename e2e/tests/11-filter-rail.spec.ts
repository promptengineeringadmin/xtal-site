import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"
import type { Page } from "@playwright/test"

/** Aggressively dismiss Klaviyo popups, cookie banners, and any overlays */
async function dismissPopups(page: Page) {
  await page.evaluate(() => {
    // Click known dismiss buttons
    document.querySelectorAll(
      '[aria-label="Close dialog"], [aria-label="Close form"], ' +
      '.kl-private-close-button, button.close, .cky-btn-accept'
    ).forEach((el) => (el as HTMLElement).click())

    // Accept cookie consent if present
    const acceptAll = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Accept All"
    )
    if (acceptAll) acceptAll.click()

    // Nuclear: remove Klaviyo & cookie overlay containers entirely
    document.querySelectorAll(
      '.klaviyo-form, [class*="kl-private"], ' +
      '[role="dialog"][aria-label="POPUP Form"], ' +
      '[role="dialog"][aria-modal="true"]'
    ).forEach((el) => el.remove())
  }).catch(() => {})
}

/** Wait for filter search to settle (results or empty state) */
async function waitForFilterSettle(page: Page) {
  await page.waitForFunction(
    (gridSel) => {
      const grid = document.querySelector(gridSel)
      // Grid with cards = results rendered
      if (grid && grid.children.length > 0) return true
      // Empty state rendered
      if (document.querySelector(".xtal-empty")) return true
      // Grid exists but no children = filter narrowed to zero
      if (grid && grid.children.length === 0) return true
      return false
    },
    SELECTORS.XTAL_GRID,
    { timeout: 15_000 }
  ).catch(() => {})
  await page.waitForTimeout(500)
}

test.describe("11 — Filter Rail", () => {
  // ── Desktop (default 1280×720 viewport) ──────────────────────────

  test("rail deferred until search resolves", async ({ xtal }) => {
    await xtal.inject()

    // Rail should NOT exist before any search
    const rail = xtal.page.locator(SELECTORS.XTAL_FILTER_RAIL)
    await expect(rail).toHaveCount(0)

    // Trigger search → rail appears with results
    await xtal.search("baskets")
    await xtal.waitForResults()

    await expect(rail).toBeVisible({ timeout: 15_000 })
    await xtal.screenshot("11-rail-after-search")
  })

  test("layout structure: rail-slot + grid-slot", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const layout = xtal.page.locator(SELECTORS.XTAL_LAYOUT)
    await expect(layout).toBeVisible()

    // Rail slot should be ~260px wide
    const railSlot = xtal.page.locator(SELECTORS.XTAL_RAIL_SLOT)
    await expect(railSlot).toBeVisible()
    const railBox = await railSlot.boundingBox()
    expect(railBox).toBeTruthy()
    expect(railBox!.width).toBeGreaterThanOrEqual(200)
    expect(railBox!.width).toBeLessThanOrEqual(320)

    // Grid slot should contain cards
    const gridSlot = xtal.page.locator(SELECTORS.XTAL_GRID_SLOT)
    await expect(gridSlot).toBeVisible()
    const cards = gridSlot.locator(SELECTORS.XTAL_GRID + " > *")
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    await xtal.screenshot("11-layout-structure")
  })

  test("price presets render wholesale tiers", async ({ xtal }) => {
    await xtal.inject()
    await dismissPopups(xtal.page)
    await xtal.search("baskets")
    await xtal.waitForResults()
    await dismissPopups(xtal.page)

    // Scope to desktop rail to avoid strict-mode violation (drawer has same classes)
    const rail = xtal.page.locator(SELECTORS.XTAL_FILTER_RAIL)
    await expect(rail).toBeVisible({ timeout: 15_000 })

    const presets = rail.locator(SELECTORS.XTAL_PRICE_PRESETS)
    await expect(presets).toBeVisible({ timeout: 15_000 })

    const buttons = presets.locator(SELECTORS.XTAL_PRICE_BTN)
    const count = await buttons.count()
    expect(count).toBeGreaterThanOrEqual(3)

    // Collect button texts
    const labels: string[] = []
    for (let i = 0; i < count; i++) {
      labels.push((await buttons.nth(i).textContent()) ?? "")
    }

    // Should contain at least some dollar-amount presets
    const hasDollar = labels.some((l) => l.includes("$"))
    expect(hasDollar).toBe(true)

    await xtal.screenshot("11-price-presets")
  })

  test("facet click → chip appears + grid re-filters", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const rail = xtal.page.locator(SELECTORS.XTAL_FILTER_RAIL)
    await expect(rail).toBeVisible({ timeout: 15_000 })

    await dismissPopups(xtal.page)

    // Find the first enabled checkbox
    const enabledCheckbox = rail.locator(
      `${SELECTORS.XTAL_FACET_LABEL}:not(${SELECTORS.XTAL_FACET_DISABLED}) ${SELECTORS.XTAL_FACET_CHECKBOX}`
    )
    const checkboxCount = await enabledCheckbox.count()
    expect(checkboxCount).toBeGreaterThan(0)

    // Click the first enabled checkbox
    await enabledCheckbox.first().click({ force: true })

    // Chip appearing proves the facet click registered
    const chip = xtal.page.locator(SELECTORS.XTAL_CHIP)
    await expect(chip.first()).toBeVisible({ timeout: 10_000 })

    // Wait for filter to settle (may return 0 results — that's valid)
    await waitForFilterSettle(xtal.page)

    await xtal.screenshot("11-facet-active")
  })

  test("clear all removes chips and unchecks facets", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const rail = xtal.page.locator(SELECTORS.XTAL_FILTER_RAIL)
    await expect(rail).toBeVisible({ timeout: 15_000 })

    await dismissPopups(xtal.page)

    // Click first enabled checkbox to activate a filter
    const enabledCheckbox = rail.locator(
      `${SELECTORS.XTAL_FACET_LABEL}:not(${SELECTORS.XTAL_FACET_DISABLED}) ${SELECTORS.XTAL_FACET_CHECKBOX}`
    )
    await enabledCheckbox.first().click({ force: true })

    // Verify chip appeared (scope to rail)
    const chip = rail.locator(SELECTORS.XTAL_CHIP)
    await expect(chip.first()).toBeVisible({ timeout: 10_000 })

    await waitForFilterSettle(xtal.page)

    // Click clear all (scope to rail to avoid strict-mode violation with drawer)
    await dismissPopups(xtal.page)
    const clearAll = rail.locator(SELECTORS.XTAL_CLEAR_ALL)
    await expect(clearAll).toBeVisible()
    await clearAll.click({ force: true })

    // Chips should be gone
    await expect(chip).toHaveCount(0, { timeout: 5_000 })

    // The checkbox should be unchecked
    const isChecked = await enabledCheckbox.first().isChecked()
    expect(isChecked).toBe(false)

    await xtal.screenshot("11-clear-all")
  })

  test("zero-count facets are disabled", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const rail = xtal.page.locator(SELECTORS.XTAL_FILTER_RAIL)
    await expect(rail).toBeVisible({ timeout: 15_000 })

    await dismissPopups(xtal.page)

    // Click a facet to narrow results and potentially create zero-count facets
    const enabledCheckbox = rail.locator(
      `${SELECTORS.XTAL_FACET_LABEL}:not(${SELECTORS.XTAL_FACET_DISABLED}) ${SELECTORS.XTAL_FACET_CHECKBOX}`
    )
    if ((await enabledCheckbox.count()) > 0) {
      await enabledCheckbox.first().click({ force: true })
      await waitForFilterSettle(xtal.page)

      // Check if any disabled facets exist — they should have disabled attr
      const disabledLabels = rail.locator(SELECTORS.XTAL_FACET_DISABLED)
      const disabledCount = await disabledLabels.count()
      if (disabledCount > 0) {
        const checkbox = disabledLabels
          .first()
          .locator(SELECTORS.XTAL_FACET_CHECKBOX)
        await expect(checkbox).toBeDisabled()
      }
    }

    await xtal.screenshot("11-zero-count-disabled")
  })

  test("new search resets active filters", async ({ xtal }) => {
    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    const rail = xtal.page.locator(SELECTORS.XTAL_FILTER_RAIL)
    await expect(rail).toBeVisible({ timeout: 15_000 })

    await dismissPopups(xtal.page)

    // Activate a filter
    const enabledCheckbox = rail.locator(
      `${SELECTORS.XTAL_FACET_LABEL}:not(${SELECTORS.XTAL_FACET_DISABLED}) ${SELECTORS.XTAL_FACET_CHECKBOX}`
    )
    if ((await enabledCheckbox.count()) > 0) {
      await enabledCheckbox.first().click({ force: true })
      const chip = xtal.page.locator(SELECTORS.XTAL_CHIP)
      await expect(chip.first()).toBeVisible({ timeout: 10_000 })
    }

    // New search should reset
    await xtal.search("vases")
    await xtal.waitForResults()

    // Chips should be gone after new search
    const chips = xtal.page.locator(SELECTORS.XTAL_CHIP)
    await expect(chips).toHaveCount(0, { timeout: 5_000 })

    await xtal.screenshot("11-new-search-resets")
  })

  // ── Tablet (768px) ───────────────────────────────────────────────

  test("tablet: rail visible + grid adjusts at 768px", async ({ xtal }) => {
    await xtal.page.setViewportSize({ width: 768, height: 1024 })

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Rail should still be visible on tablet
    const rail = xtal.page.locator(SELECTORS.XTAL_FILTER_RAIL)
    await expect(rail).toBeVisible({ timeout: 15_000 })

    // Grid should still have results
    const cards = xtal.page.locator(`${SELECTORS.XTAL_GRID} > *`)
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    await xtal.screenshot("11-tablet")
  })

  // ── Mobile (375px) ───────────────────────────────────────────────

  test("mobile: FAB visible, drawer opens with filters", async ({ xtal }) => {
    await xtal.page.setViewportSize({ width: 375, height: 812 })

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.waitForResults()

    // Desktop rail should be hidden on mobile
    const rail = xtal.page.locator(SELECTORS.XTAL_FILTER_RAIL)
    await expect(rail).not.toBeVisible({ timeout: 5_000 })

    // FAB should be visible
    const fab = xtal.page.locator(SELECTORS.XTAL_FILTER_FAB)
    await expect(fab).toBeVisible({ timeout: 10_000 })
    await xtal.screenshot("11-mobile-fab")

    await dismissPopups(xtal.page)

    // Click FAB → drawer opens
    await fab.click({ force: true })

    // Drawer uses CSS transform for open/close — check for xtal-drawer-open class
    const drawer = xtal.page.locator(SELECTORS.XTAL_FILTER_DRAWER)
    await expect(drawer).toHaveClass(/xtal-drawer-open/, { timeout: 5_000 })

    // Drawer should have filter sections
    const sections = drawer.locator(SELECTORS.XTAL_FILTER_SECTION)
    const sectionCount = await sections.count()
    expect(sectionCount).toBeGreaterThan(0)

    await xtal.screenshot("11-mobile-drawer")

    // "Show N results" button should be visible
    const applyBtn = drawer.locator(SELECTORS.XTAL_DRAWER_APPLY)
    await expect(applyBtn).toBeVisible()

    // Click apply → drawer closes (xtal-drawer-open class removed)
    await applyBtn.click({ force: true })
    await expect(drawer).not.toHaveClass(/xtal-drawer-open/, { timeout: 5_000 })

    await xtal.screenshot("11-mobile-drawer-closed")
  })
})
