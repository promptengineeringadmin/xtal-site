import type { Page } from "@playwright/test"

/**
 * Inject the XTAL SDK into a page by creating a <script data-shop-id> tag.
 * This mirrors real dev-tools injection — the SDK finds its own script tag
 * to derive apiBase and shopId.
 */
export async function injectXtalSDK(
  page: Page,
  apiBase: string,
  collection: string
): Promise<void> {
  await page.evaluate(
    ({ apiBase, collection }) => {
      // Remove any existing XTAL script
      const existing = document.querySelector('script[data-shop-id]')
      if (existing) existing.remove()

      const script = document.createElement("script")
      script.setAttribute("data-shop-id", collection)
      script.src = `${apiBase}/client/v1/xtal.js`
      document.head.appendChild(script)
    },
    { apiBase, collection }
  )
}

/** Call window.XTAL.destroy() if available.
 *  Wraps in try/catch because deployed SDK uses `delete window.XTAL`
 *  which throws in strict mode (fixed locally but not yet deployed). */
export async function destroyXtal(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      const xtal = (window as any).XTAL
      if (xtal && typeof xtal.destroy === "function") {
        xtal.destroy()
      }
    } catch {
      (window as any).XTAL = undefined
    }
  })
}

/** Check if window.XTAL exists */
export async function isXtalActive(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as any).XTAL !== undefined)
}
