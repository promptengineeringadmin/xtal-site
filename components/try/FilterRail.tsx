"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { Product, PriceRange } from "@/lib/xtal-types"
import { formatFacetValue } from "@/lib/facet-utils"
import PriceSlider from "./PriceSlider"
import AppliedFilters from "./AppliedFilters"

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
}

// Facets that are expanded by default (by priority order)
const DEFAULT_EXPANDED = ["product-subcategory", "brand", "vendor", "strain-type", "terpene", "effect", "format"]

const INITIALLY_VISIBLE = 5

function humanizePrefix(prefix: string): string {
  return (
    FACET_LABELS[prefix] ||
    prefix
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  )
}

interface FilterRailProps {
  computedFacets: Record<string, Record<string, number>> | null
  activeFacetFilters: Record<string, string[]>
  priceRange: PriceRange | null
  results: Product[]
  total: number
  onFacetToggle: (prefix: string, value: string) => void
  onPriceChange: (range: PriceRange) => void
  onPriceRemove: () => void
  onClearAll: () => void
}

export default function FilterRail({
  computedFacets,
  activeFacetFilters,
  priceRange,
  results,
  total,
  onFacetToggle,
  onPriceChange,
  onPriceRemove,
  onClearAll,
}: FilterRailProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["price", ...DEFAULT_EXPANDED])
  )
  const [showMore, setShowMore] = useState<Record<string, boolean>>({})

  // Derive price range from results (prices stored in dollars)
  const priceStats = useMemo(() => {
    const prices = results.flatMap((p) => {
      if (Array.isArray(p.price)) return p.price
      if (typeof p.price === "number") return [p.price]
      return []
    })
    if (prices.length === 0) return { min: 0, max: 1000 }
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    }
  }, [results])

  const hasActiveFilters = Object.values(activeFacetFilters).some((v) => v.length > 0) ||
    (priceRange != null && (priceRange.min !== null || priceRange.max !== null))

  if ((!computedFacets || Object.keys(computedFacets).length === 0) && !hasActiveFilters) {
    return null
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function isSectionExpanded(key: string): boolean {
    // Force expanded if section has active selections
    const activeValues = activeFacetFilters[key]
    if (activeValues && activeValues.length > 0) return true
    return expandedSections.has(key)
  }

  const facetEntries = Object.entries(computedFacets || {})
  const hasAnyActive =
    Object.values(activeFacetFilters).some((v) => v.length > 0) ||
    (priceRange && (priceRange.min !== null || priceRange.max !== null))

  return (
    <aside className="hidden md:block sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto pr-2
                       scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      {/* Applied filters + Clear all */}
      <div className="mb-3">
        {hasAnyActive && (
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
        <AppliedFilters
          facetFilters={activeFacetFilters}
          priceRange={priceRange}
          onRemoveFacet={onFacetToggle}
          onRemovePrice={onPriceRemove}
          onClearAll={onClearAll}
        />
      </div>

      {/* Price section */}
      <div className="border-b border-slate-100 pb-3 mb-3">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full py-1.5"
        >
          <span className="text-sm font-medium text-slate-700">Price</span>
          {isSectionExpanded("price") ? (
            <ChevronUp size={14} className="text-slate-400" />
          ) : (
            <ChevronDown size={14} className="text-slate-400" />
          )}
        </button>
        {isSectionExpanded("price") && (
          <div className="mt-2">
            <PriceSlider
              min={priceStats.min}
              max={priceStats.max}
              currentMin={priceRange?.min ?? priceStats.min}
              currentMax={priceRange?.max ?? priceStats.max}
              onChange={onPriceChange}
            />
          </div>
        )}
      </div>

      {/* Dynamic facet sections */}
      {facetEntries.map(([prefix, values]) => {
        const expanded = isSectionExpanded(prefix)
        const activeValues = activeFacetFilters[prefix] || []
        const activeCount = activeValues.length

        // Sort values: by count descending
        const sortedEntries = Object.entries(values).sort((a, b) => b[1] - a[1])
        const isShowingMore = showMore[prefix]
        const visibleEntries =
          isShowingMore || sortedEntries.length <= INITIALLY_VISIBLE
            ? sortedEntries
            : sortedEntries.slice(0, INITIALLY_VISIBLE)
        const hiddenCount = sortedEntries.length - INITIALLY_VISIBLE

        return (
          <div key={prefix} className="border-b border-slate-100 pb-3 mb-3 last:border-b-0">
            <button
              onClick={() => toggleSection(prefix)}
              className="flex items-center justify-between w-full py-1.5"
            >
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                {humanizePrefix(prefix)}
                {activeCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-xtal-navy text-white font-medium">
                    {activeCount}
                  </span>
                )}
              </span>
              {expanded ? (
                <ChevronUp size={14} className="text-slate-400" />
              ) : (
                <ChevronDown size={14} className="text-slate-400" />
              )}
            </button>

            {expanded && (
              <div className="mt-1.5 space-y-1">
                {visibleEntries.map(([value, count]) => {
                  const isChecked = activeValues.includes(value)
                  const isZero = count === 0 && !isChecked

                  return (
                    <label
                      key={value}
                      className={`flex items-center gap-2 py-0.5 cursor-pointer group ${
                        isZero ? "opacity-40 pointer-events-none" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onFacetToggle(prefix, value)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-xtal-navy
                                   focus:ring-xtal-navy/30 focus:ring-offset-0"
                      />
                      <span className="text-xs text-slate-600 flex-1 group-hover:text-slate-800 transition-colors">
                        {formatFacetValue(value)}
                      </span>
                      <span className="text-[10px] text-slate-400">{count}</span>
                    </label>
                  )
                })}

                {hiddenCount > 0 && (
                  <button
                    onClick={() =>
                      setShowMore((prev) => ({ ...prev, [prefix]: !prev[prefix] }))
                    }
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
    </aside>
  )
}
