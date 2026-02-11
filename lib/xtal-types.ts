// TypeScript interfaces mirroring backend Pydantic models
// Backend source: xtal-shopify-backend/app/models/search.py

export interface SearchContext {
  augmented_query: string
  extracted_price_lte: number | null
  extracted_price_gte: number | null
}

export interface PriceRange {
  min: number | null
  max: number | null
}

export interface SearchRequest {
  query: string
  limit?: number
  selected_aspects?: string[]
  collection?: string
  search_context?: SearchContext
  facet_filters?: Record<string, string[]>
  price_range?: PriceRange
}

export interface SearchResponse {
  results: Product[]
  total: number
  query_time: number
  relevance_scores?: Record<string, number>
  search_context?: SearchContext
  computed_facets?: Record<string, Record<string, number>>
}

export interface AspectsRequest {
  query: string
  selected_aspects?: string[]
  collection?: string
}

export interface AspectsResponse {
  aspects: string[]
}

export interface ExplainRequest {
  query: string
  product_id: string
  score?: number
  collection?: string
}

export interface ExplainResponse {
  product_id: string
  explanation: string
  source: "llm" | "cache" | "fallback"
}

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
  enhanced_description?: string
  featured_image?: string
  images: { src: string; alt_text?: string }[]
  variants: { price: number; compare_at_price?: number }[]
  available: boolean
}
