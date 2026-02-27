import type { Product } from "../api"
import { appendUtm } from "../utm"

export interface CardHandlers {
  onAddToCart: (product: Product) => void | Promise<void>
  onViewProduct: (product: Product) => void
}

export interface CardTemplate {
  html: string
  css: string
}

/** Build a flat key→string map from a Product for template interpolation */
function buildTemplateData(product: Product, resolvedUrl?: string): Record<string, string> {
  const price = Array.isArray(product.price)
    ? product.price[0] ?? 0
    : product.price
  const compareAt = product.variants?.[0]?.compare_at_price

  const data: Record<string, string> = {
    id: product.id ?? "",
    title: product.title ?? "",
    vendor: product.vendor ?? "",
    product_type: product.product_type ?? "",
    price: price.toFixed(2),
    image_url:
      product.image_url ||
      product.featured_image ||
      product.images?.[0]?.src ||
      "",
    product_url: resolvedUrl || product.product_url || "",
    available: product.available ? "true" : "",
    description: product.description ?? "",
  }

  if (compareAt && compareAt > price) {
    data.compare_at_price = compareAt.toFixed(2)
  }

  // Variant fields
  const v0 = product.variants?.[0]
  if (v0) {
    if (v0.sku) data.sku = v0.sku
    if (v0.title) data.variant_title = v0.title
  }

  // Tags — expose as comma-joined string and also parse dimension/min_qty patterns
  if (product.tags?.length) {
    data.tags = product.tags.join(", ")
    for (const tag of product.tags) {
      // e.g. "dimensions:13 L x 9 W x 2 H" or "min_qty:6"
      const colonIdx = tag.indexOf(":")
      if (colonIdx > 0) {
        const key = tag.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, "_")
        const val = tag.slice(colonIdx + 1).trim()
        if (key && val && !(key in data)) {
          data[key] = val
        }
      }
    }
  }

  return data
}

/**
 * Process conditional blocks in the template:
 *   {{#field}}...content...{{/field}}  — include if field is truthy
 *   {{^field}}...content...{{/field}}  — include if field is falsy
 */
function processConditionals(
  template: string,
  data: Record<string, string>
): string {
  // Positive conditionals: {{#field}}...{{/field}}
  let result = template.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, content) => (data[key] ? content : "")
  )
  // Negative conditionals: {{^field}}...{{/field}}
  result = result.replace(
    /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, content) => (data[key] ? "" : content)
  )
  return result
}

/** Replace {{field}} tokens with values from data */
function interpolateTokens(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "")
}

/** Parse an HTML string into a DOM element */
function htmlToElement(html: string): HTMLElement {
  const wrapper = document.createElement("div")
  wrapper.innerHTML = html.trim()
  return (wrapper.firstElementChild as HTMLElement) || wrapper
}

/** Render a single product card from a template */
export function renderTemplatedCard(
  template: string,
  product: Product,
  query: string,
  shopId: string,
  handlers: CardHandlers,
  cartAdapterName?: string,
  resolvedUrl?: string
): HTMLElement {
  const data = buildTemplateData(product, resolvedUrl)

  let html = processConditionals(template, data)
  html = interpolateTokens(html, data)

  const el = htmlToElement(html)

  // Wire data-xtal-action="view-product" elements
  const productUrl = appendUtm(resolvedUrl || product.product_url || "#", {
    shopId,
    productId: product.id,
    query,
  })
  el.querySelectorAll<HTMLElement>('[data-xtal-action="view-product"]').forEach(
    (node) => {
      if (node.tagName === "A") {
        ;(node as HTMLAnchorElement).href = productUrl
        ;(node as HTMLAnchorElement).target = "_blank"
        ;(node as HTMLAnchorElement).rel = "noopener noreferrer"
      } else {
        node.style.cursor = "pointer"
        node.addEventListener("click", (e) => {
          e.preventDefault()
          handlers.onViewProduct(product)
        })
      }
    }
  )

  // Wire data-xtal-action="add-to-cart" elements
  el.querySelectorAll<HTMLElement>('[data-xtal-action="add-to-cart"]').forEach(
    (node) => {
      // Override button text for fallback adapter (opens product page, not real cart)
      if (cartAdapterName === "fallback") {
        node.textContent = "View Product"
      }

      node.addEventListener("click", async (e) => {
        e.preventDefault()
        e.stopPropagation()

        // Button loading state
        const originalText = node.textContent
        node.textContent = "Adding..."
        node.style.opacity = "0.7"
        node.style.pointerEvents = "none"

        try {
          await handlers.onAddToCart(product)
        } finally {
          node.textContent = originalText
          node.style.opacity = ""
          node.style.pointerEvents = ""
        }
      })
    }
  )

  return el
}
