import type { Page } from "playwright-core"
import type { MerchantConfig, MerchantResult } from "./types"
import { searchShopify } from "./shopify-search"

// ── Platform-aware CSS selector sets ─────────────────────────

interface SelectorSet {
  card: string[]
  title: string[]
  link: string[]
  image: string[]
  price: string[]
}

const BESTBUY_SELECTORS: SelectorSet = {
  card: [".product-list-item"],
  title: ["h3.product-title", ".product-title"],
  link: ["a.product-list-item-link"],
  image: ["img"],
  price: ["span"],
}

const BIGCOMMERCE_SELECTORS: SelectorSet = {
  card: [".card", ".product", "[data-product-id]", ".productGrid .product"],
  title: [".card-title", ".product-title", "h3 a", "h4 a"],
  link: [".card-title a", ".card-figure a", "h3 a", "h4 a"],
  image: [".card-image", "img"],
  price: [".price--withTax", ".price", "[data-product-price]"],
}

const WOOCOMMERCE_SELECTORS: SelectorSet = {
  card: [".product", ".woocommerce-loop-product__link", "li.product"],
  title: [".woocommerce-loop-product__title", "h2", "h3"],
  link: ["a.woocommerce-loop-product__link", "a"],
  image: ["img"],
  price: [".price .amount", ".price", "bdi"],
}

const GENERIC_SELECTORS: SelectorSet = {
  card: [
    "[data-product]", "[data-product-card]", ".product-card", ".product-item",
    ".product", ".card", "[itemtype*='Product']",
  ],
  title: ["h2", "h3", "h4", "[data-product-title]", ".product-title"],
  link: ["a[href*='/product']", "a[href*='/p/']", "a"],
  image: ["img[src*='cdn']", "img"],
  price: ["[data-price]", ".price", "span"],
}

function detectPlatformFromHtml(html: string): "bestbuy" | "bigcommerce" | "woocommerce" | "generic" {
  if (/product-list-item/i.test(html) && /bestbuy/i.test(html)) return "bestbuy"
  if (/bigcommerce|data-stencil|bc-sf-filter/i.test(html)) return "bigcommerce"
  if (/woocommerce|wp-content.*wc/i.test(html)) return "woocommerce"
  return "generic"
}

function getSelectorSet(platform: string): SelectorSet {
  switch (platform) {
    case "bestbuy": return BESTBUY_SELECTORS
    case "bigcommerce": return BIGCOMMERCE_SELECTORS
    case "woocommerce": return WOOCOMMERCE_SELECTORS
    default: return GENERIC_SELECTORS
  }
}

// ── Scroll and wait helper ───────────────────────────────────

async function scrollAndWait(page: Page): Promise<void> {
  await page.waitForTimeout(3000)
  await page.evaluate(() => window.scrollTo(0, 1000))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, 2500))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, 4000))
  await page.waitForTimeout(800)
}

// ── Generic platform-aware scraper ───────────────────────────

async function scrapeMerchantSearch(
  page: Page,
  query: string,
  searchUrl: string,
  platformHint?: string,
): Promise<{ results: MerchantResult[]; count: number; responseTime: number }> {
  const url = searchUrl + encodeURIComponent(query)

  const start = Date.now()
  await page.goto(url, { waitUntil: "load", timeout: 45_000 })
  await scrollAndWait(page)
  const elapsed = Date.now() - start

  // Auto-detect platform from rendered HTML if no hint
  const bodyHtml = await page.evaluate(() => document.body.innerHTML)
  const platform = platformHint || detectPlatformFromHtml(bodyHtml)
  const selectors = getSelectorSet(platform)

  const extracted = await page.evaluate(
    (sel) => {
      const results: Array<{
        title: string
        price: string | null
        imageUrl: string | null
        url: string | null
        rating: number | null
      }> = []

      // Try each card selector until we find matches
      let cards: Element[] = []
      for (const s of sel.card) {
        const found = document.querySelectorAll(s)
        if (found.length > 0) {
          cards = Array.from(found)
          break
        }
      }

      for (const card of cards.slice(0, 10)) {
        // Title: try each title selector
        let title: string | null = null
        for (const s of sel.title) {
          const el = card.querySelector(s)
          if (el && el.textContent?.trim()) {
            title = el.textContent.trim()
            break
          }
        }
        if (!title) continue

        // URL: try each link selector
        let productUrl: string | null = null
        for (const s of sel.link) {
          const el = card.querySelector(s) as HTMLAnchorElement | null
          if (el?.href) {
            productUrl = el.href
            break
          }
        }

        // Image: try each image selector
        let imageUrl: string | null = null
        for (const s of sel.image) {
          const el = card.querySelector(s) as HTMLImageElement | null
          if (el?.src) {
            imageUrl = el.src
            break
          }
        }

        // Price: find first $XX.XX pattern
        let price: string | null = null
        for (const s of sel.price) {
          const els = card.querySelectorAll(s)
          for (const el of Array.from(els)) {
            const t = (el.textContent || "").trim()
            if (t.startsWith("$") && t.length < 15 && !t.includes("/mo")) {
              price = t
              break
            }
          }
          if (price) break
        }

        // Rating: generic pattern
        let rating: number | null = null
        const text = card.textContent || ""
        const ratingMatch = text.match(/(\d+\.?\d*)\s*(?:out of\s*5|\/\s*5|stars?)/)
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1])
        }

        results.push({ title, price, imageUrl, url: productUrl, rating })
      }

      // Result count from page text
      let totalCount = results.length
      const body = document.body.textContent || ""
      // Try common patterns: "(530)", "530 results", "Showing 1-20 of 530"
      const countPatterns = [
        /(\d[\d,]*)\s*results?\b/i,
        /showing\s+\d+[-–]\d+\s+of\s+(\d[\d,]*)/i,
        /\((\d[\d,]*)\)/,
      ]
      for (const pat of countPatterns) {
        const m = body.match(pat)
        if (m) {
          totalCount = parseInt(m[1].replace(/,/g, ""), 10)
          break
        }
      }

      return { results, totalCount }
    },
    selectors,
  )

  return {
    results: extracted.results.slice(0, 10).map(
      (r): MerchantResult => ({
        title: r.title,
        price: r.price ? parseFloat(r.price.replace(/[$,]/g, "")) : undefined,
        imageUrl: r.imageUrl || undefined,
        url: r.url || undefined,
        rating: r.rating || undefined,
      }),
    ),
    count: extracted.totalCount,
    responseTime: elapsed,
  }
}

export async function searchMerchant(
  config: MerchantConfig,
  query: string,
  page: Page,
): Promise<{ results: MerchantResult[]; count: number; responseTime: number }> {
  // Route Shopify stores to the generic Shopify scraper
  if (config.searchApi?.type === "shopify" && config.shopifyDomain) {
    return searchShopify(config.shopifyDomain, query, page)
  }

  if (!config.searchUrl) {
    throw new Error(`No searchUrl configured for merchant: ${config.id}`)
  }

  // Use platform hint from searchApi type if available
  const platformHint = config.searchApi?.type === "bestbuy-api" ? "bestbuy" : undefined
  return scrapeMerchantSearch(page, query, config.searchUrl, platformHint)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
