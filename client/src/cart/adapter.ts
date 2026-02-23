import type { Product } from "../api"

export interface CartResult {
  success: boolean
  message: string
}

export interface CartAdapter {
  /** Human-readable name for logging */
  name: string
  /** Try to add item to the store's cart. Must not throw. */
  addToCart(product: Product, quantity?: number): Promise<CartResult>
}
