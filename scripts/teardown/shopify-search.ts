/**
 * Generic Shopify search scraper.
 * Uses theme-agnostic heuristics to extract product results from any
 * Shopify store's /search?q= page.
 */

import type { Page } from "playwright-core"
import type { MerchantResult } from "./types"

export async function searchShopify(
  domain: string,
  query: string,
  page: Page,
): Promise<{ results: MerchantResult[]; count: number; responseTime: number }> {
  const url = `https://${domain}/search?q=${encodeURIComponent(query)}&type=product`

  const start = Date.now()
  await page.goto(url, { waitUntil: "load", timeout: 45_000 })
  // Wait for product cards to render
  await page.waitForTimeout(3000)
  // Progressive scroll to trigger lazy-loaded content
  await page.evaluate(() => window.scrollTo(0, 1000))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, 2500))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, 4000))
  await page.waitForTimeout(800)
  const elapsed = Date.now() - start

  const extracted = await page.evaluate((shopDomain: string) => {
    const results: Array<{
      title: string
      price: string | null
      imageUrl: string | null
      url: string | null
    }> = []

    // Strategy: find all links pointing to /products/ paths
    const productLinks = document.querySelectorAll('a[href*="/products/"]')
    const seen = new Set<string>()

    for (const link of Array.from(productLinks)) {
      const anchor = link as HTMLAnchorElement
      const href = anchor.href || anchor.getAttribute("href") || ""
      // Normalize: extract the /products/handle part
      const match = href.match(/\/products\/([a-z0-9][a-z0-9\-]*)/)
      if (!match) continue
      const handle = match[1]
      if (seen.has(handle)) continue
      seen.add(handle)

      // Find the containing card element (walk up to find a reasonable ancestor)
      let card: Element = anchor
      for (let i = 0; i < 5; i++) {
        const parent = card.parentElement
        if (!parent || parent === document.body) break
        card = parent
        // Stop if this looks like a card container
        const cls = card.className || ""
        if (
          cls.includes("product") ||
          cls.includes("card") ||
          cls.includes("grid__item") ||
          cls.includes("collection-product") ||
          card.getAttribute("data-product-card") !== null
        )
          break
      }

      // Title: try heading first, then link text
      let title: string | null = null
      const heading = card.querySelector("h2, h3, h4, [class*='title'], [class*='name']")
      if (heading) {
        title = heading.textContent?.trim() || null
      }
      if (!title) {
        // Use link text if it's substantive (not just "View" or "Shop Now")
        const linkText = anchor.textContent?.trim() || ""
        if (linkText.length > 5 && !linkText.match(/^(view|shop|buy|add|see)\b/i)) {
          title = linkText
        }
      }
      if (!title) continue

      // Image: look for img in the card, prefer cdn.shopify.com
      let imageUrl: string | null = null
      const imgs = card.querySelectorAll("img")
      for (const img of Array.from(imgs)) {
        const src = (img as HTMLImageElement).src || img.getAttribute("data-src") || ""
        if (src.includes("cdn.shopify.com") || src.includes("shopifycdn")) {
          imageUrl = src
          break
        }
        if (!imageUrl && src && !src.includes("svg") && !src.includes("icon")) {
          imageUrl = src
        }
      }

      // Price: look for $ pattern in the card
      let price: string | null = null
      const textContent = card.textContent || ""
      const priceMatch = textContent.match(/\$\s*[\d,]+\.?\d{0,2}/)
      if (priceMatch) {
        price = priceMatch[0].replace(/\s/g, "")
      }

      // Construct full URL
      const productUrl = href.startsWith("http")
        ? href
        : `https://${shopDomain}/products/${handle}`

      results.push({ title, price, imageUrl, url: productUrl })

      if (results.length >= 10) break
    }

    // Result count: look for common patterns
    let totalCount = results.length
    const body = document.body.textContent || ""
    // "X results" or "Showing X" or "(X)"
    const countPatterns = [
      /(\d[\d,]*)\s+results?\b/i,
      /showing\s+\d+[\s-]+\d+\s+of\s+(\d[\d,]*)/i,
      /\b(\d[\d,]*)\s+products?\s+found/i,
    ]
    for (const pattern of countPatterns) {
      const m = body.match(pattern)
      if (m) {
        totalCount = parseInt(m[1].replace(/,/g, ""), 10)
        break
      }
    }

    return { results, totalCount }
  }, domain)

  return {
    results: extracted.results.slice(0, 10).map(
      (r): MerchantResult => ({
        title: r.title,
        price: r.price ? parseFloat(r.price.replace(/[$,]/g, "")) : undefined,
        imageUrl: r.imageUrl || undefined,
        url: r.url || undefined,
      }),
    ),
    count: extracted.totalCount,
    responseTime: elapsed,
  }
}
