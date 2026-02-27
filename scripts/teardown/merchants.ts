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
