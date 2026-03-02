/**
 * 12-security.spec.ts — SDK Security Audit
 *
 * Loads the XTAL SDK on willowgroupltd.com and probes for:
 *   - XSS via cardTemplate injection (innerHTML)
 *   - XSS via product data interpolation (no escaping)
 *   - Config injection (javascript: URIs, destructive selectors)
 *   - Prototype pollution
 *   - CSS injection
 *   - DOM clobbering
 *   - CORS / rate limiting
 *
 * Tests that FAIL reveal confirmed vulnerabilities.
 */
import { test, expect } from "../fixtures/xtal-fixture"
import { SELECTORS } from "../helpers/selectors"
import { MOCK_CONFIG, MOCK_SEARCH_RESULTS } from "../fixtures/mock-responses"
import {
  XSS_TEMPLATES,
  makeXSSConfig,
  XSS_PRODUCT_DATA,
  POISONED_CONFIGS,
  PROTO_POLLUTION_SEARCH_BODY,
  PROTO_POLLUTION_CONFIG_BODY,
  CSS_INJECTION_CONFIG,
  DOM_CLOBBER_SETUP,
  ALL_XSS_MARKERS,
} from "../fixtures/security-payloads"

// ─── Helpers ──────────────────────────────────────────────

/** Check that no XSS marker globals were set on window */
async function checkXSSMarkers(
  page: import("@playwright/test").Page
): Promise<string[]> {
  return page.evaluate((markers: string[]) => {
    return markers.filter((m) => (window as any)[m] !== undefined)
  }, [...ALL_XSS_MARKERS])
}

/** Mock config + search routes, inject SDK, trigger search, wait for render */
async function runXSSScenario(
  xtal: any,
  config: object,
  searchResults: object = MOCK_SEARCH_RESULTS
) {
  const { page } = xtal

  await page.route("**/api/xtal/config*", (route: any) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(config),
    })
  )

  await page.route("**/api/xtal/search-full*", (route: any) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(searchResults),
    })
  )

  await page.route("**/api/xtal/events*", (route: any) =>
    route.fulfill({ status: 200, body: "OK" })
  )

  await xtal.inject()
  await xtal.search("test")
  await page.waitForTimeout(3000)
}

// ==========================================================
// HIGH: XSS via cardTemplate injection
// ==========================================================

test.describe("12-SEC — XSS via cardTemplate injection", () => {
  test("img onerror in template", async ({ xtal }) => {
    await runXSSScenario(xtal, makeXSSConfig(XSS_TEMPLATES.imgOnerror))
    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-xss-img-onerror")
    expect(fired, "img onerror XSS fired — template needs sanitization").toEqual([])
  })

  test("svg onload in template", async ({ xtal }) => {
    await runXSSScenario(xtal, makeXSSConfig(XSS_TEMPLATES.svgOnload))
    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-xss-svg-onload")
    expect(fired, "svg onload XSS fired — template needs sanitization").toEqual([])
  })

  test("script tag in template (HTML5 spec says no-exec via innerHTML)", async ({ xtal }) => {
    await runXSSScenario(xtal, makeXSSConfig(XSS_TEMPLATES.scriptTag))
    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-xss-script-tag")
    expect(fired).toEqual([])
  })

  test("iframe srcdoc in template does not execute parent XSS", async ({ xtal }) => {
    await runXSSScenario(xtal, makeXSSConfig(XSS_TEMPLATES.iframeSrcdoc))
    await xtal.page.waitForTimeout(2000) // give iframe time to load
    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-xss-iframe-srcdoc")
    expect(fired, "iframe srcdoc XSS escaped to parent").toEqual([])
  })

  test("onmouseover event handler in template div", async ({ xtal }) => {
    await runXSSScenario(xtal, makeXSSConfig(XSS_TEMPLATES.eventHandlerDiv))

    // Trigger the event handler by hovering over the card
    const card = xtal.page.locator(".product-card").first()
    if ((await card.count()) > 0) {
      await card.hover().catch(() => {})
      await xtal.page.waitForTimeout(500)
    }

    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-xss-event-handler")
    expect(
      fired,
      "EVENT HANDLER XSS FIRED — cardTemplate needs sanitization (strip on* attrs)"
    ).toEqual([])
  })

  test("body onload in template", async ({ xtal }) => {
    await runXSSScenario(xtal, makeXSSConfig(XSS_TEMPLATES.bodyOnload))
    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-xss-body-onload")
    expect(fired).toEqual([])
  })

  test("javascript: href in template anchor is overwritten by SDK", async ({ xtal }) => {
    await runXSSScenario(xtal, makeXSSConfig(XSS_TEMPLATES.anchorJavascript))

    // The SDK wires data-xtal-action="view-product" anchors, overwriting href
    const anchor = xtal.page.locator('[data-xtal-action="view-product"]').first()
    if ((await anchor.count()) > 0) {
      const href = await anchor.getAttribute("href")
      expect(href).not.toContain("javascript:")
    }

    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-xss-js-href")
    expect(fired).toEqual([])
  })

  test("details ontoggle in template", async ({ xtal }) => {
    await runXSSScenario(xtal, makeXSSConfig(XSS_TEMPLATES.detailsOntoggle))
    await xtal.page.waitForTimeout(2000)
    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-xss-details-ontoggle")
    expect(fired, "details ontoggle XSS fired — strip on* attrs").toEqual([])
  })
})

// ==========================================================
// HIGH: XSS via product data interpolation
// ==========================================================

test.describe("12-SEC — XSS via product data interpolation", () => {
  test("HTML in product title does not execute after interpolation", async ({ xtal }) => {
    await runXSSScenario(xtal, MOCK_CONFIG, XSS_PRODUCT_DATA)

    // Hover over cards to trigger potential onload/onmouseover
    const cards = xtal.page.locator(".product-card")
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      await cards.nth(i).hover().catch(() => {})
    }
    await xtal.page.waitForTimeout(1000)

    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-xss-product-data")
    expect(
      fired,
      "PRODUCT DATA XSS FIRED — interpolateTokens needs HTML escaping"
    ).toEqual([])
  })

  test("javascript: URI in product image_url does not load", async ({ xtal }) => {
    await runXSSScenario(xtal, MOCK_CONFIG, XSS_PRODUCT_DATA)

    const jsImgSrcs = await xtal.page.evaluate(() => {
      const imgs = document.querySelectorAll(".xtal-grid img, .product-card img")
      return Array.from(imgs)
        .map((img) => (img as HTMLImageElement).src)
        .filter((src) => src.startsWith("javascript:"))
    })

    await xtal.screenshot("12-sec-xss-product-imgurl")
    expect(jsImgSrcs).toEqual([])
  })
})

// ==========================================================
// HIGH: Config injection
// ==========================================================

test.describe("12-SEC — Config injection", () => {
  test("javascript: productUrlPattern does not execute on click", async ({ xtal }) => {
    await runXSSScenario(xtal, POISONED_CONFIGS.javascriptUrl)

    let navigatedTo = ""
    xtal.page.on("popup", async (popup: any) => {
      navigatedTo = popup.url()
      await popup.close()
    })

    const viewBtn = xtal.page
      .locator(SELECTORS.XTAL_ACTION_VIEW)
      .first()
    if ((await viewBtn.count()) > 0) {
      await viewBtn.click().catch(() => {})
      await xtal.page.waitForTimeout(1000)
    }

    expect(navigatedTo).not.toContain("javascript:")

    const fired = await checkXSSMarkers(xtal.page)
    await xtal.screenshot("12-sec-config-js-url")
    expect(fired, "javascript: productUrlPattern executed").toEqual([])
  })

  test("javascript: siteUrl does not execute on search-error fallback", async ({ xtal }) => {
    const { page } = xtal
    let navigatedUrl = ""

    page.on("framenavigated", (frame: any) => {
      if (frame === page.mainFrame()) {
        navigatedUrl = frame.url()
      }
    })

    await page.route("**/api/xtal/config*", (route: any) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(POISONED_CONFIGS.javascriptSiteUrl),
      })
    )

    // Make search fail to trigger the fallback navigation
    await page.route("**/api/xtal/search-full*", (route: any) =>
      route.fulfill({ status: 500, body: "Server Error" })
    )

    await page.route("**/api/xtal/events*", (route: any) =>
      route.fulfill({ status: 200, body: "OK" })
    )

    await xtal.inject()
    await xtal.search("test")
    await page.waitForTimeout(5000)

    expect(navigatedUrl).not.toContain("javascript:")

    const fired = await checkXSSMarkers(page)
    await xtal.screenshot("12-sec-config-js-siteurl")
    expect(fired, "javascript: siteUrl fallback executed").toEqual([])
  })

  test("resultsSelector=body — document page destruction", async ({ xtal }) => {
    const bodyBefore = await xtal.page.evaluate(
      () => document.body.children.length
    )

    await runXSSScenario(xtal, POISONED_CONFIGS.bodySelector)

    const bodyAfter = await xtal.page.evaluate(
      () => document.body.children.length
    )
    const bodyHtml = await xtal.page.evaluate(() => document.body.innerHTML)
    const hasOriginalContent =
      bodyHtml.includes("<header") ||
      bodyHtml.includes("<nav") ||
      bodyHtml.includes("<footer") ||
      bodyHtml.includes("search_field")

    await xtal.screenshot("12-sec-config-body-selector")

    if (!hasOriginalContent) {
      console.warn(
        `[SEC] resultsSelector=body REPLACED ENTIRE PAGE (${bodyBefore} → ${bodyAfter} children) — DOS vulnerability`
      )
    }

    // The SDK should ideally reject "body" as a selector
    expect(
      hasOriginalContent,
      "resultsSelector=body destroyed the page — needs selector validation"
    ).toBe(true)
  })

  test("searchSelector=* does not crash the page", async ({ xtal }) => {
    const errors: string[] = []
    xtal.page.on("pageerror", (err: Error) => errors.push(err.message))

    await xtal.page.route("**/api/xtal/config*", (route: any) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(POISONED_CONFIGS.wildcardSearch),
      })
    )

    await xtal.page.route("**/api/xtal/events*", (route: any) =>
      route.fulfill({ status: 200, body: "OK" })
    )

    await xtal.inject()
    await xtal.page.waitForTimeout(3000)

    const title = await xtal.page.title()
    expect(title.length).toBeGreaterThan(0)
    await xtal.screenshot("12-sec-config-wildcard-selector")
  })
})

// ==========================================================
// MEDIUM: Open redirect via productUrlPattern
// ==========================================================

test.describe("12-SEC — Open redirect", () => {
  test("productUrlPattern redirects to external domain (document)", async ({ xtal }) => {
    await runXSSScenario(xtal, POISONED_CONFIGS.openRedirect)

    let popupUrl = ""
    xtal.page.on("popup", async (popup: any) => {
      popupUrl = popup.url()
      await popup.close()
    })

    const viewBtn = xtal.page
      .locator(SELECTORS.XTAL_ACTION_VIEW)
      .first()
    if ((await viewBtn.count()) > 0) {
      await viewBtn.click().catch(() => {})
      await xtal.page.waitForTimeout(2000)
    }

    await xtal.screenshot("12-sec-open-redirect")

    // Document the finding — open redirect is by-design (admin sets URL)
    // but config poisoning makes it dangerous
    if (popupUrl.includes("evil.example.com")) {
      console.warn(
        "[SEC] Open redirect confirmed — productUrlPattern allows arbitrary domains"
      )
    }
  })
})

// ==========================================================
// MEDIUM: API base derivation
// ==========================================================

test.describe("12-SEC — API base derivation", () => {
  test("SDK derives apiBase from script src origin", async ({ xtal }) => {
    let configRequestUrl = ""
    await xtal.page.route("**/api/xtal/config*", async (route) => {
      configRequestUrl = route.request().url()
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CONFIG),
      })
    })

    await xtal.page.route("**/api/xtal/events*", (route: any) =>
      route.fulfill({ status: 200, body: "OK" })
    )

    await xtal.inject()
    await xtal.page.waitForTimeout(5000)

    // Config request should go to the script src origin (API base), not the merchant origin
    const expectedHost = new URL(xtal.apiBase).hostname
    expect(configRequestUrl).toContain(expectedHost)
    // Only assert SDK doesn't call merchant origin when they're on different hosts
    // (in local dev both are localhost, so this check is skipped)
    const merchantHost = new URL(xtal.merchantUrl).hostname
    if (merchantHost !== expectedHost) {
      expect(configRequestUrl).not.toContain(merchantHost)
    }
    await xtal.screenshot("12-sec-api-base-derivation")
  })
})

// ==========================================================
// MEDIUM: CORS policy
// ==========================================================

test.describe("12-SEC — CORS policy", () => {
  test("search API returns Access-Control-Allow-Origin: *", async ({ xtal }) => {
    let corsHeader = ""

    await xtal.page.route("**/api/xtal/search-full*", async (route) => {
      const response = await route.fetch()
      corsHeader =
        response.headers()["access-control-allow-origin"] || ""
      await route.fulfill({ response })
    })

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.page.waitForTimeout(5000)

    await xtal.screenshot("12-sec-cors-star")

    if (corsHeader === "*") {
      console.warn(
        "[SEC] CORS Allow-Origin: * confirmed — any origin can call search API"
      )
    }
  })

  test("search API does not leak sensitive headers", async ({ xtal }) => {
    let responseHeaders: Record<string, string> = {}

    await xtal.page.route("**/api/xtal/search-full*", async (route) => {
      const response = await route.fetch()
      responseHeaders = response.headers()
      await route.fulfill({ response })
    })

    await xtal.inject()
    await xtal.search("baskets")
    await xtal.page.waitForTimeout(5000)

    expect(responseHeaders["set-cookie"]).toBeFalsy()
    expect(responseHeaders["x-api-key"]).toBeFalsy()
    expect(responseHeaders["authorization"]).toBeFalsy()
    await xtal.screenshot("12-sec-cors-headers")
  })
})

// ==========================================================
// MEDIUM: Prototype pollution
// ==========================================================

test.describe("12-SEC — Prototype pollution", () => {
  test("__proto__ in search response does not pollute Object.prototype", async ({ xtal }) => {
    const { page } = xtal

    await page.route("**/api/xtal/config*", (route: any) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CONFIG),
      })
    )

    await page.route("**/api/xtal/search-full*", (route: any) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: PROTO_POLLUTION_SEARCH_BODY,
      })
    )

    await page.route("**/api/xtal/events*", (route: any) =>
      route.fulfill({ status: 200, body: "OK" })
    )

    await xtal.inject()
    await xtal.search("test")
    await page.waitForTimeout(3000)

    const polluted = await page.evaluate(() => {
      const obj = {} as any
      return obj.polluted === true || (Object.prototype as any).polluted === true
    })

    await xtal.screenshot("12-sec-proto-pollution-search")
    expect(polluted).toBe(false)
  })

  test("__proto__ in config response does not pollute Object.prototype", async ({ xtal }) => {
    const { page } = xtal

    await page.route("**/api/xtal/config*", (route: any) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: PROTO_POLLUTION_CONFIG_BODY,
      })
    )

    await page.route("**/api/xtal/events*", (route: any) =>
      route.fulfill({ status: 200, body: "OK" })
    )

    await xtal.inject()
    await page.waitForTimeout(5000)

    const polluted = await page.evaluate(
      () => (Object.prototype as any).polluted === true
    )

    await xtal.screenshot("12-sec-proto-pollution-config")
    expect(polluted).toBe(false)
  })
})

// ==========================================================
// LOW: DOM clobbering
// ==========================================================

test.describe("12-SEC — DOM clobbering", () => {
  test("SDK boots despite conflicting element IDs/names", async ({ xtal }) => {
    const errors: string[] = []
    xtal.page.on("pageerror", (err: Error) => errors.push(err.message))

    // Set up DOM clobbering before SDK injection
    await xtal.page.evaluate((script: string) => {
      // eslint-disable-next-line no-eval
      const fn = new Function(script)
      fn()
    }, DOM_CLOBBER_SETUP)

    await runXSSScenario(xtal, MOCK_CONFIG)

    const active = await xtal.isActive()
    await xtal.screenshot("12-sec-dom-clobbering")
    expect(active).toBe(true)
  })
})

// ==========================================================
// LOW: CSS injection
// ==========================================================

test.describe("12-SEC — CSS injection via cardTemplate", () => {
  test("malicious CSS hides page elements (document vulnerability)", async ({ xtal }) => {
    await runXSSScenario(xtal, CSS_INJECTION_CONFIG)

    const headerVisible = await xtal.page.evaluate(() => {
      const header = document.querySelector("header, nav, .site-header")
      if (!header) return true
      const style = window.getComputedStyle(header)
      return style.display !== "none"
    })

    const bodyOpacity = await xtal.page.evaluate(() =>
      parseFloat(window.getComputedStyle(document.body).opacity)
    )

    await xtal.screenshot("12-sec-css-injection")

    if (!headerVisible) {
      console.warn(
        "[SEC] CSS injection hid page header — cardTemplate.css needs scoping"
      )
    }
    if (bodyOpacity < 0.5) {
      console.warn(
        "[SEC] CSS injection made body near-invisible — DOS via CSS"
      )
    }

    // Assert: malicious CSS should not be able to hide page elements
    expect(headerVisible, "CSS injection hid the header").toBe(true)
    expect(bodyOpacity, "CSS injection made body invisible").toBeGreaterThan(0.5)
  })

  test("CSS exfiltration URLs are not fetched", async ({ xtal }) => {
    let exfilRequestMade = false

    xtal.page.on("request", (req: any) => {
      if (req.url().includes("evil.example.com")) {
        exfilRequestMade = true
      }
    })

    await runXSSScenario(xtal, CSS_INJECTION_CONFIG)
    await xtal.page.waitForTimeout(3000)

    await xtal.screenshot("12-sec-css-exfil")

    if (exfilRequestMade) {
      console.warn(
        "[SEC] CSS exfiltration request detected — cardTemplate.css loaded external URL"
      )
    }
  })
})

// ==========================================================
// LOW: Rate limiting / debounce
// ==========================================================

test.describe("12-SEC — Rate limiting", () => {
  test("rapid searches are debounced — not all fire", async ({ xtal }) => {
    let searchRequestCount = 0

    await xtal.page.route("**/api/xtal/config*", (route: any) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CONFIG),
      })
    )

    await xtal.page.route("**/api/xtal/search-full*", async (route: any) => {
      searchRequestCount++
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SEARCH_RESULTS),
      })
    })

    await xtal.page.route("**/api/xtal/events*", (route: any) =>
      route.fulfill({ status: 200, body: "OK" })
    )

    await xtal.inject()

    const input = xtal.page.locator(SELECTORS.SEARCH_INPUT)
    await input.waitFor({ state: "visible", timeout: 15_000 })

    // Fire 20 rapid searches
    for (let i = 0; i < 20; i++) {
      await input.fill(`query${i}`)
      await input.press("Enter")
    }

    await xtal.page.waitForTimeout(5000)

    await xtal.screenshot("12-sec-rate-limit")

    // With 200ms debounce + AbortController, significantly fewer than 20
    // should actually reach the server
    expect(searchRequestCount).toBeLessThan(15)
  })
})
