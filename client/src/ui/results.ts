import type { Product } from "../api"
import { appendUtm } from "../utm"
import { renderTemplatedCard, type CardHandlers, type CardTemplate } from "./template"

// Same logic as components/try/ProductCard.tsx:17-27 — prices are dollars
function formatPrice(price: number | number[]): string {
  if (Array.isArray(price)) {
    const sorted = [...price].sort((a, b) => a - b)
    if (sorted.length === 0) return "N/A"
    if (sorted.length === 1 || sorted[0] === sorted[sorted.length - 1]) {
      return `$${sorted[0].toFixed(2)}`
    }
    return `$${sorted[0].toFixed(2)} \u2013 $${sorted[sorted.length - 1].toFixed(2)}`
  }
  return `$${price.toFixed(2)}`
}

export function renderProductCard(
  product: Product,
  query: string,
  shopId: string,
  template?: CardTemplate | null,
  handlers?: CardHandlers
): HTMLElement {
  if (template && handlers) {
    return renderTemplatedCard(template.html, product, query, shopId, handlers)
  }

  const imageUrl =
    product.image_url || product.featured_image || (product.images && product.images[0]?.src)

  const link = document.createElement("a")
  link.className = "xtal-card"
  link.href = appendUtm(product.product_url || "#", {
    shopId,
    productId: product.id,
    query,
  })
  link.target = "_blank"
  link.rel = "noopener noreferrer"

  // Image
  const imageWrap = document.createElement("div")
  imageWrap.className = "xtal-card-image"
  if (imageUrl) {
    const img = document.createElement("img")
    img.src = imageUrl
    img.alt = product.title
    img.loading = "lazy"
    imageWrap.appendChild(img)
  } else {
    const placeholder = document.createElement("span")
    placeholder.className = "xtal-card-image-placeholder"
    placeholder.textContent = "No image"
    imageWrap.appendChild(placeholder)
  }
  link.appendChild(imageWrap)

  // Body
  const body = document.createElement("div")
  body.className = "xtal-card-body"

  if (product.vendor) {
    const vendor = document.createElement("div")
    vendor.className = "xtal-card-vendor"
    vendor.textContent = product.vendor
    body.appendChild(vendor)
  }

  const title = document.createElement("div")
  title.className = "xtal-card-title"
  title.textContent = product.title
  body.appendChild(title)

  const price = document.createElement("div")
  price.className = "xtal-card-price"
  price.textContent = formatPrice(product.price)
  body.appendChild(price)

  link.appendChild(body)
  return link
}

export function renderResultsGrid(
  products: Product[],
  query: string,
  shopId: string,
  template?: CardTemplate | null,
  handlers?: CardHandlers
): HTMLElement {
  const grid = document.createElement("div")
  grid.className = "xtal-grid"

  for (const product of products) {
    grid.appendChild(renderProductCard(product, query, shopId, template, handlers))
  }

  return grid
}

export function renderLoading(): HTMLElement {
  const wrap = document.createElement("div")
  wrap.className = "xtal-loading"

  const spinner = document.createElement("div")
  spinner.className = "xtal-spinner"
  wrap.appendChild(spinner)

  const text = document.createElement("span")
  text.textContent = "Searching..."
  wrap.appendChild(text)

  return wrap
}

export function renderEmpty(query: string): HTMLElement {
  const wrap = document.createElement("div")
  wrap.className = "xtal-empty"
  const msg = document.createElement("p")
  msg.textContent = `No results found for "${query}"`
  wrap.appendChild(msg)
  return wrap
}
