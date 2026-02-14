// TypeScript interfaces mirroring backend Pydantic models
// Backend source: xtal-shopify-backend/app/models/search.py

export interface SearchContext {
  augmented_query: string
  extracted_price_lte: number | null
  extracted_price_gte: number | null
  product_keyword?: string | null
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
  geo_country?: string
  geo_region?: string
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

// Weight optimization types (backend: app/models/optimization.py)

export interface SearchConfig {
  query_enhancement_enabled: boolean
  merch_rerank_strength: number
  bm25_weight: number
  keyword_rerank_strength: number
  hypothesis: string
}

export interface SampleComparison {
  query: string
  current_top_5: string[]
  recommended_top_5: string[]
}

export interface OptimizationResult {
  current_config: SearchConfig
  recommended_config: SearchConfig
  sample_comparisons: SampleComparison[]
  reasoning: string
  queries_tested: number
  configs_tested: number
  optimization_time: number
}

export interface OptimizationRequest {
  optimization_target?: "accuracy" | "ctr" | "aov" | "rpv"
  num_queries?: number
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
