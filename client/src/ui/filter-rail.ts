/**
 * Filter Rail — desktop sidebar + mobile FAB/drawer.
 * Ported from React FilterRail.tsx + MobileFilterDrawer.tsx to vanilla DOM.
 * All classes prefixed with `xtal-` to avoid merchant CSS conflicts.
 */

// ─── Constants ─────────────────────────────────────────────

const FACET_LABELS: Record<string, string> = {
  "product-subcategory": "Category",
  brand: "Brand",
  vendor: "Vendor",
  "product-age": "Age",
  proof: "Proof",
  region: "Region",
  size: "Size",
  terpene: "Terpene",
  effect: "Effect",
  "strain-type": "Strain Type",
  format: "Format",
  material: "Material",
  shape: "Shape",
  "use-case": "Use Case",
  feature: "Feature",
  design: "Design",
  style: "Style",
  color: "Color",
}

const DEFAULT_EXPANDED = new Set([
  "product-subcategory", "brand", "vendor", "strain-type",
  "terpene", "effect", "format", "material", "use-case", "style",
])

const INITIALLY_VISIBLE = 5

const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: "Under $25", max: 25 },
  { label: "$25–$50", min: 25, max: 50 },
  { label: "$50–$100", min: 50, max: 100 },
  { label: "$100–$200", min: 100, max: 200 },
  { label: "$200+", min: 200 },
]

// ─── Helpers ───────────────────────────────────────────────

function formatFacetValue(value: string): string {
  return value
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function humanizePrefix(prefix: string): string {
  return (
    FACET_LABELS[prefix] ||
    prefix
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  )
}

function priceRangeEquals(
  a: { min?: number; max?: number } | null,
  b: { min?: number; max?: number }
): boolean {
  if (!a) return false
  return a.min === b.min && a.max === b.max
}

// ─── FilterRail class ──────────────────────────────────────

export class FilterRail {
  private container: HTMLElement
  private onFacetToggle: (prefix: string, value: string) => void
  private onPriceChange: (range: { min?: number; max?: number } | null) => void
  private onClearAll: () => void

  // Desktop rail element
  private railEl: HTMLElement
  // Mobile elements
  private fabEl: HTMLElement
  private backdropEl: HTMLElement
  private drawerEl: HTMLElement
  private drawerContentEl: HTMLElement
  private drawerFooterBtn: HTMLElement

  // State
  private expandedSections = new Set<string>(["price", ...DEFAULT_EXPANDED])
  private showMore: Record<string, boolean> = {}
  private drawerOpen = false
  private savedBodyOverflow = ""

  constructor(
    container: HTMLElement,
    onFacetToggle: (prefix: string, value: string) => void,
    onPriceChange: (range: { min?: number; max?: number } | null) => void,
    onClearAll: () => void
  ) {
    this.container = container
    this.onFacetToggle = onFacetToggle
    this.onPriceChange = onPriceChange
    this.onClearAll = onClearAll

    // ── Desktop rail ──
    this.railEl = document.createElement("aside")
    this.railEl.className = "xtal-filter-rail"
    container.appendChild(this.railEl)

    // ── Mobile FAB ──
    this.fabEl = document.createElement("button")
    this.fabEl.className = "xtal-filter-fab"
    this.fabEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg><span class="xtal-fab-text">Filters</span>`
    this.fabEl.addEventListener("click", () => this.openDrawer())
    document.body.appendChild(this.fabEl)

    // ── Backdrop ──
    this.backdropEl = document.createElement("div")
    this.backdropEl.className = "xtal-backdrop"
    this.backdropEl.addEventListener("click", () => this.closeDrawer())
    document.body.appendChild(this.backdropEl)

    // ── Drawer ──
    this.drawerEl = document.createElement("div")
    this.drawerEl.className = "xtal-filter-drawer"

    // Header
    const header = document.createElement("div")
    header.className = "xtal-drawer-header"
    header.innerHTML = `<span class="xtal-drawer-title">Filters</span>`
    const closeBtn = document.createElement("button")
    closeBtn.className = "xtal-drawer-close"
    closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    closeBtn.setAttribute("aria-label", "Close filters")
    closeBtn.addEventListener("click", () => this.closeDrawer())
    header.appendChild(closeBtn)
    this.drawerEl.appendChild(header)

    // Content
    this.drawerContentEl = document.createElement("div")
    this.drawerContentEl.className = "xtal-drawer-content"
    this.drawerEl.appendChild(this.drawerContentEl)

    // Footer
    const footer = document.createElement("div")
    footer.className = "xtal-drawer-footer"
    this.drawerFooterBtn = document.createElement("button")
    this.drawerFooterBtn.className = "xtal-drawer-apply"
    this.drawerFooterBtn.textContent = "See results"
    this.drawerFooterBtn.addEventListener("click", () => this.closeDrawer())
    footer.appendChild(this.drawerFooterBtn)
    this.drawerEl.appendChild(footer)

    document.body.appendChild(this.drawerEl)
  }

  // ── Public update ──

  update(
    facets: Record<string, Record<string, number>>,
    activeFacetFilters: Record<string, string[]>,
    activePrice: { min?: number; max?: number } | null,
    total: number
  ): void {
    const hasFacets = facets && Object.keys(facets).length > 0
    const hasActive = Object.values(activeFacetFilters).some(v => v.length > 0) || activePrice !== null

    // Hide everything if no facets and no active filters
    this.railEl.style.display = (!hasFacets && !hasActive) ? "none" : ""
    this.fabEl.style.display = "" // CSS handles responsive visibility

    if (!hasFacets && !hasActive) {
      this.fabEl.classList.add("xtal-fab-hidden")
      return
    } else {
      this.fabEl.classList.remove("xtal-fab-hidden")
    }

    // Render shared filter sections into both containers
    this.railEl.innerHTML = ""
    this.drawerContentEl.innerHTML = ""

    const desktopSections = this.buildFilterSections(facets, activeFacetFilters, activePrice, "desktop")
    const mobileSections = this.buildFilterSections(facets, activeFacetFilters, activePrice, "mobile")

    this.railEl.appendChild(desktopSections)
    this.drawerContentEl.appendChild(mobileSections)

    // Update FAB badge
    const activeCount = Object.values(activeFacetFilters).reduce((n, v) => n + v.length, 0)
      + (activePrice ? 1 : 0)
    const existingBadge = this.fabEl.querySelector(".xtal-fab-badge")
    if (existingBadge) existingBadge.remove()
    if (activeCount > 0) {
      const badge = document.createElement("span")
      badge.className = "xtal-fab-badge"
      badge.textContent = String(activeCount)
      this.fabEl.appendChild(badge)
    }

    // Update footer button
    this.drawerFooterBtn.textContent = `See ${total} result${total !== 1 ? "s" : ""}`
  }

  // ── Filter sections builder ──

  private buildFilterSections(
    facets: Record<string, Record<string, number>>,
    activeFacetFilters: Record<string, string[]>,
    activePrice: { min?: number; max?: number } | null,
    mode: "desktop" | "mobile"
  ): DocumentFragment {
    const frag = document.createDocumentFragment()

    const hasAnyActive = Object.values(activeFacetFilters).some(v => v.length > 0) || activePrice !== null

    // ── Applied filters + Clear all ──
    if (hasAnyActive) {
      const appliedSection = document.createElement("div")
      appliedSection.className = "xtal-applied-section"

      const clearRow = document.createElement("div")
      clearRow.className = "xtal-clear-row"
      const clearBtn = document.createElement("button")
      clearBtn.className = "xtal-clear-all"
      clearBtn.textContent = "Clear all"
      clearBtn.addEventListener("click", () => this.onClearAll())
      clearRow.appendChild(clearBtn)
      appliedSection.appendChild(clearRow)

      const chipsWrap = document.createElement("div")
      chipsWrap.className = "xtal-applied-chips"

      // Facet chips
      for (const [prefix, values] of Object.entries(activeFacetFilters)) {
        for (const value of values) {
          const chip = document.createElement("button")
          chip.className = "xtal-chip"
          chip.innerHTML = `${formatFacetValue(value)} <span class="xtal-chip-x">\u00d7</span>`
          chip.addEventListener("click", () => this.onFacetToggle(prefix, value))
          chipsWrap.appendChild(chip)
        }
      }

      // Price chip
      if (activePrice) {
        const chip = document.createElement("button")
        chip.className = "xtal-chip"
        const label = activePrice.min && activePrice.max
          ? `$${activePrice.min}–$${activePrice.max}`
          : activePrice.max
            ? `Under $${activePrice.max}`
            : `$${activePrice.min}+`
        chip.innerHTML = `${label} <span class="xtal-chip-x">\u00d7</span>`
        chip.addEventListener("click", () => this.onPriceChange(null))
        chipsWrap.appendChild(chip)
      }

      appliedSection.appendChild(chipsWrap)
      frag.appendChild(appliedSection)
    }

    // ── Price section ──
    const priceSection = this.buildCollapsibleSection(
      "price", "Price", 0, activePrice !== null, mode,
      () => {
        const presetWrap = document.createElement("div")
        presetWrap.className = "xtal-price-presets"
        for (const preset of PRICE_PRESETS) {
          const btn = document.createElement("button")
          btn.className = "xtal-price-btn"
          if (priceRangeEquals(activePrice, preset)) {
            btn.classList.add("xtal-price-btn-active")
          }
          btn.textContent = preset.label
          btn.addEventListener("click", () => {
            if (priceRangeEquals(activePrice, preset)) {
              this.onPriceChange(null)
            } else {
              this.onPriceChange({ min: preset.min, max: preset.max })
            }
          })
          presetWrap.appendChild(btn)
        }
        return presetWrap
      }
    )
    frag.appendChild(priceSection)

    // ── Facet sections ──
    const facetEntries = Object.entries(facets)
    for (const [prefix, values] of facetEntries) {
      const activeValues = activeFacetFilters[prefix] || []
      const activeCount = activeValues.length

      const section = this.buildCollapsibleSection(
        prefix, humanizePrefix(prefix), activeCount, activeCount > 0, mode,
        () => {
          const listEl = document.createElement("div")
          listEl.className = "xtal-facet-list"

          const sortedEntries = Object.entries(values).sort((a, b) => b[1] - a[1])
          const sectionKey = `${mode}-${prefix}`
          const isShowingMore = this.showMore[sectionKey]
          const visibleEntries = isShowingMore || sortedEntries.length <= INITIALLY_VISIBLE
            ? sortedEntries
            : sortedEntries.slice(0, INITIALLY_VISIBLE)
          const hiddenCount = sortedEntries.length - INITIALLY_VISIBLE

          for (const [value, count] of visibleEntries) {
            const isChecked = activeValues.includes(value)
            const isZero = count === 0 && !isChecked

            const label = document.createElement("label")
            label.className = "xtal-facet-label"
            if (isZero) label.classList.add("xtal-facet-disabled")

            const checkbox = document.createElement("input")
            checkbox.type = "checkbox"
            checkbox.className = "xtal-facet-checkbox"
            checkbox.checked = isChecked
            checkbox.addEventListener("change", () => this.onFacetToggle(prefix, value))

            const text = document.createElement("span")
            text.className = "xtal-facet-text"
            text.textContent = formatFacetValue(value)

            const countEl = document.createElement("span")
            countEl.className = "xtal-facet-count"
            countEl.textContent = String(count)

            label.appendChild(checkbox)
            label.appendChild(text)
            label.appendChild(countEl)
            listEl.appendChild(label)
          }

          if (hiddenCount > 0) {
            const moreBtn = document.createElement("button")
            moreBtn.className = "xtal-show-more"
            moreBtn.textContent = isShowingMore ? "Show less" : `Show ${hiddenCount} more`
            moreBtn.addEventListener("click", () => {
              this.showMore[sectionKey] = !this.showMore[sectionKey]
              // Trigger parent re-render — caller should call update() again
              // For immediate feedback, just toggle inline
              const parent = moreBtn.parentElement
              if (!parent) return
              // Rebuild this section's list in place
              const newList = this.buildFacetList(prefix, values, activeValues, mode)
              parent.replaceWith(newList)
            })
            listEl.appendChild(moreBtn)
          }

          return listEl
        }
      )
      frag.appendChild(section)
    }

    return frag
  }

  private buildFacetList(
    prefix: string,
    values: Record<string, number>,
    activeValues: string[],
    mode: "desktop" | "mobile"
  ): HTMLElement {
    const listEl = document.createElement("div")
    listEl.className = "xtal-facet-list"

    const sectionKey = `${mode}-${prefix}`
    const sortedEntries = Object.entries(values).sort((a, b) => b[1] - a[1])
    const isShowingMore = this.showMore[sectionKey]
    const visibleEntries = isShowingMore || sortedEntries.length <= INITIALLY_VISIBLE
      ? sortedEntries
      : sortedEntries.slice(0, INITIALLY_VISIBLE)
    const hiddenCount = sortedEntries.length - INITIALLY_VISIBLE

    for (const [value, count] of visibleEntries) {
      const isChecked = activeValues.includes(value)
      const isZero = count === 0 && !isChecked

      const label = document.createElement("label")
      label.className = "xtal-facet-label"
      if (isZero) label.classList.add("xtal-facet-disabled")

      const checkbox = document.createElement("input")
      checkbox.type = "checkbox"
      checkbox.className = "xtal-facet-checkbox"
      checkbox.checked = isChecked
      checkbox.addEventListener("change", () => this.onFacetToggle(prefix, value))

      const text = document.createElement("span")
      text.className = "xtal-facet-text"
      text.textContent = formatFacetValue(value)

      const countEl = document.createElement("span")
      countEl.className = "xtal-facet-count"
      countEl.textContent = String(count)

      label.appendChild(checkbox)
      label.appendChild(text)
      label.appendChild(countEl)
      listEl.appendChild(label)
    }

    if (hiddenCount > 0) {
      const moreBtn = document.createElement("button")
      moreBtn.className = "xtal-show-more"
      moreBtn.textContent = isShowingMore ? "Show less" : `Show ${hiddenCount} more`
      moreBtn.addEventListener("click", () => {
        this.showMore[sectionKey] = !this.showMore[sectionKey]
        const newList = this.buildFacetList(prefix, values, activeValues, mode)
        listEl.replaceWith(newList)
      })
      listEl.appendChild(moreBtn)
    }

    return listEl
  }

  private buildCollapsibleSection(
    key: string,
    label: string,
    activeCount: number,
    forceExpanded: boolean,
    mode: "desktop" | "mobile",
    buildContent: () => HTMLElement
  ): HTMLElement {
    const section = document.createElement("div")
    section.className = "xtal-filter-section"

    const isExpanded = forceExpanded || this.expandedSections.has(key)

    // Header
    const headerBtn = document.createElement("button")
    headerBtn.className = "xtal-section-header"
    const labelSpan = document.createElement("span")
    labelSpan.className = "xtal-section-label"
    labelSpan.textContent = label

    if (activeCount > 0) {
      const badge = document.createElement("span")
      badge.className = "xtal-section-badge"
      badge.textContent = String(activeCount)
      labelSpan.appendChild(badge)
    }

    const chevron = document.createElement("span")
    chevron.className = "xtal-section-chevron"
    chevron.textContent = isExpanded ? "\u25BE" : "\u25B8"

    headerBtn.appendChild(labelSpan)
    headerBtn.appendChild(chevron)
    headerBtn.addEventListener("click", () => {
      if (this.expandedSections.has(key)) {
        this.expandedSections.delete(key)
      } else {
        this.expandedSections.add(key)
      }
      // Toggle visibility
      const content = section.querySelector(".xtal-section-content") as HTMLElement | null
      if (content) {
        content.style.display = content.style.display === "none" ? "" : "none"
        chevron.textContent = content.style.display === "none" ? "\u25B8" : "\u25BE"
      }
    })

    section.appendChild(headerBtn)

    // Content
    const contentWrap = document.createElement("div")
    contentWrap.className = "xtal-section-content"
    if (!isExpanded) contentWrap.style.display = "none"
    contentWrap.appendChild(buildContent())
    section.appendChild(contentWrap)

    return section
  }

  // ── Mobile drawer ──

  private openDrawer(): void {
    this.drawerOpen = true
    this.savedBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    this.backdropEl.classList.add("xtal-backdrop-open")
    this.drawerEl.classList.add("xtal-drawer-open")
  }

  private closeDrawer(): void {
    this.drawerOpen = false
    document.body.style.overflow = this.savedBodyOverflow
    this.backdropEl.classList.remove("xtal-backdrop-open")
    this.drawerEl.classList.remove("xtal-drawer-open")
  }

  // ── Cleanup ──

  destroy(): void {
    if (this.drawerOpen) {
      this.closeDrawer()
    }
    this.railEl.remove()
    this.fabEl.remove()
    this.backdropEl.remove()
    this.drawerEl.remove()
  }
}
