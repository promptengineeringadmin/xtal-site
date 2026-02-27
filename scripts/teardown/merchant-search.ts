import type { MerchantConfig, MerchantResult } from "./types"

const BESTBUY_FIELDS = [
  "sku",
  "name",
  "salePrice",
  "regularPrice",
  "image",
  "thumbnailImage",
  "customerReviewAverage",
  "customerReviewCount",
  "url",
  "shortDescription",
].join(",")

async function searchBestBuyApi(
  query: string,
  apiKey: string,
): Promise<{ results: MerchantResult[]; count: number; responseTime: number }> {
  const searchParam = `(search=${encodeURIComponent(query)})`
  const url =
    `https://api.bestbuy.com/v1/products${searchParam}?` +
    `apiKey=${apiKey}&format=json&show=${BESTBUY_FIELDS}` +
    `&pageSize=10&sort=bestSellingRank.asc`

  const start = Date.now()
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  const elapsed = Date.now() - start

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Best Buy API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  const products = data.products || []

  return {
    results: products.map(
      (p: Record<string, unknown>): MerchantResult => ({
        title: String(p.name || ""),
        price: typeof p.salePrice === "number" ? p.salePrice : undefined,
        imageUrl: p.image ? String(p.image) : p.thumbnailImage ? String(p.thumbnailImage) : undefined,
        url: p.url ? String(p.url) : undefined,
        rating:
          typeof p.customerReviewAverage === "number"
            ? p.customerReviewAverage
            : undefined,
        reviewCount:
          typeof p.customerReviewCount === "number"
            ? p.customerReviewCount
            : undefined,
      }),
    ),
    count: typeof data.total === "number" ? data.total : products.length,
    responseTime: elapsed,
  }
}

export async function searchMerchant(
  config: MerchantConfig,
  query: string,
): Promise<{ results: MerchantResult[]; count: number; responseTime: number }> {
  if (config.searchApi?.type === "bestbuy-api") {
    const apiKey = process.env[config.searchApi.apiKeyEnv]
    if (!apiKey) {
      throw new Error(`${config.searchApi.apiKeyEnv} env var not set`)
    }
    return searchBestBuyApi(query, apiKey)
  }

  // Fallback: scrape search URL (future use for Shopify/generic)
  throw new Error(
    `No search implementation for merchant type: ${config.searchApi?.type || "none"}`,
  )
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
