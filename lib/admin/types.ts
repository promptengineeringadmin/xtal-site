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
