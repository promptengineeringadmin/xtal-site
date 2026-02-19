"use client"

import { useState, useRef } from "react"
import { HelpCircle, X, ThumbsDown } from "lucide-react"
import type { Product } from "@/lib/xtal-types"

interface ProductCardProps {
  product: Product
  score?: number
  query: string
  onExplain: (productId: string, score?: number) => Promise<string>
  onReportIrrelevant?: (productId: string, score?: number) => void
}

function formatPrice(price: number | number[]): string {
  if (Array.isArray(price)) {
    const sorted = [...price].sort((a, b) => a - b)
    if (sorted.length === 0) return "N/A"
    if (sorted.length === 1 || sorted[0] === sorted[sorted.length - 1]) {
      return `$${sorted[0].toFixed(2)}`
    }
    return `$${sorted[0].toFixed(2)} – $${sorted[sorted.length - 1].toFixed(2)}`
  }
  return `$${price.toFixed(2)}`
}

function getAccentStyle(score?: number) {
  if (!score || score < 0.55) return ""
  if (score >= 0.85) return "border-t-2 border-amber-400"
  return "border-t-2 border-amber-200"
}

export default function ProductCard({ product, score, query, onExplain, onReportIrrelevant }: ProductCardProps) {
  const [explainOpen, setExplainOpen] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explainLoading, setExplainLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

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

  function handleReportIrrelevant() {
    setDismissed(true)
    setTimeout(() => {
      onReportIrrelevant?.(product.id, score)
    }, 300)
  }

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col ${getAccentStyle(score)} ${dismissed ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
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
            {product.vendor.replace(/<[^>]*>/g, '').substring(0, 60)}
          </span>
        )}

        {/* Title */}
        <h3 className="text-sm font-medium text-slate-800 line-clamp-2 mt-0.5 leading-snug">
          {product.title}
        </h3>

        {/* Price + Explain */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <p className="text-sm font-semibold text-xtal-navy">
            {formatPrice(product.price)}
          </p>
          <button
            onClick={handleExplain}
            title="Why this result?"
            className="p-2 rounded-md text-slate-400 hover:text-xtal-navy hover:bg-slate-50 transition-colors"
          >
            {explainOpen ? <X size={16} /> : <HelpCircle size={16} />}
          </button>
        </div>

        {/* Explain panel */}
        {explainOpen && (
          <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 leading-relaxed">
            {explainLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-xtal-navy rounded-full animate-spin" />
                <span className="text-slate-500">Analyzing relevance&hellip;</span>
              </div>
            ) : (
              <>
                {explanation}
                {onReportIrrelevant && (
                  <button
                    onClick={handleReportIrrelevant}
                    className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <ThumbsDown size={10} />
                    Not relevant
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
