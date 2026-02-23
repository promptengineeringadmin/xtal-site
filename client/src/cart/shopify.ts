import type { Product } from "../api"
import type { CartAdapter, CartResult } from "./adapter"

/** Extract numeric variant ID from Shopify GID format if needed */
function resolveVariantId(raw: string | number): string | number {
  if (typeof raw === "string" && raw.includes("/")) {
    return raw.split("/").pop()!
  }
  return raw
}

export class ShopifyCartAdapter implements CartAdapter {
  name = "shopify"

  async addToCart(product: Product, quantity = 1): Promise<CartResult> {
    const rawId = product.variants?.[0]?.id
    if (!rawId) {
      return { success: false, message: "No variant available" }
    }

    if (!product.available) {
      return { success: false, message: "Product unavailable" }
    }

    const variantId = resolveVariantId(rawId)

    try {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variantId, quantity }),
      })

      if (res.ok) {
        return { success: true, message: "Added to cart" }
      }

      if (res.status === 422) {
        const err = await res.json().catch(() => ({}))
        return {
          success: false,
          message: err.description || "Could not add to cart",
        }
      }

      return { success: false, message: `Cart error (${res.status})` }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Network error",
      }
    }
  }
}
