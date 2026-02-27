import type { Page } from "playwright-core"
import type { MerchantConfig, MerchantResult } from "./types"

/**
 * Scrape a merchant's actual website search results page.
 * Uses Playwright to render the page exactly as a shopper would see it.
 */
async function scrapeMerchantSearch(
  page: Page,
  query: string,
  searchUrl: string,
): Promise<{ results: MerchantResult[]; count: number; responseTime: number }> {
  const url = searchUrl + encodeURIComponent(query)

  const start = Date.now()
  await page.goto(url, { waitUntil: "load", timeout: 45_000 })
  // Wait for product cards to render
  await page.waitForTimeout(3000)
  // Scroll progressively to trigger lazy-loaded cards
  await page.evaluate(() => window.scrollTo(0, 1000))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, 2500))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, 4000))
  await page.waitForTimeout(800)
  const elapsed = Date.now() - start

  const extracted = await page.evaluate(() => {
    const results: Array<{
      title: string
      price: string | null
      imageUrl: string | null
      url: string | null
      rating: number | null
    }> = []

    // Best Buy uses .product-list-item for product cards
    const cards = document.querySelectorAll(".product-list-item")

    for (const card of Array.from(cards).slice(0, 10)) {
      // Title: h3.product-title
      const titleEl = card.querySelector("h3.product-title, .product-title")
      const title = titleEl ? titleEl.textContent!.trim() : null
      if (!title) continue

      // URL from product link
      const linkEl = card.querySelector("a.product-list-item-link") as HTMLAnchorElement | null
      const productUrl = linkEl ? linkEl.href : null

      // Image
      const imgEl = card.querySelector("img") as HTMLImageElement | null
      const imageUrl = imgEl ? imgEl.src : null

      // Price: first span starting with $
      let price: string | null = null
      const spans = card.querySelectorAll("span")
      for (const s of Array.from(spans)) {
        const t = s.textContent!.trim()
        if (t.startsWith("$") && t.length < 15 && !t.includes("/mo")) {
          price = t
          break
        }
      }

      // Rating: extract from "Rating X.X out of 5"
      let rating: number | null = null
      const links = card.querySelectorAll("a")
      for (const a of Array.from(links)) {
        const t = a.textContent || ""
        const m = t.match(/Rating (\d+\.?\d*) out of/)
        if (m) {
          rating = parseFloat(m[1])
          break
        }
      }

      results.push({ title, price, imageUrl, url: productUrl, rating })
    }

    // Result count from page text like "(530)"
    let totalCount = results.length
    const body = document.body.textContent || ""
    const countMatch = body.match(/\((\d[\d,]*)\)/)
    if (countMatch) {
      totalCount = parseInt(countMatch[1].replace(/,/g, ""), 10)
    }

    return { results, totalCount }
  })

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
  if (!config.searchUrl) {
    throw new Error(`No searchUrl configured for merchant: ${config.id}`)
  }
  return scrapeMerchantSearch(page, query, config.searchUrl)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
