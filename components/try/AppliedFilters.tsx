"use client"

import { X } from "lucide-react"
import type { PriceRange } from "@/lib/xtal-types"
import { formatFacetValue } from "@/lib/facet-utils"

const FACET_LABELS: Record<string, string> = {
  "product-subcategory": "Category",
  brand: "Brand",
  vendor: "Vendor",
  "product-age": "Age",
  proof: "Proof",
  region: "Region",
  size: "Size",
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

interface AppliedFiltersProps {
  facetFilters: Record<string, string[]>
  priceRange: PriceRange | null
  onRemoveFacet: (prefix: string, value: string) => void
  onRemovePrice: () => void
  onClearAll: () => void
}

export default function AppliedFilters({
  facetFilters,
  priceRange,
  onRemoveFacet,
  onRemovePrice,
  onClearAll,
}: AppliedFiltersProps) {
  const facetChips: { prefix: string; value: string; label: string }[] = []
  for (const [prefix, values] of Object.entries(facetFilters)) {
    for (const value of values) {
      facetChips.push({ prefix, value, label: `${humanizePrefix(prefix)}: ${formatFacetValue(value)}` })
    }
  }

  const hasPriceFilter = priceRange && (priceRange.min !== null || priceRange.max !== null)
  const hasAny = facetChips.length > 0 || hasPriceFilter

  if (!hasAny) return null

  const priceLabel = hasPriceFilter
    ? priceRange.min !== null && priceRange.max !== null
      ? `$${priceRange.min} – $${priceRange.max}`
      : priceRange.min !== null
        ? `$${priceRange.min}+`
        : `Under $${priceRange.max}`
    : ""

  return (
    <div className="flex flex-wrap items-center gap-2">
      {facetChips.map((chip) => (
        <button
          key={`${chip.prefix}:${chip.value}`}
          onClick={() => onRemoveFacet(chip.prefix, chip.value)}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                     bg-xtal-navy/10 text-xtal-navy hover:bg-xtal-navy/20 transition-colors"
        >
          {chip.label}
          <X size={12} />
        </button>
      ))}

      {hasPriceFilter && (
        <button
          onClick={onRemovePrice}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                     bg-xtal-navy/10 text-xtal-navy hover:bg-xtal-navy/20 transition-colors"
        >
          {priceLabel}
          <X size={12} />
        </button>
      )}

      <button
        onClick={onClearAll}
        className="text-xs text-slate-400 hover:text-slate-600 transition-colors ml-1"
      >
        Clear all
      </button>
    </div>
  )
}
