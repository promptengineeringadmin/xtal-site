"use client"

import type { Product } from "@/lib/xtal-types"
import ProductCard from "./ProductCard"
import SearchLoadingSpinner from "./SearchLoadingSpinner"
import FilterLoadingOverlay from "./FilterLoadingOverlay"

interface ProductGridProps {
  results: Product[]
  relevanceScores: Record<string, number>
  isSearching: boolean
  isFiltering: boolean
  query: string
  onExplain: (productId: string, score?: number) => Promise<string>
}

export default function ProductGrid({
  results,
  relevanceScores,
  isSearching,
  isFiltering,
  query,
  onExplain,
}: ProductGridProps) {
  if (isSearching && results.length === 0) {
    return <SearchLoadingSpinner />
  }

  if (!isSearching && !isFiltering && results.length === 0 && query) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm">No results found for &ldquo;{query}&rdquo;</p>
        <p className="text-slate-400 text-xs mt-1">Try a different search term or adjust your filters</p>
      </div>
    )
  }

  if (!query) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm">Search for products to see AI-powered results</p>
        <p className="text-slate-400 text-xs mt-1">Try natural language queries like &ldquo;comfortable headphones under $50&rdquo;</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {isFiltering && <FilterLoadingOverlay />}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            score={relevanceScores[product.id]}
            query={query}
            onExplain={onExplain}
          />
        ))}
      </div>
    </div>
  )
}
