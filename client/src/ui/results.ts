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
  handlers?: CardHandlers,
  resolvedUrl?: string
): HTMLElement {
  if (template && handlers) {
    return renderTemplatedCard(template.html, product, query, shopId, handlers)
  }

  const imageUrl =
    product.image_url || product.featured_image || (product.images && product.images[0]?.src)

  const link = document.createElement("a")
  link.className = "xtal-card"
  link.href = appendUtm(resolvedUrl || product.product_url || "#", {
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

export function renderLoading(query?: string): HTMLElement {
  const wrap = document.createElement("div")
  wrap.className = "xtal-loading"
  wrap.style.cssText =
    "display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;"

  // Spinner ring with sparkle icon
  const ring = document.createElement("div")
  ring.style.cssText = "position:relative;width:48px;height:48px;margin-bottom:12px;"
  const track = document.createElement("div")
  track.style.cssText = "position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;"
  const spinner = document.createElement("div")
  spinner.className = "xtal-spinner"
  spinner.style.cssText =
    "position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;"
  const sparkle = document.createElement("div")
  sparkle.style.cssText =
    "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"
  sparkle.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>'
  ring.appendChild(track)
  ring.appendChild(spinner)
  ring.appendChild(sparkle)
  wrap.appendChild(ring)

  // Query echo
  if (query) {
    const displayQuery = query.length > 80 ? query.slice(0, 77) + "…" : query
    const queryEl = document.createElement("p")
    queryEl.style.cssText =
      "margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;"
    queryEl.textContent = `\u201C${displayQuery}\u201D`
    wrap.appendChild(queryEl)
  }

  // Static phrase (no cycling — this element gets replaced quickly)
  const phraseEl = document.createElement("p")
  phraseEl.style.cssText = "margin:0;font-size:13px;color:#999;text-align:center;"
  phraseEl.textContent = "Finding best matches\u2026"
  wrap.appendChild(phraseEl)

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
