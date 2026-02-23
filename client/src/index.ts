import { XtalAPI, type SearchFullResponse } from "./api"
import { XtalOverlay } from "./ui/overlay"
import { renderResultsGrid, renderLoading, renderEmpty } from "./ui/results"
import { renderAspectChips } from "./ui/filters"
import { attachInterceptor } from "./interceptor"
import type { CardHandlers, CardTemplate } from "./ui/template"
import { appendUtm } from "./utm"

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
        const overlay = new XtalOverlay(cardTemplate?.css)

        const cardHandlers: CardHandlers = {
          onViewProduct(product) {
            const url = appendUtm(product.product_url || "#", {
              shopId: shopId!,
              productId: product.id,
              query: lastQuery,
            })
            window.open(url, "_blank", "noopener,noreferrer")
          },
          onAddToCart(product) {
            // On a real Shopify store, call the cart API
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).Shopify && product.variants?.[0]?.id) {
              fetch("/cart/add.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: product.variants[0].id,
                  quantity: 1,
                }),
              })
                .then(() => console.log("[xtal.js] Added to cart:", product.id))
                .catch((err) => console.warn("[xtal.js] Cart error:", err))
            } else {
              // Demo/sandbox: navigate to product page
              cardHandlers.onViewProduct(product)
            }
          },
        }

        let selectedAspects = new Set<string>()
        let lastQuery = ""
        let lastResponse: SearchFullResponse | null = null
        let cleanupInterceptor: (() => void) | null = null

        overlay.onHide(() => {
          // Don't clear state — user can re-trigger by typing
        })

        function render() {
          if (!lastResponse) return

          // Build the overlay content
          const backdrop = document.createElement("div")
          backdrop.className = "xtal-backdrop"
          backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) overlay.hide()
          })

          const container = document.createElement("div")
          container.className = "xtal-container"

          // Header
          const header = document.createElement("div")
          header.className = "xtal-header"

          const headerLeft = document.createElement("div")
          const queryLabel = document.createElement("div")
          queryLabel.className = "xtal-header-query"
          queryLabel.textContent = `Results for "${lastQuery}"`
          headerLeft.appendChild(queryLabel)

          const meta = document.createElement("div")
          meta.className = "xtal-header-meta"
          meta.textContent = `${lastResponse.total} products \u00b7 ${lastResponse.query_time.toFixed(0)}ms`
          headerLeft.appendChild(meta)

          header.appendChild(headerLeft)

          const closeBtn = document.createElement("button")
          closeBtn.className = "xtal-close"
          closeBtn.textContent = "\u00d7"
          closeBtn.addEventListener("click", () => overlay.hide())
          header.appendChild(closeBtn)

          container.appendChild(header)

          // Aspect chips
          if (
            lastResponse.aspects_enabled &&
            lastResponse.aspects.length > 0
          ) {
            const chips = renderAspectChips(
              lastResponse.aspects,
              selectedAspects,
              (aspect) => {
                if (selectedAspects.has(aspect)) {
                  selectedAspects.delete(aspect)
                } else {
                  selectedAspects.add(aspect)
                }
                doSearch(lastQuery)
              }
            )
            container.appendChild(chips)
          }

          // Results
          if (lastResponse.results.length > 0) {
            container.appendChild(
              renderResultsGrid(lastResponse.results, lastQuery, shopId!, cardTemplate, cardHandlers)
            )
          } else {
            container.appendChild(renderEmpty(lastQuery))
          }

          // Powered by
          const powered = document.createElement("div")
          powered.className = "xtal-powered"
          powered.textContent = "Powered by XTAL Search"
          container.appendChild(powered)

          backdrop.appendChild(container)
          overlay.setContent(backdrop)
        }

        function showLoading() {
          const backdrop = document.createElement("div")
          backdrop.className = "xtal-backdrop"
          backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) overlay.hide()
          })
          const container = document.createElement("div")
          container.className = "xtal-container"
          container.appendChild(renderLoading())
          backdrop.appendChild(container)
          overlay.setContent(backdrop)
          overlay.show()
        }

        function doSearch(query: string) {
          lastQuery = query
          showLoading()

          api
            .searchFull(query, 16, Array.from(selectedAspects))
            .then((res) => {
              lastResponse = res
              render()
              if (!overlay.isVisible()) overlay.show()
            })
            .catch((err) => {
              if (err instanceof DOMException && err.name === "AbortError") {
                return // Superseded by a newer request
              }
              console.error("[xtal.js] Search error:", err)
            })
        }

        // Hook the search input
        const selector = config.searchSelector || 'input[type="search"]'
        cleanupInterceptor = attachInterceptor(selector, doSearch)

        // Expose cleanup on window for the sandbox's Clear/Reset button
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).XTAL = {
          destroy() {
            cleanupInterceptor?.()
            overlay.destroy()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (window as any).XTAL
          },
        }

        console.log(`[xtal.js] Initialized for ${shopId}. Selector: ${selector}`)
      })
      .catch((err) => {
        console.error("[xtal.js] Failed to fetch config:", err)
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
