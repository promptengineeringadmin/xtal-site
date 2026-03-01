import type { Product } from "../api"
import type { CartAdapter, CartResult } from "./adapter"
import { appendUtm } from "../utm"

export class FallbackCartAdapter implements CartAdapter {
  name = "fallback"

  private shopId: string
  private queryFn: () => string
  private resolveUrl?: (product: Product) => string

  constructor(shopId: string, queryFn: () => string, resolveUrl?: (product: Product) => string) {
    this.shopId = shopId
    this.queryFn = queryFn
    this.resolveUrl = resolveUrl
  }

  async addToCart(product: Product): Promise<CartResult> {
    const resolved = this.resolveUrl?.(product) ?? product.product_url ?? "#"
    const url = appendUtm(resolved, {
      shopId: this.shopId,
      productId: product.id,
      query: this.queryFn(),
    })
    window.open(url, "_blank", "noopener,noreferrer")
    return { success: true, message: "Opening product page..." }
  }
}
