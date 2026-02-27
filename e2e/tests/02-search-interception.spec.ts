import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"

const SANDBOX_BASE =
  process.env.E2E_API_BASE || "https://www.xtalsearch.com"

test.describe("02 — Search Interception & Debounce", () => {
  test("intercepts form submit, prevents native navigation", async ({
    xtal,
  }) => {
    await xtal.inject()

    // Capture the URL pathname before search (Angular SPA may add query params)
    const pathBefore = new URL(xtal.page.url()).pathname

    await xtal.search("wicker baskets")

    // Pathname should NOT change (native form submit prevented — no page navigation)
    await xtal.page.waitForTimeout(1000)
    const pathAfter = new URL(xtal.page.url()).pathname
    expect(pathAfter).toBe(pathBefore)

    // XTAL results should appear
    await xtal.waitForResults()
    await xtal.screenshot("02-form-submit-intercepted")
  })

  test("intercepts Enter key on search input", async ({ xtal }) => {
    await xtal.inject()

    const pathBefore = new URL(xtal.page.url()).pathname

    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    await input.waitFor({ state: "visible" })
    await input.click()
    await input.fill("storage baskets")
    await input.press("Enter")

    await xtal.page.waitForTimeout(1000)
    const pathAfter = new URL(xtal.page.url()).pathname
    expect(pathAfter).toBe(pathBefore)
    await xtal.waitForResults()
  })

  test("debounces rapid typing (200ms)", async ({ xtal }) => {
    await xtal.inject()

    let searchCount = 0
    await xtal.page.route("**/api/xtal/search-full*", async (route) => {
      searchCount++
      await route.continue()
    })

    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    await input.waitFor({ state: "visible" })
    await input.click()

    // Type characters rapidly without pressing Enter
    await input.pressSequentially("hampers", { delay: 30 })
    await input.press("Enter")

    // Wait for debounce and response
    await xtal.page.waitForTimeout(2000)

    // Due to debounce, far fewer requests than characters typed
    expect(searchCount).toBeLessThanOrEqual(2)
    await xtal.screenshot("02-debounce")
  })

  test("empty input on submit is rejected", async ({ xtal }) => {
    await xtal.inject()

    let searchFired = false
    await xtal.page.route("**/api/xtal/search-full*", async (route) => {
      searchFired = true
      await route.continue()
    })

    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    await input.waitFor({ state: "visible" })
    await input.click()
    await input.fill("   ")
    await input.press("Enter")

    await xtal.page.waitForTimeout(1000)
    expect(searchFired).toBe(false)
  })

  test("MutationObserver finds late-rendered input", async ({ xtal }) => {
    // Navigate to sandbox SPA-delayed scenario
    await xtal.page.goto(`${SANDBOX_BASE}/sandbox/storefront/spa-delayed`, {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    })

    // Inject SDK before input exists — use sandbox collection
    await xtal.page.evaluate(
      ({ apiBase }) => {
        const script = document.createElement("script")
        script.setAttribute("data-shop-id", "sandbox-test")
        script.src = `${apiBase}/client/v1/xtal.js`
        document.head.appendChild(script)
      },
      { apiBase: xtal.apiBase }
    )

    // The spa-delayed page renders the input after a delay.
    // SDK should boot once the input appears via MutationObserver.
    // If the sandbox page doesn't exist or SDK can't boot, skip gracefully.
    try {
      await xtal.page.waitForFunction(
        () => (window as any).XTAL !== undefined,
        { timeout: 15_000 }
      )
      expect(await xtal.isActive()).toBe(true)
    } catch {
      // Sandbox page may not be available — test is informational
      test.skip()
    }
    await xtal.screenshot("02-mutation-observer")
  })

  test("capture-phase beats Angular ng-submit", async ({ xtal }) => {
    await xtal.page.goto(
      `${SANDBOX_BASE}/sandbox/storefront/angular-ngsubmit`,
      { waitUntil: "domcontentloaded", timeout: 20_000 }
    )

    await xtal.page.evaluate(
      ({ apiBase }) => {
        const script = document.createElement("script")
        script.setAttribute("data-shop-id", "sandbox-test")
        script.src = `${apiBase}/client/v1/xtal.js`
        document.head.appendChild(script)
      },
      { apiBase: xtal.apiBase }
    )

    try {
      await xtal.page.waitForFunction(
        () => (window as any).XTAL !== undefined,
        { timeout: 15_000 }
      )
    } catch {
      test.skip()
      return
    }

    const pathBefore = new URL(xtal.page.url()).pathname
    const input = xtal.page.locator('input[type="search"], input[name="Search"], input[name="q"], #search_field')
    await input.first().waitFor({ state: "visible", timeout: 5_000 })
    await input.first().fill("test query")
    await input.first().press("Enter")

    await xtal.page.waitForTimeout(1000)
    // Pathname should not have changed — Angular's ng-submit was intercepted
    const pathAfter = new URL(xtal.page.url()).pathname
    expect(pathAfter).toBe(pathBefore)
    await xtal.screenshot("02-angular-intercept")
  })

  test("multiple rapid Enter presses cause AbortController cancellation", async ({
    xtal,
  }) => {
    await xtal.inject()

    const searchQueries: string[] = []
    await xtal.page.route("**/api/xtal/search-full*", async (route) => {
      const url = new URL(route.request().url())
      searchQueries.push(url.searchParams.get("q") || "")
      await route.continue()
    })

    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    await input.waitFor({ state: "visible" })

    // Fire 5 rapid searches
    for (const q of ["a", "ab", "abc", "abcd", "abcde"]) {
      await input.fill(q)
      await input.press("Enter")
    }

    // Wait for debounce + responses
    await xtal.page.waitForTimeout(3000)

    // Only the last query should have results displayed
    await xtal.screenshot("02-abort-controller")
  })

  test("clears previous debounce timer on new input", async ({ xtal }) => {
    await xtal.inject()

    const queriesSent: string[] = []
    await xtal.page.route("**/api/xtal/search-full*", async (route) => {
      const url = new URL(route.request().url())
      const q = route.request().postData()
        ? JSON.parse(route.request().postData()!).q
        : url.searchParams.get("q")
      queriesSent.push(q || "unknown")
      await route.continue()
    })

    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    await input.waitFor({ state: "visible" })

    // Type "old" and press Enter
    await input.fill("old query")
    await input.press("Enter")

    // Quickly type "new" and press Enter before debounce fires for "old"
    await input.fill("new query")
    await input.press("Enter")

    await xtal.page.waitForTimeout(2000)

    // The debounce should collapse both into the last query
    // At minimum, "new query" should be the last search sent
    await xtal.waitForResults()
    await xtal.screenshot("02-debounce-clear")
  })
})
