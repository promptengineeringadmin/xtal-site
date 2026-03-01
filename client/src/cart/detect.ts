import type { Product } from "../api"
import type { CartAdapter } from "./adapter"
import { ShopifyCartAdapter } from "./shopify"
import { FallbackCartAdapter } from "./fallback"

export function detectCartAdapter(
  shopId: string,
  queryFn: () => string,
  resolveUrl?: (product: Product) => string
): CartAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Shopify) {
    return new ShopifyCartAdapter()
  }

  // Future: WooCommerce, BigCommerce, etc.

  return new FallbackCartAdapter(shopId, queryFn, resolveUrl)
}
