import type { MerchantConfig } from "./types"

export const MERCHANTS: Record<string, MerchantConfig> = {
  bestbuy: {
    id: "bestbuy",
    name: "Best Buy",
    url: "https://www.bestbuy.com",
    searchUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=",
    searchApi: {
      type: "bestbuy-api",
      baseUrl: "https://api.bestbuy.com/v1/products",
      apiKeyEnv: "BESTBUY_API_KEY",
      searchParam: "(search={query})",
    },
    primaryColor: "#0046BE",
    secondaryColor: "#FFE000",
  },
}

/**
 * Build a MerchantConfig for any Shopify store.
 * Uses the generic /search?q= endpoint (scraped with Playwright).
 */
export function buildShopifyMerchantConfig(opts: {
  slug: string
  name: string
  domain: string
  primaryColor?: string
}): MerchantConfig {
  return {
    id: opts.slug,
    name: opts.name,
    url: `https://${opts.domain}`,
    searchUrl: `https://${opts.domain}/search?q=`,
    shopifyDomain: opts.domain,
    searchApi: {
      type: "shopify",
      baseUrl: `https://${opts.domain}`,
      apiKeyEnv: "",
      searchParam: "",
    },
    primaryColor: opts.primaryColor || "#1a1a1a",
    secondaryColor: "#ffffff",
  }
}

/**
 * Register a merchant config at runtime (e.g. from prospect probe results).
 */
export function registerMerchant(config: MerchantConfig): void {
  MERCHANTS[config.id] = config
}
