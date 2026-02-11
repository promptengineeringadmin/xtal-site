"use client"

import { useState } from "react"
import { Star, HelpCircle, X } from "lucide-react"
import type { Product } from "@/lib/xtal-types"

interface ProductCardProps {
  product: Product
  score?: number
  query: string
  onExplain: (productId: string, score?: number) => Promise<string>
}

function formatPrice(price: number | number[]): string {
  if (Array.isArray(price)) {
    const sorted = [...price].map(p => p / 100).sort((a, b) => a - b)
    if (sorted.length === 0) return "N/A"
    if (sorted.length === 1 || sorted[0] === sorted[sorted.length - 1]) {
      return `$${sorted[0].toFixed(2)}`
    }
    return `$${sorted[0].toFixed(2)} – $${sorted[sorted.length - 1].toFixed(2)}`
  }
  return `$${(price / 100).toFixed(2)}`
}

function getAccentStyle(score?: number) {
  if (!score || score < 0.55) return ""
  if (score >= 0.85) return "border-t-2 border-amber-400"
  return "border-t-2 border-amber-200"
}

export default function ProductCard({ product, score, query, onExplain }: ProductCardProps) {
  const [explainOpen, setExplainOpen] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explainLoading, setExplainLoading] = useState(false)

  const imageUrl = product.image_url || product.featured_image || product.images?.[0]?.src

  async function handleExplain() {
    if (explainOpen) {
      setExplainOpen(false)
      return
    }
    setExplainOpen(true)
    if (!explanation) {
      setExplainLoading(true)
      const text = await onExplain(product.id, score)
      setExplanation(text)
      setExplainLoading(false)
    }
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col ${getAccentStyle(score)}`}
    >
      {/* Image */}
      <div className="aspect-square bg-slate-50 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Vendor */}
        {product.vendor && (
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            {product.vendor}
          </span>
        )}

        {/* Title */}
        <h3 className="text-sm font-medium text-slate-800 line-clamp-2 mt-0.5 leading-snug">
          {product.title}
        </h3>

        {/* Price */}
        <p className="text-sm font-semibold text-xtal-navy mt-auto pt-2">
          {formatPrice(product.price)}
        </p>

        {/* Explain button */}
        <button
          onClick={handleExplain}
          className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-xtal-navy transition-colors"
        >
          {explainOpen ? <X size={12} /> : <HelpCircle size={12} />}
          {explainOpen ? "Close" : "Why this result?"}
        </button>

        {/* Explain panel */}
        {explainOpen && (
          <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 leading-relaxed">
            {explainLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            ) : (
              explanation
            )}
          </div>
        )}
      </div>
    </div>
  )
}
