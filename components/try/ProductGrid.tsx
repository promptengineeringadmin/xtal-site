"use client"

import type { Product } from "@/lib/xtal-types"
import ProductCard from "./ProductCard"

interface ProductGridProps {
  results: Product[]
  relevanceScores: Record<string, number>
  loading: boolean
  query: string
  onExplain: (productId: string, score?: number) => Promise<string>
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="p-3 space-y-2">
        <div className="h-2 bg-slate-100 rounded w-1/3" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-200 rounded w-1/4 mt-3" />
      </div>
    </div>
  )
}

export default function ProductGrid({
  results,
  relevanceScores,
  loading,
  query,
  onExplain,
}: ProductGridProps) {
  if (loading && results.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!loading && results.length === 0 && query) {
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
  )
}
