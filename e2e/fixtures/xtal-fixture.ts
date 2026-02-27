import { test as base, expect, type Page } from "@playwright/test"
import { injectXtalSDK, destroyXtal, isXtalActive } from "../helpers/injection"
import { SELECTORS } from "../helpers/selectors"

const API_BASE = process.env.E2E_API_BASE || "https://www.xtalsearch.com"
const COLLECTION = process.env.E2E_COLLECTION || "willow"
const MERCHANT_URL =
  process.env.E2E_MERCHANT_URL ||
  "https://www.willowgroupltd.com/shop/?Search=baskets"

export type XtalFixtures = {
  /** Navigate to merchant, inject SDK, wait for boot */
  xtal: {
    page: Page
    apiBase: string
    collection: string
    merchantUrl: string
    /** Inject SDK and wait for window.XTAL to appear */
    inject: () => Promise<void>
    /** Destroy SDK via window.XTAL.destroy() */
    destroy: () => Promise<void>
    /** Check if SDK is active */
    isActive: () => Promise<boolean>
    /** Type into search input and submit */
    search: (query: string) => Promise<void>
    /** Wait for XTAL grid to render with cards */
    waitForResults: () => Promise<void>
    /** Take a named screenshot */
    screenshot: (name: string) => Promise<void>
  }
}

export const test = base.extend<XtalFixtures>({
  xtal: async ({ page }, use) => {
    // Navigate to merchant site
    await page.goto(MERCHANT_URL, { waitUntil: "domcontentloaded" })

    const fixture = {
      page,
      apiBase: API_BASE,
      collection: COLLECTION,
      merchantUrl: MERCHANT_URL,

      async inject() {
        // Dismiss any popups (Klaviyo, cookie consent) that may block interactions
        await page.evaluate(() => {
          document.querySelectorAll(
            '[aria-label="Close dialog"], .kl-private-close-button, button.close, .cky-btn-accept'
          ).forEach((el) => (el as HTMLElement).click())
        }).catch(() => {})

        await injectXtalSDK(page, API_BASE, COLLECTION)
        // Wait for SDK to boot and expose window.XTAL (30s for slow networks)
        await page.waitForFunction(() => (window as any).XTAL !== undefined, {
          timeout: 30_000,
        })
      },

      async destroy() {
        await destroyXtal(page)
      },

      async isActive() {
        return isXtalActive(page)
      },

      async search(query: string) {
        // Dismiss popups that may overlay the search input
        await page.evaluate(() => {
          document.querySelectorAll(
            '[aria-label="Close dialog"], .kl-private-close-button, button.close, .cky-btn-accept'
          ).forEach((el) => (el as HTMLElement).click())
        }).catch(() => {})

        const input = page.locator(SELECTORS.SEARCH_INPUT)
        await input.waitFor({ state: "visible", timeout: 15_000 })
        await input.click({ force: true })
        await input.fill(query)
        await input.press("Enter")
      },

      async waitForResults() {
        await page.waitForSelector(SELECTORS.XTAL_GRID, { timeout: 15_000 })
        // Wait for at least one card to appear
        await page.waitForFunction(
          (sel) => {
            const grid = document.querySelector(sel)
            return grid && grid.children.length > 0
          },
          SELECTORS.XTAL_GRID,
          { timeout: 15_000 }
        )
      },

      async screenshot(name: string) {
        await page.screenshot({
          path: `e2e/screenshots/${name}.png`,
          fullPage: false,
        })
      },
    }

    await use(fixture)
  },
})

export { expect }
