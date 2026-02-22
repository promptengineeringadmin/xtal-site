"use client"

import type { Product } from "@/lib/xtal-types"
import { HelpCircle } from "lucide-react"
import ProductCard from "./ProductCard"
import SearchLoadingSpinner from "./SearchLoadingSpinner"
import FilterLoadingOverlay from "./FilterLoadingOverlay"

interface ProductGridProps {
  results: Product[]
  relevanceScores: Record<string, number>
  isSearching: boolean
  isFiltering: boolean
  query: string
  onExplain: (productId: string, score?: number) => Promise<{ explanation: string; prompt_hash: string }>
  onReportIrrelevant?: (product: Product, score?: number) => void
  onWellPut?: (product: Product, score?: number) => void
  wideLayout?: boolean
  isFirstSearch?: boolean
  showExplainNudge?: boolean
}

export default function ProductGrid({
  results,
  relevanceScores,
  isSearching,
  isFiltering,
  query,
  onExplain,
  onReportIrrelevant,
  onWellPut,
  wideLayout = false,
  isFirstSearch,
  showExplainNudge,
}: ProductGridProps) {
  if (isSearching && results.length === 0) {
    return <SearchLoadingSpinner query={query} isFirstSearch={isFirstSearch} />
  }

  if (!isSearching && !isFiltering && results.length === 0 && query) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm">No results found for &ldquo;{query}&rdquo;</p>
        <p className="text-slate-400 text-xs mt-1">Try a different search term or adjust your filters</p>
      </div>
    )
  }

  if (!query) return null

  return (
    <div className="relative">
      {isFiltering && <FilterLoadingOverlay />}

      {/* One-time relevance legend (first search, before explain is used) */}
      {showExplainNudge && (
        <p className="text-[13px] text-slate-400 mb-3">
          Gold-highlighted results scored highest for your intent.
          Tap <HelpCircle size={12} className="inline -mt-0.5 mx-0.5" /> on any card to see why.
        </p>
      )}

      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${wideLayout ? "xl:grid-cols-5" : ""} gap-3 sm:gap-5`}>
        {results.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            score={relevanceScores[product.id]}
            query={query}
            onExplain={onExplain}
            onReportIrrelevant={onReportIrrelevant}
            onWellPut={onWellPut}
            showExplainNudge={showExplainNudge && index === 0}
          />
        ))}
      </div>
    </div>
  )
}
