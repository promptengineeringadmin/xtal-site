export interface CollectionConfig {
  id: string
  label: string
  description: string
}

export const COLLECTIONS: CollectionConfig[] = [
  {
    id: "xtaldemo",
    label: "Try Demo",
    description: "xtalsearch.com/try",
  },
  {
    id: "shopify_products",
    label: "Peenak Store",
    description: "demo.xtalsearch.com",
  },
  {
    id: "willow",
    label: "Willow Home Goods",
    description: "xtalsearch.com/willow",
  },
]

export const DEFAULT_COLLECTION = "xtaldemo"

export const COLLECTION_STORAGE_KEY = "xtal-admin-collection"
