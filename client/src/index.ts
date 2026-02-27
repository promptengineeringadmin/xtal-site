import { XtalAPI, type Product } from "./api"
import { InlineRenderer } from "./ui/inline"
import { renderTemplatedCard, type CardHandlers, type CardTemplate } from "./ui/template"
import { renderProductCard } from "./ui/results"
import { attachInterceptor } from "./interceptor"
import { appendUtm } from "./utm"
import { detectCartAdapter } from "./cart/detect"

/** Fire-and-forget error telemetry via sendBeacon */
function beaconError(apiBase: string, shopId: string, error: string, context?: string) {
  try {
    const payload = JSON.stringify({
      action: "error",
      collection: shopId,
      error,
      context,
      ts: Date.now(),
    })
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${apiBase}/api/xtal/events`, payload)
    }
  } catch {
    // Telemetry must never crash
  }
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

          const doSearch = (query: string) => {
            lastQuery = query
            inline.showLoading()

            api
              .searchFull(query, 24)
              .then((res) => {
                if (res.results.length === 0) {
                  inline.renderEmpty(query)
                  return
                }

                const cards: HTMLElement[] = res.results.map((product) => {
                  if (cardTemplate) {
                    return renderTemplatedCard(
                      cardTemplate.html,
                      product,
                      query,
                      shopId!,
                      cardHandlers,
                      cartAdapter.name
                    )
                  }
                  return renderProductCard(product, query, shopId!, null, cardHandlers)
                })
                inline.renderCards(cards)
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
                  window.location.href = `${config.siteUrl.replace(/\/$/, "")}/search-results/?search_field=${encodeURIComponent(lastQuery)}`
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
          cleanupInterceptor = attachInterceptor(selector, debouncedSearch)

          // Auto-trigger if input already has a query (e.g. navigated from homepage search)
          const existingInput = document.querySelector<HTMLInputElement>(selector)
          if (existingInput?.value?.trim()) {
            doSearch(existingInput.value.trim())
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(window as any).XTAL = {
            destroy() {
              cleanupInterceptor?.()
              inline.destroy()
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              delete (window as any).XTAL
            },
          }

          console.log(
            `[xtal.js] Initialized INLINE for ${shopId}. Search: ${selector}, Grid: ${config.resultsSelector}`
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
