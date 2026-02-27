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

export interface SearchContext {
  augmented_query: string
  extracted_price_lte: number | null
  extracted_price_gte: number | null
  product_keyword?: string
}

export interface SearchFullResponse {
  results: Product[]
  total: number
  query_time: number
  search_context?: SearchContext
  computed_facets?: Record<string, Record<string, number>>
  aspects: string[]
  aspects_enabled: boolean
}

export interface XtalConfig {
  enabled: boolean
  searchSelector: string
  displayMode: string
  resultsSelector?: string
  siteUrl: string
  features: { aspects: boolean; explain: boolean; filters: boolean }
  cardTemplate?: {
    html: string
    css: string
  }
  productUrlPattern?: string
  observerTimeoutMs?: number
  pricePresets?: { label: string; min?: number; max?: number }[]
}

export class XtalAPI {
  private apiBase: string
  private shopId: string
  private controller: AbortController | null = null

  constructor(apiBase: string, shopId: string) {
    this.apiBase = apiBase
    this.shopId = shopId
  }

  /** Abort any in-flight search request */
  abort() {
    if (this.controller) {
      this.controller.abort()
      this.controller = null
    }
  }

  async fetchConfig(): Promise<XtalConfig> {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 5000)
    try {
      const res = await fetch(
        `${this.apiBase}/api/xtal/config?shopId=${encodeURIComponent(this.shopId)}`,
        { mode: "cors", signal: ctrl.signal }
      )
      if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`)
      return res.json()
    } finally {
      clearTimeout(timeout)
    }
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

  async searchFiltered(
    query: string,
    searchContext: SearchContext,
    opts?: {
      facetFilters?: Record<string, string[]>
      priceRange?: { min?: number; max?: number } | null
      limit?: number
    }
  ): Promise<SearchFullResponse> {
    // Cancel any in-flight request (shared controller with searchFull)
    if (this.controller) {
      this.controller.abort()
    }
    this.controller = new AbortController()

    const hasActiveFacets = opts?.facetFilters
      && Object.values(opts.facetFilters).some(v => v.length > 0)

    const priceRange = opts?.priceRange
      ? { min: opts.priceRange.min, max: opts.priceRange.max }
      : undefined

    const res = await fetch(`${this.apiBase}/api/xtal/search`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        collection: this.shopId,
        search_context: searchContext,
        limit: opts?.limit ?? 24,
        ...(hasActiveFacets ? { facet_filters: opts!.facetFilters } : {}),
        ...(priceRange ? { price_range: priceRange } : {}),
      }),
      signal: this.controller.signal,
    })

    if (!res.ok) throw new Error(`Filter search failed: ${res.status}`)
    return res.json()
  }
}
