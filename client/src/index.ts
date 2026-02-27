import { XtalAPI, type Product, type SearchContext } from "./api"
import { InlineRenderer } from "./ui/inline"
import { FilterRail } from "./ui/filter-rail"
import { renderTemplatedCard, type CardHandlers, type CardTemplate } from "./ui/template"
import { renderProductCard } from "./ui/results"
import { attachInterceptor } from "./interceptor"
import { appendUtm } from "./utm"
import { detectCartAdapter } from "./cart/detect"

/** Fire-and-forget error telemetry — sendBeacon with fetch fallback */
function beaconError(apiBase: string, shopId: string, error: string, context?: string) {
  try {
    const url = `${apiBase}/api/xtal/events`
    const payload = JSON.stringify({
      action: "error",
      collection: shopId,
      error,
      context,
      ts: Date.now(),
    })
    const sent = navigator.sendBeacon?.(url, payload)
    if (!sent) {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Telemetry must never crash
  }
}

/** Inject filter rail CSS (all xtal- prefixed to avoid merchant conflicts) */
function injectFilterCSS() {
  if (document.getElementById("xtal-filter-styles")) return
  const style = document.createElement("style")
  style.id = "xtal-filter-styles"
  style.textContent = `
/* ── Layout ── */
.xtal-layout { display: flex; gap: 40px; }
.xtal-rail-slot { flex-shrink: 0; }
.xtal-grid-slot { flex: 1; min-width: 0; }

/* ── Desktop filter rail ── */
.xtal-filter-rail {
  width: 260px;
  font-family: "Manrope", serif;
  font-size: 14px;
  color: #1d1d1b;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding-right: 8px;
}
.xtal-filter-rail::-webkit-scrollbar { width: 4px; }
.xtal-filter-rail::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
.xtal-filter-rail::-webkit-scrollbar-track { background: transparent; }

/* ── Responsive grid ── */
.xtal-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 20px !important;
  padding: 20px 0 40px 0 !important;
  flex-wrap: initial !important;
}
.xtal-grid .product-card { width: auto !important; }
@media (min-width: 640px) {
  .xtal-grid { grid-template-columns: repeat(3, 1fr) !important; }
}
@media (min-width: 1024px) {
  .xtal-grid { grid-template-columns: repeat(4, 1fr) !important; }
}

/* ── Filter sections ── */
.xtal-filter-section { border-bottom: 1px solid #e5e5e5; padding-bottom: 12px; margin-bottom: 12px; }
.xtal-filter-section:last-child { border-bottom: none; }
.xtal-section-header {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 6px 0; background: none; border: none;
  cursor: pointer; font-size: 14px; font-weight: 600; color: #1d1d1b;
  font-family: inherit;
}
.xtal-section-header:hover { color: #000; }
.xtal-section-label { display: flex; align-items: center; gap: 8px; }
.xtal-section-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 9999px;
  background: #1d1d1b; color: #fff; font-weight: 600;
}
.xtal-section-chevron { font-size: 12px; color: #999; }
.xtal-section-content { margin-top: 6px; }

/* ── Facet checkboxes ── */
.xtal-facet-list { display: flex; flex-direction: column; gap: 4px; }
.xtal-facet-label {
  display: flex; align-items: center; gap: 8px; padding: 2px 0;
  cursor: pointer; font-size: 13px; color: #444 !important;
}
.xtal-facet-label:hover { color: #1d1d1b !important; }
.xtal-facet-disabled { opacity: 0.4; pointer-events: none; }
.xtal-facet-checkbox {
  width: 14px; height: 14px; border-radius: 3px;
  accent-color: #1d1d1b; cursor: pointer; flex-shrink: 0;
}
.xtal-facet-text { flex: 1; color: inherit !important; }
.xtal-facet-count { font-size: 11px; color: #999 !important; }
.xtal-show-more {
  background: none; border: none; cursor: pointer;
  font-size: 12px; color: #1d1d1b; padding: 4px 0;
  font-family: inherit; text-decoration: underline;
}
.xtal-show-more:hover { color: #000; }

/* ── Price presets ── */
.xtal-price-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.xtal-price-btn {
  padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px;
  background: #fff; cursor: pointer; font-size: 12px; color: #444;
  font-family: inherit; transition: all 0.15s;
}
.xtal-price-btn:hover { border-color: #1d1d1b; color: #1d1d1b; }
.xtal-price-btn-active {
  background: #1d1d1b; color: #fff; border-color: #1d1d1b;
}

/* ── Applied filters ── */
.xtal-applied-section { margin-bottom: 16px; }
.xtal-clear-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.xtal-clear-all {
  background: none; border: none; cursor: pointer;
  font-size: 12px; color: #999; font-family: inherit;
}
.xtal-clear-all:hover { color: #1d1d1b; }
.xtal-applied-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.xtal-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 9999px;
  background: #f0eeea; border: none; cursor: pointer;
  font-size: 12px; color: #1d1d1b; font-family: inherit;
}
.xtal-chip:hover { background: #e0ddd8; }
.xtal-chip-x { font-size: 14px; line-height: 1; opacity: 0.6; }

/* ── Mobile: hide rail, show FAB + drawer ── */
.xtal-filter-fab {
  display: none; position: fixed;
  bottom: max(24px, env(safe-area-inset-bottom, 0px) + 16px);
  left: 50%; transform: translateX(-50%); z-index: 2147483647;
  align-items: center; justify-content: center; gap: 8px;
  padding: 14px 24px; border-radius: 9999px;
  background: #1d1d1b; color: #fff;
  border: 1px solid rgba(255,255,255,0.15); cursor: pointer;
  font-family: "Manrope", system-ui, -apple-system, sans-serif;
  font-size: 15px; font-weight: 600;
  line-height: 1; letter-spacing: 0.3px; text-transform: none;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 12px 28px rgba(0,0,0,0.3);
}
.xtal-filter-fab:active { transform: translateX(-50%) scale(0.96); transition: transform 0.1s ease; }
.xtal-fab-text { margin: 0; padding: 0; display: block; }
.xtal-fab-badge {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: #fff; color: #1d1d1b; font-size: 12px; font-weight: 700;
  line-height: 1; margin-left: 2px;
}
.xtal-fab-hidden { display: none !important; }
@keyframes xtalFabSlideUp {
  0% { opacity: 0; transform: translate(-50%, 150%); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

.xtal-backdrop {
  display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 9998; opacity: 0; pointer-events: none; transition: opacity 0.2s;
}
.xtal-backdrop-open { opacity: 1; pointer-events: auto; }

.xtal-filter-drawer {
  display: none; position: fixed; top: 0; left: 0; height: 100%;
  width: 85vw; max-width: 360px; background: #fff; z-index: 9999;
  box-shadow: 4px 0 20px rgba(0,0,0,0.15);
  flex-direction: column;
  transform: translateX(-100%); transition: transform 0.25s ease;
}
.xtal-drawer-open { transform: translateX(0); }

.xtal-drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; border-bottom: 1px solid #e5e5e5;
}
.xtal-drawer-title {
  font-family: "Manrope", serif; font-size: 14px; font-weight: 700; color: #1d1d1b;
}
.xtal-drawer-close {
  background: none; border: none; cursor: pointer; padding: 8px;
  color: #999; display: flex; align-items: center;
}
.xtal-drawer-close:hover { color: #1d1d1b; }
.xtal-drawer-content {
  flex: 1; overflow-y: auto; padding: 16px;
  font-family: "Manrope", serif; font-size: 14px; color: #1d1d1b;
}
.xtal-drawer-footer {
  padding: 16px; border-top: 1px solid #e5e5e5;
}
.xtal-drawer-apply {
  width: 100%; padding: 12px; background: #1d1d1b; color: #fff;
  border: none; border-radius: 8px; cursor: pointer;
  font-family: "Manrope", serif; font-size: 14px; font-weight: 600;
}
.xtal-drawer-apply:hover { background: #333; }

@media (max-width: 767px) {
  .xtal-filter-rail { display: none; }
  .xtal-layout { display: block !important; }
  .xtal-filter-fab {
    display: flex !important;
    animation: xtalFabSlideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
  }
  .xtal-backdrop { display: block; }
  .xtal-filter-drawer { display: flex; }
}
`
  document.head.appendChild(style)
}

function boot() {
  try {
    // Find our script tag
    const scriptTag = document.querySelector<HTMLScriptElement>(
      "script[data-shop-id]"
    )
    if (!scriptTag) {
      console.warn("[xtal.js] No <script data-shop-id> tag found")
      return
    }

    const shopId = scriptTag.getAttribute("data-shop-id") ?? ""
    if (!shopId) {
      console.warn("[xtal.js] data-shop-id is empty")
      return
    }

    // Derive apiBase from script src
    let apiBase = ""
    const src = scriptTag.getAttribute("src")
    if (src) {
      try {
        const url = new URL(src, window.location.href)
        apiBase = url.origin
      } catch {
        apiBase = window.location.origin
      }
    } else {
      apiBase = window.location.origin
    }

    const api = new XtalAPI(apiBase, shopId)

    // Fetch config
    api
      .fetchConfig()
      .then((config) => {
        if (!config.enabled) {
          console.log(`[xtal.js] Snippet disabled for ${shopId}`)
          return
        }

        // Template system
        const cardTemplate: CardTemplate | null = config.cardTemplate ?? null

        // Inject card template CSS into <head>
        if (cardTemplate?.css) {
          const existing = document.getElementById("xtal-card-styles")
          if (existing) existing.remove()
          const style = document.createElement("style")
          style.id = "xtal-card-styles"
          style.textContent = cardTemplate.css
          document.head.appendChild(style)
        }

        // Cart adapter — detects platform once at boot
        let lastQuery = ""
        const cartAdapter = detectCartAdapter(shopId, () => lastQuery)
        console.log(`[xtal.js] Cart adapter: ${cartAdapter.name}`)

        /** Resolve product URL — use pattern if configured, else siteUrl prefix */
        function resolveProductUrl(product: Product): string {
          if (config.productUrlPattern) {
            const sku = product.variants?.[0]?.sku || ""
            if (sku) {
              return config.productUrlPattern
                .replace("{sku}", encodeURIComponent(sku))
                .replace("{id}", product.id || "")
            }
          }
          const rawUrl = product.product_url || "#"
          if (!rawUrl || rawUrl === "#") return "#"
          if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl
          if (config.siteUrl) return config.siteUrl.replace(/\/$/, "") + rawUrl
          return rawUrl
        }

        // Determine mode: inline vs overlay
        const isInline =
          config.displayMode === "inline" && !!config.resultsSelector
        const gridTarget = isInline
          ? document.querySelector<HTMLElement>(config.resultsSelector!)
          : null

        if (isInline && !gridTarget) {
          console.log(`[xtal.js] Inline mode: "${config.resultsSelector}" not found — standing by`)
          return
        }

        // ─── INLINE MODE ────────────────────────────────────
        {
          const inline = new InlineRenderer(gridTarget!)
          let cleanupInterceptor: (() => void) | null = null

          // ── Filter state ──
          const filtersEnabled = config.features?.filters === true
          let searchContext: SearchContext | null = null
          let facetFilters: Record<string, string[]> = {}
          let priceRange: { min?: number; max?: number } | null = null
          let filterRail: FilterRail | null = null
          let lastTotal = 0
          let lastFacets: Record<string, Record<string, number>> = {}
          let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null

          // Inject filter CSS at boot so layout is ready, but defer
          // FilterRail creation until first search resolves (prevents
          // race condition where user clicks filter before searchContext exists)
          if (filtersEnabled) {
            injectFilterCSS()
            inline.initLayout()
          }

          /** Lazily create FilterRail — called once after first search resolves */
          const ensureFilterRail = () => {
            if (filterRail || !filtersEnabled) return
            const railSlot = inline.initLayout() // returns existing slot if already created
            filterRail = new FilterRail(
              railSlot,
              // onFacetToggle
              (prefix: string, value: string) => {
                if (!facetFilters[prefix]) facetFilters[prefix] = []
                const idx = facetFilters[prefix].indexOf(value)
                if (idx >= 0) {
                  facetFilters[prefix].splice(idx, 1)
                  if (facetFilters[prefix].length === 0) delete facetFilters[prefix]
                } else {
                  facetFilters[prefix].push(value)
                }
                doFilter()
              },
              // onPriceChange
              (range: { min?: number; max?: number } | null) => {
                priceRange = range
                doFilter()
              },
              // onClearAll
              () => {
                facetFilters = {}
                priceRange = null
                doFilter()
              },
              config.pricePresets
            )
          }

          const cardHandlers: CardHandlers = {
            onViewProduct(product) {
              const url = appendUtm(resolveProductUrl(product), {
                shopId: shopId!,
                productId: product.id,
                query: lastQuery,
              })
              window.open(url, "_blank", "noopener,noreferrer")
            },
            async onAddToCart(product) {
              const result = await cartAdapter.addToCart(product)
              console.log(
                `[xtal.js] Add to cart: ${result.success ? "OK" : "FAIL"} — ${result.message}`
              )

              if (result.success) {
                fetch(`${apiBase}/api/xtal/events`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    product_id: product.id,
                    action: "add_to_cart",
                    collection: shopId,
                    query: lastQuery,
                  }),
                }).catch(() => {})
              }
            },
          }

          /** Build card elements from results */
          const buildCards = (results: Product[]): HTMLElement[] => {
            return results.map((product) => {
              if (cardTemplate) {
                return renderTemplatedCard(
                  cardTemplate.html,
                  product,
                  lastQuery,
                  shopId!,
                  cardHandlers,
                  cartAdapter.name,
                  resolveProductUrl(product)
                )
              }
              return renderProductCard(product, lastQuery, shopId!, null, cardHandlers)
            })
          }

          /** Filter-in-place — uses lightweight /api/xtal/search with search_context */
          const doFilter = () => {
            if (!searchContext) return
            if (filterDebounceTimer) clearTimeout(filterDebounceTimer)
            filterDebounceTimer = setTimeout(() => {
              inline.showLoading(lastQuery)
              api
                .searchFiltered(lastQuery, searchContext!, {
                  facetFilters,
                  priceRange,
                  limit: 24,
                })
                .then((res) => {
                  lastTotal = res.total
                  lastFacets = res.computed_facets || {}

                  if (res.results.length === 0) {
                    inline.renderEmpty(lastQuery)
                  } else {
                    inline.renderCards(buildCards(res.results))
                  }

                  // Update filter rail with new facets
                  filterRail?.update(lastFacets, facetFilters, priceRange, lastTotal)
                })
                .catch((err) => {
                  if (err instanceof DOMException && err.name === "AbortError") return
                  console.error("[xtal.js] Filter error:", err)
                  beaconError(apiBase, shopId!, String(err), "filter")
                })
            }, 150)
          }

          const doSearch = (query: string) => {
            lastQuery = query

            // Reset filter state on new query
            searchContext = null
            facetFilters = {}
            priceRange = null

            // Close mobile drawer + reset showMore on new query
            filterRail?.closeDrawer()
            filterRail?.resetState()

            inline.showLoading(query)

            api
              .searchFull(query, 24)
              .then((res) => {
                lastTotal = res.total
                lastFacets = res.computed_facets || {}
                searchContext = res.search_context || null

                // Create filter rail on first successful search (deferred to avoid race)
                ensureFilterRail()

                if (res.results.length === 0) {
                  inline.renderEmpty(query)
                  filterRail?.update({}, {}, null, 0)
                  return
                }

                inline.renderCards(buildCards(res.results))

                // Update filter rail with facets from initial search
                filterRail?.update(lastFacets, facetFilters, priceRange, lastTotal)
              })
              .catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError") {
                  return
                }
                console.error("[xtal.js] Search error:", err)
                beaconError(apiBase, shopId!, String(err), "search")
                inline.restore()
                // Fallback: navigate to merchant's native search
                if (config.siteUrl && lastQuery) {
                  window.location.href = `${config.siteUrl.replace(/\/$/, "")}/shop/?Search=${encodeURIComponent(lastQuery)}`
                }
              })
          }

          // Debounced search — prevents rapid-fire requests from fast typing
          let debounceTimer: ReturnType<typeof setTimeout> | null = null
          const debouncedSearch = (query: string) => {
            if (debounceTimer) clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => doSearch(query), 200)
          }

          const selector = config.searchSelector || 'input[type="search"]'
          cleanupInterceptor = attachInterceptor(selector, debouncedSearch, config.observerTimeoutMs)

          // Auto-trigger if input already has a query (e.g. navigated from homepage search)
          const existingInput = document.querySelector<HTMLInputElement>(selector)
          if (existingInput?.value?.trim()) {
            doSearch(existingInput.value.trim())
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(window as any).XTAL = {
            destroy() {
              // Cancel pending debounce + filter timers
              if (debounceTimer) clearTimeout(debounceTimer)
              if (filterDebounceTimer) clearTimeout(filterDebounceTimer)
              // Abort any in-flight API request
              api.abort()
              cleanupInterceptor?.()
              filterRail?.destroy()
              inline.destroy()
              const cardStyles = document.getElementById("xtal-card-styles")
              if (cardStyles) cardStyles.remove()
              const filterStyles = document.getElementById("xtal-filter-styles")
              if (filterStyles) filterStyles.remove()
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(window as any).XTAL = undefined
            },
          }

          console.log(
            `[xtal.js] Initialized INLINE for ${shopId}. Search: ${selector}, Grid: ${config.resultsSelector}${filtersEnabled ? ", Filters: ON" : ""}`
          )
        }
      })
      .catch((err) => {
        console.error("[xtal.js] Failed to fetch config:", err)
        beaconError(apiBase, shopId, String(err), "config")
      })
  } catch (err) {
    // Top-level catch — never throw into merchant's global scope
    console.error("[xtal.js] Boot error:", err)
  }
}

// Boot on DOMContentLoaded or immediately if already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot)
} else {
  boot()
}
