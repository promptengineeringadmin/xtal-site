export interface MetricsSummary {
  vendor_id: string
  total_products: number
  total_search_requests: number
  total_aspect_generations: number
  product_fetch_summary: {
    total_imports: number
    last_import_date: string | null
    total_fetch_operations: number
  }
  configuration_updates: {
    brand_prompt_updates: number
    marketing_prompt_updates: number
    total_config_updates: number
  }
  period_start: string
  period_end: string
}

export interface ProxyTiming {
  redis_ms: number
  backend_ms: number
  total_ms: number
  route: "search" | "search-full"
  aspects_failed?: boolean
}

export interface SearchEventData {
  user_query: string
  enriched_query: string
  selected_aspects: string[]
  final_query: string
  results_count: number
  query_time: number
  limit: number
  result_ids_titles: { id: string; title: string }[]
  filter_in_place: boolean
  facet_filters: Record<string, string[]> | null
  product_keyword?: string | null
  search_mode?: string | null
  /** Proxy-level timing breakdown (enriched at read time from Redis) */
  proxy_timing?: ProxyTiming
}

export interface MetricEvent {
  event_type:
    | "search_request"
    | "aspect_generation"
    | "product_fetch"
    | "brand_prompt_updated"
    | "marketing_prompt_updated"
  event_data: SearchEventData | Record<string, unknown>
  timestamp: string
  user_id?: string
}

export interface PromptData {
  vendor_id: string
  brand_prompt?: string
  marketing_prompt?: string
}

export interface PromptDefaults {
  default_brand_prompt: string
  default_marketing_prompt: string
}

export interface VendorSettings {
  vendor_id: string
  collection_name: string
  query_enhancement_enabled: boolean
  merch_rerank_strength: number
  created_at: string
  updated_at: string
}

export type EventType = MetricEvent["event_type"]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  search_request: "Search",
  aspect_generation: "Aspects",
  product_fetch: "Product Fetch",
  brand_prompt_updated: "Brand Prompt",
  marketing_prompt_updated: "Marketing Prompt",
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  search_request: "bg-blue-100 text-blue-700",
  aspect_generation: "bg-purple-100 text-purple-700",
  product_fetch: "bg-green-100 text-green-700",
  brand_prompt_updated: "bg-amber-100 text-amber-700",
  marketing_prompt_updated: "bg-rose-100 text-rose-700",
}

// --- Analytics Dashboard types ---

export interface AnalyticsSummary {
  total_searches: number
  unique_sessions: number
  total_clicks: number
  click_through_rate: number
  avg_searches_per_session: number
  searches_without_clicks: number
  avg_click_position: number
  add_to_cart_from_search: number
  search_conversion_rate: number
}

export interface DailyVolume {
  date: string
  searches: number
  clicks: number
  add_to_carts: number
}

export interface TopQuery {
  query: string
  searches: number
  clicks: number
  ctr: number
}

export interface TopProduct {
  product_id: string
  product_title: string
  clicks: number
  from_queries: number
  add_to_carts: number
}

export interface AnalyticsDashboard {
  summary: AnalyticsSummary
  daily_volume: DailyVolume[]
  top_queries: TopQuery[]
  top_products: TopProduct[]
}
