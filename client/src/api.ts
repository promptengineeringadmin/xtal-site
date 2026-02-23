// Types mirroring lib/xtal-types.ts — kept minimal for the client bundle
export interface Product {
  id: string
  title: string
  name: string
  price: number | number[]
  image_url: string | null
  product_url: string
  vendor: string
  product_type: string
  tags: string[]
  description?: string
  featured_image?: string
  images: { src: string; alt_text?: string }[]
  variants: {
    price: number
    compare_at_price?: number
    id?: string | number
    title?: string
    sku?: string
    inventory_quantity?: number
    inventory_policy?: "deny" | "continue"
  }[]
  available: boolean
}

export interface SearchFullResponse {
  results: Product[]
  total: number
  query_time: number
  search_context?: {
    augmented_query: string
    extracted_price_lte: number | null
    extracted_price_gte: number | null
  }
  aspects: string[]
  aspects_enabled: boolean
}

export interface XtalConfig {
  enabled: boolean
  searchSelector: string
  displayMode: string
  siteUrl: string
  features: { aspects: boolean; explain: boolean }
  cardTemplate?: {
    html: string
    css: string
  }
  productUrlPattern?: string
}

export class XtalAPI {
  private apiBase: string
  private shopId: string
  private controller: AbortController | null = null

  constructor(apiBase: string, shopId: string) {
    this.apiBase = apiBase
    this.shopId = shopId
  }

  async fetchConfig(): Promise<XtalConfig> {
    const res = await fetch(
      `${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,
      { mode: "cors" }
    )
    if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`)
    return res.json()
  }

  async searchFull(
    query: string,
    limit = 16,
    selectedAspects?: string[]
  ): Promise<SearchFullResponse> {
    // Cancel any in-flight request
    if (this.controller) {
      this.controller.abort()
    }
    this.controller = new AbortController()

    const res = await fetch(`${this.apiBase}/api/xtal/search-full`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        collection: this.shopId,
        limit,
        selected_aspects: selectedAspects,
      }),
      signal: this.controller.signal,
    })

    if (!res.ok) throw new Error(`Search failed: ${res.status}`)
    return res.json()
  }
}
