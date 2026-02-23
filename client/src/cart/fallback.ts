import type { Product } from "../api"
import type { CartAdapter, CartResult } from "./adapter"
import { appendUtm } from "../utm"

export class FallbackCartAdapter implements CartAdapter {
  name = "fallback"

  private shopId: string
  private queryFn: () => string

  constructor(shopId: string, queryFn: () => string) {
    this.shopId = shopId
    this.queryFn = queryFn
  }

  async addToCart(product: Product): Promise<CartResult> {
    const url = appendUtm(product.product_url || "#", {
      shopId: this.shopId,
      productId: product.id,
      query: this.queryFn(),
    })
    window.open(url, "_blank", "noopener,noreferrer")
    return { success: true, message: "Opening product page..." }
  }
}
