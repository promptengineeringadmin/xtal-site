export interface SearchQualityEntry {
  id: string
  timestamp: string
  query: string
  augmented_query: string | null
  collection: string
  product_id: string
  product_title: string
  product_vendor: string
  product_type: string
  product_tags: string[]
  product_price: number | number[]
  product_image_url: string | null
  relevance_score: number | null
  prompt_hash: string | null
  note: string | null
}
