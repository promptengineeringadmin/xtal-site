"use client"

import { useState, useMemo } from "react"
import { useXtalSearch } from "@/lib/use-xtal-search"
import { SlidersHorizontal } from "lucide-react"
import SearchBar from "./SearchBar"
import ProductGrid from "./ProductGrid"
import AspectChips from "./AspectChips"
import FilterRail from "./FilterRail"
import MobileFilterDrawer from "./MobileFilterDrawer"
import AppliedFilters from "./AppliedFilters"
import PriceSlider from "./PriceSlider"
import { ChevronDown, ChevronUp } from "lucide-react"
import { formatFacetValue } from "@/lib/facet-utils"
import type { PriceRange } from "@/lib/xtal-types"

export default function TrySearch({ collection, suggestions }: { collection?: string; suggestions?: string[] } = {}) {
  const {
    query,
    sortedResults,
    total,
    loading,
    isSearching,
    isFiltering,
    error,
    queryTime,
    aspects,
    selectedAspects,
    computedFacets,
    activeFacetFilters,
    priceRange,
    relevanceScores,
    sortBy,
    setSortBy,
    results,
    search,
    selectAspect,
    removeAspect,
    applyFacetFilter,
    applyPriceRange,
    clearAllFilters,
    explain,
    reportIrrelevant,
  } = useXtalSearch(collection)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const hasActiveFilters = Object.values(activeFacetFilters).some(v => v.length > 0) ||
    (priceRange != null && (priceRange.min !== null || priceRange.max !== null))
  const hasFilterRail = (computedFacets && Object.keys(computedFacets).length > 0) || hasActiveFilters
  const showFilters = filtersOpen && hasFilterRail

  // Build a quick summary of what's actually in the results (vendors, types, sample titles)
  const resultsSummary = useMemo(() => {
    if (sortedResults.length === 0) return ""
    const vendors = Array.from(new Set(sortedResults.map((p) => p.vendor).filter(Boolean)))
    const types = Array.from(new Set(sortedResults.map((p) => p.product_type).filter(Boolean)))
    // Interleave vendors and types for variety, cap at 4 items
    const items: string[] = []
    let vi = 0, ti = 0
    while (items.length < 4 && (vi < vendors.length || ti < types.length)) {
      if (vi < vendors.length) items.push(vendors[vi++])
      if (items.length < 4 && ti < types.length) items.push(types[ti++])
    }
    if (items.length === 0) {
      // Fallback: sample a few product titles
      const step = Math.max(1, Math.floor(sortedResults.length / 3))
      for (let i = 0; i < sortedResults.length && items.length < 3; i += step) {
        const t = sortedResults[i].title || sortedResults[i].name
        if (t) items.push(t.length > 30 ? t.slice(0, 28) + "…" : t)
      }
    }
    return items.join(", ")
  }, [sortedResults])

  // Count active filters for the FAB badge
  const activeFilterCount = useMemo(() => {
    let count = Object.values(activeFacetFilters).reduce((sum, v) => sum + v.length, 0)
    if (priceRange && (priceRange.min !== null || priceRange.max !== null)) count++
    return count
  }, [activeFacetFilters, priceRange])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search bar — full width above grid */}
      <SearchBar onSearch={search} loading={loading} initialQuery={query} hasSearched={!!query} suggestions={suggestions} />

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Aspect chips — flush under search bar, no label, no grid offset */}
      {aspects.length > 0 && (
        <div className="mt-3">
          <AspectChips
            aspects={aspects}
            selectedAspects={selectedAspects}
            onSelect={selectAspect}
            onRemove={removeAspect}
          />
        </div>
      )}

      {/* Info bar: filter toggle + results count + sort — grid-aligned */}
      {query && !isSearching && !isFiltering && (sortedResults.length > 0 || hasActiveFilters) && (
        <div
          className={`mt-5 mb-2 grid ${
            showFilters
              ? "grid-cols-[260px_1fr] gap-10"
              : hasFilterRail
                ? "grid-cols-[auto_1fr] gap-4"
                : ""
          }`}
        >
          {/* Left: toggle icon + Filters label */}
          {hasFilterRail && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                title={filtersOpen ? "Hide filters" : "Show filters"}
                className="flex items-center justify-center w-7 h-7 rounded-md border border-slate-200
                           text-slate-500 hover:border-xtal-navy hover:text-xtal-navy transition-colors"
              >
                <SlidersHorizontal size={14} />
              </button>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Filters
              </span>
            </div>
          )}

          {/* Right: results count + sort */}
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[13px] whitespace-nowrap overflow-hidden">
              <span className="font-medium text-slate-700">
                {total} results for &ldquo;{query}&rdquo;
              </span>
              {resultsSummary && (
                <span key={query} className="animate-wipe-tail text-slate-400">
                  {" "}&mdash; {resultsSummary}{total > sortedResults.length ? ", and more" : ""}
                </span>
              )}
            </p>
            <div className="flex items-baseline gap-3 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs text-slate-600 bg-transparent border border-slate-200 rounded px-2 py-1
                           focus:outline-none focus:ring-2 focus:ring-xtal-navy/30 focus:border-xtal-navy
                           cursor-pointer"
              >
                <option value="relevance">AI Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <span className="text-xs text-slate-400">
                {queryTime.toFixed(2)}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main grid: filter rail + product grid */}
      <div
        className={`mt-2 ${
          showFilters ? "md:grid md:grid-cols-[260px_1fr] md:gap-10" : ""
        }`}
      >
        {hasFilterRail && (
          <div className={showFilters ? "" : "hidden"}>
            <FilterRail
              computedFacets={computedFacets}
              activeFacetFilters={activeFacetFilters}
              priceRange={priceRange}
              results={results}
              total={total}
              onFacetToggle={applyFacetFilter}
              onPriceChange={(range) => applyPriceRange(range)}
              onPriceRemove={() => applyPriceRange(null)}
              onClearAll={clearAllFilters}
            />
          </div>
        )}

        <ProductGrid
          results={sortedResults}
          relevanceScores={relevanceScores}
          isSearching={isSearching}
          isFiltering={isFiltering}
          query={query}
          onExplain={explain}
          onReportIrrelevant={reportIrrelevant}
          wideLayout={!showFilters}
        />
      </div>

      {/* Mobile filter drawer — only when facets are available */}
      {hasFilterRail && (
        <MobileFilterDrawer
          isOpen={mobileFiltersOpen}
          onOpen={() => setMobileFiltersOpen(true)}
          onClose={() => setMobileFiltersOpen(false)}
          total={total}
          activeFilterCount={activeFilterCount}
        >
          <MobileFilterContent
            computedFacets={computedFacets}
            activeFacetFilters={activeFacetFilters}
            priceRange={priceRange}
            results={results}
            onFacetToggle={applyFacetFilter}
            onPriceChange={(range) => applyPriceRange(range)}
            onPriceRemove={() => applyPriceRange(null)}
            onClearAll={clearAllFilters}
          />
        </MobileFilterDrawer>
      )}
    </div>
  )
}

// Mobile-specific filter content (not wrapped in `hidden md:block`)
function MobileFilterContent({
  computedFacets,
  activeFacetFilters,
  priceRange,
  results,
  onFacetToggle,
  onPriceChange,
  onPriceRemove,
  onClearAll,
}: {
  computedFacets: Record<string, Record<string, number>>
  activeFacetFilters: Record<string, string[]>
  priceRange: PriceRange | null
  results: { price: number | number[] }[]
  onFacetToggle: (prefix: string, value: string) => void
  onPriceChange: (range: PriceRange) => void
  onPriceRemove: () => void
  onClearAll: () => void
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["price", ...Object.keys(computedFacets).slice(0, 2)])
  )
  const [showMore, setShowMore] = useState<Record<string, boolean>>({})

  const FACET_LABELS: Record<string, string> = {
    "product-subcategory": "Category",
    brand: "Brand",
    vendor: "Vendor",
  }

  function humanize(prefix: string) {
    return FACET_LABELS[prefix] || prefix.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  }

  // Price stats from results (prices stored in cents, convert to dollars)
  const prices = results.flatMap(p => Array.isArray(p.price) ? p.price.map(v => v / 100) : typeof p.price === "number" ? [p.price / 100] : [])
  const priceMin = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0
  const priceMax = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000

  function toggleSection(key: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function isExpanded(key: string) {
    const active = activeFacetFilters[key]
    if (active && active.length > 0) return true
    return expandedSections.has(key)
  }

  return (
    <div>
      {/* Applied filters */}
      <div className="mb-3">
        <AppliedFilters
          facetFilters={activeFacetFilters}
          priceRange={priceRange}
          onRemoveFacet={onFacetToggle}
          onRemovePrice={onPriceRemove}
          onClearAll={onClearAll}
        />
      </div>

      {/* Price */}
      <div className="border-b border-slate-100 pb-3 mb-3">
        <button onClick={() => toggleSection("price")} className="flex items-center justify-between w-full py-1.5">
          <span className="text-sm font-medium text-slate-700">Price</span>
          {expandedSections.has("price") ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </button>
        {expandedSections.has("price") && (
          <div className="mt-2">
            <PriceSlider
              min={priceMin}
              max={priceMax}
              currentMin={priceRange?.min ?? priceMin}
              currentMax={priceRange?.max ?? priceMax}
              onChange={onPriceChange}
            />
          </div>
        )}
      </div>

      {/* Facet sections */}
      {Object.entries(computedFacets).map(([prefix, values]) => {
        const expanded = isExpanded(prefix)
        const activeValues = activeFacetFilters[prefix] || []
        const sortedEntries = Object.entries(values).sort((a, b) => b[1] - a[1])
        const isShowingMore = showMore[prefix]
        const visibleEntries = isShowingMore || sortedEntries.length <= 5 ? sortedEntries : sortedEntries.slice(0, 5)
        const hiddenCount = sortedEntries.length - 5

        return (
          <div key={prefix} className="border-b border-slate-100 pb-3 mb-3 last:border-b-0">
            <button onClick={() => toggleSection(prefix)} className="flex items-center justify-between w-full py-1.5">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                {humanize(prefix)}
                {activeValues.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-xtal-navy text-white font-medium">{activeValues.length}</span>
                )}
              </span>
              {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>
            {expanded && (
              <div className="mt-1.5 space-y-1">
                {visibleEntries.map(([value, count]) => {
                  const isChecked = activeValues.includes(value)
                  const isZero = count === 0 && !isChecked
                  return (
                    <label key={value} className={`flex items-center gap-2 py-0.5 cursor-pointer ${isZero ? "opacity-40 pointer-events-none" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onFacetToggle(prefix, value)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-xtal-navy focus:ring-xtal-navy/30 focus:ring-offset-0"
                      />
                      <span className="text-xs text-slate-600 flex-1">{formatFacetValue(value)}</span>
                      <span className="text-[10px] text-slate-400">{count}</span>
                    </label>
                  )
                })}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => setShowMore(prev => ({ ...prev, [prefix]: !prev[prefix] }))}
                    className="text-xs text-xtal-navy hover:underline mt-1"
                  >
                    {isShowingMore ? "Show less" : `Show ${hiddenCount} more`}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
