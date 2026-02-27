export type Vertical =
  | "food"
  | "home"
  | "beauty"
  | "outdoor"
  | "pet"
  | "electronics"
  | "cannabis"
  | "niche"
  | "apparel"
  | "general"

export type CollectionSource = "curated" | "shopify-import" | "csv-upload"

export interface CollectionConfig {
  id: string
  label: string
  description: string
  suggestions?: string[]
  vertical?: Vertical
  productCount?: number
  source?: CollectionSource
  sourceUrl?: string
  pinned?: boolean
}

export const COLLECTIONS: CollectionConfig[] = [
  {
    id: "xtaldemo",
    label: "Try Demo",
    description: "xtalsearch.com/try",
    vertical: "general",
    source: "curated",
    pinned: true,
  },
  {
    id: "shopify_products",
    label: "Peenak Store",
    description: "demo.xtalsearch.com",
    vertical: "general",
    source: "curated",
  },
  {
    id: "willow",
    label: "Willow Home Goods",
    description: "xtalsearch.com/willow",
    vertical: "home",
    source: "curated",
    pinned: true,
  },
  {
    id: "bestbuy",
    label: "Best Buy",
    description: "xtalsearch.com/bestbuy",
    vertical: "electronics",
    source: "curated",
    pinned: true,
  },
  {
    id: "goldcanna",
    label: "Gold Canna",
    description: "xtalsearch.com/goldcanna",
    vertical: "cannabis",
    source: "curated",
    pinned: true,
  },
  {
    id: "dennis",
    label: "Dennis Playground",
    description: "xtalsearch.com/dennis",
    vertical: "general",
    source: "curated",
  },
]

export const DEFAULT_COLLECTION = "xtaldemo"

export const COLLECTION_STORAGE_KEY = "xtal-admin-collection"
