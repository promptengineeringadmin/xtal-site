import type { ShowcaseRow } from "../showcase-cache"

/**
 * Render the SKU-not-found showcase screen.
 * Shows a header + 3 category cards (hero image + 3 thumbnails each).
 * Clicking a card fires a new search via onSearch callback.
 */
function ensureShowcaseCSS() {
  if (!document.getElementById("xtal-showcase-styles")) {
    const style = document.createElement("style")
    style.id = "xtal-showcase-styles"
    style.textContent = showcaseCSS
    document.head.appendChild(style)
  }
}

export function renderShowcase(
  skuQuery: string,
  rows: ShowcaseRow[],
  onSearch: (query: string) => void,
): HTMLElement {
  ensureShowcaseCSS()
  const wrap = document.createElement("div")
  wrap.className = "xtal-showcase"

  // Header
  const header = document.createElement("div")
  header.className = "xtal-showcase-header"
  header.innerHTML = `SKU <strong>"${escapeHtml(skuQuery)}"</strong> not found`
  wrap.appendChild(header)

  // Cards grid
  const grid = document.createElement("div")
  grid.className = "xtal-showcase-grid"

  for (const row of rows) {
    const card = createCard(row, onSearch)
    grid.appendChild(card)
  }

  wrap.appendChild(grid)
  return wrap
}

function createCard(row: ShowcaseRow, onSearch: (query: string) => void): HTMLElement {
  const card = document.createElement("div")
  card.className = "xtal-showcase-card"
  card.addEventListener("click", () => onSearch(row.query))

  // Label + arrow
  const labelRow = document.createElement("div")
  labelRow.className = "xtal-showcase-label"
  labelRow.innerHTML = `<span>${escapeHtml(row.label)}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`
  card.appendChild(labelRow)

  // Query text
  const queryEl = document.createElement("p")
  queryEl.className = "xtal-showcase-query"
  queryEl.textContent = `\u201C${row.query}\u201D`
  card.appendChild(queryEl)

  // Hero image (first product)
  const [hero, ...thumbs] = row.products
  if (hero) {
    const heroWrap = document.createElement("div")
    heroWrap.className = "xtal-showcase-hero"
    const img = document.createElement("img")
    img.src = getImageUrl(hero)
    img.alt = hero.title
    img.loading = "lazy"
    heroWrap.appendChild(img)
    card.appendChild(heroWrap)
  }

  // Thumbnail row (remaining 3)
  if (thumbs.length > 0) {
    const thumbRow = document.createElement("div")
    thumbRow.className = "xtal-showcase-thumbs"
    for (const p of thumbs) {
      const thumb = document.createElement("div")
      thumb.className = "xtal-showcase-thumb"
      const img = document.createElement("img")
      img.src = getImageUrl(p)
      img.alt = p.title
      img.loading = "lazy"
      thumb.appendChild(img)
      thumbRow.appendChild(thumb)
    }
    card.appendChild(thumbRow)
  }

  return card
}

/** Render loading skeleton while showcase data loads */
export function renderShowcaseLoading(skuQuery: string): HTMLElement {
  ensureShowcaseCSS()
  const wrap = document.createElement("div")
  wrap.className = "xtal-showcase"

  const header = document.createElement("div")
  header.className = "xtal-showcase-header"
  header.innerHTML = `SKU <strong>"${escapeHtml(skuQuery)}"</strong> not found`
  wrap.appendChild(header)

  const grid = document.createElement("div")
  grid.className = "xtal-showcase-grid"

  for (let i = 0; i < 3; i++) {
    const card = document.createElement("div")
    card.className = "xtal-showcase-card xtal-showcase-skeleton"
    card.innerHTML = `
      <div class="xtal-showcase-label"><span>&nbsp;</span></div>
      <p class="xtal-showcase-query">&nbsp;</p>
      <div class="xtal-showcase-hero xtal-shimmer"></div>
      <div class="xtal-showcase-thumbs">
        <div class="xtal-showcase-thumb xtal-shimmer"></div>
        <div class="xtal-showcase-thumb xtal-shimmer"></div>
        <div class="xtal-showcase-thumb xtal-shimmer"></div>
      </div>
    `
    grid.appendChild(card)
  }

  wrap.appendChild(grid)
  return wrap
}

function getImageUrl(product: { image_url?: string | null; featured_image?: string; images?: { src: string }[] }): string {
  return product.image_url || product.featured_image || product.images?.[0]?.src || ""
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** CSS for the showcase screen — injected alongside existing SDK styles */
export const showcaseCSS = `
  .xtal-showcase {
    padding: 32px 20px 24px;
    font-family: var(--xtal-font, inherit);
  }
  .xtal-showcase-header {
    text-align: center;
    font-size: 14px;
    color: var(--xtal-text-muted, #64748b);
    margin-bottom: 24px;
  }
  .xtal-showcase-header strong {
    color: var(--xtal-text, #1a1a1a);
    font-weight: 600;
  }
  .xtal-showcase-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .xtal-showcase-card {
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--xtal-border, #e2e8f0);
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .xtal-showcase-card:hover {
    border-color: var(--xtal-accent, #4f46e5);
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .xtal-showcase-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--xtal-text-muted, #64748b);
    margin-bottom: 4px;
  }
  .xtal-showcase-query {
    font-size: 14px;
    font-weight: 600;
    color: var(--xtal-text, #1a1a1a);
    line-height: 1.4;
    margin: 0 0 12px;
  }
  .xtal-showcase-hero {
    aspect-ratio: 4/3;
    border-radius: 6px;
    overflow: hidden;
    background: #f8fafc;
  }
  .xtal-showcase-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .xtal-showcase-thumbs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 8px;
  }
  .xtal-showcase-thumb {
    aspect-ratio: 1;
    border-radius: 4px;
    overflow: hidden;
    background: #f8fafc;
  }
  .xtal-showcase-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .xtal-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: xtal-shimmer 1.5s ease-in-out infinite;
  }
  @keyframes xtal-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .xtal-showcase-skeleton .xtal-showcase-label span,
  .xtal-showcase-skeleton .xtal-showcase-query {
    background: #f0f0f0;
    border-radius: 4px;
    color: transparent;
  }
  @media (max-width: 768px) {
    .xtal-showcase-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
`
