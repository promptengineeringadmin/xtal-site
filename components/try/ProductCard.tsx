"use client"

import { useState, useRef, useEffect } from "react"
import { HelpCircle, X, ThumbsDown, ThumbsUp } from "lucide-react"
import type { Product } from "@/lib/xtal-types"

interface ProductCardProps {
  product: Product
  score?: number
  query: string
  onExplain: (productId: string, score?: number) => Promise<{ explanation: string; prompt_hash: string }>
  onReportIrrelevant?: (product: Product, score?: number) => void
  onWellPut?: (product: Product, score?: number) => void
  showExplainNudge?: boolean
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

function isHighConfidence(score?: number): boolean {
  return !!score && score >= 0.85
}

const EXPLAIN_PHRASES = [
  "Analyzing match quality\u2026",
  "Comparing to your search intent\u2026",
  "Evaluating product relevance\u2026",
  "Examining feature alignment\u2026",
  "Checking product details\u2026",
]

function ExplainLoadingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(performance.now())

  useEffect(() => {
    const id = setInterval(() => setElapsed(performance.now() - startRef.current), 50)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % EXPLAIN_PHRASES.length)
        setVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-slate-300 border-t-xtal-navy rounded-full animate-spin flex-shrink-0" />
        <span className={`text-slate-500 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
          {EXPLAIN_PHRASES[phraseIndex]}
        </span>
      </div>
      <span className="text-[10px] text-slate-400 tabular-nums text-right">
        {(elapsed / 1000).toFixed(1)}s
      </span>
    </div>
  )
}

export default function ProductCard({ product, score, query, onExplain, onReportIrrelevant, onWellPut, showExplainNudge }: ProductCardProps) {
  const [explainOpen, setExplainOpen] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explainLoading, setExplainLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [wellPutSent, setWellPutSent] = useState(false)
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
      const result = await onExplain(product.id, score)
      setExplanation(result.explanation)
      setExplainLoading(false)
    }
  }

  function handleReportIrrelevant() {
    setDismissed(true)
    setTimeout(() => {
      onReportIrrelevant?.(product, score)
    }, 300)
  }

  function handleWellPut() {
    setWellPutSent(true)
    onWellPut?.(product, score)
  }

  return (
    <div
      ref={cardRef}
      aria-label={isHighConfidence(score) ? "High relevance match" : undefined}
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col ${dismissed ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
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

      {/* Relevance indicator — internal divider */}
      {isHighConfidence(score) && <div className="h-[2px] bg-amber-400" />}

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
            className={`p-2 rounded-md text-slate-400 hover:text-xtal-navy hover:bg-slate-50 transition-colors${
              showExplainNudge && !explainOpen ? " animate-nudge-once" : ""
            }`}
          >
            {explainOpen ? <X size={16} /> : <HelpCircle size={16} />}
          </button>
        </div>

        {/* Explain panel */}
        {explainOpen && (
          <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 leading-relaxed">
            {explainLoading ? (
              <ExplainLoadingIndicator />
            ) : (
              <>
                {explanation?.split('\n\n').map((para, i) => (
                  <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{para}</p>
                ))}
                <div className="flex items-center gap-3 mt-2">
                  {onWellPut && (
                    <button
                      onClick={handleWellPut}
                      disabled={wellPutSent}
                      className={`flex items-center gap-1 text-[10px] transition-colors ${
                        wellPutSent
                          ? "text-green-500"
                          : "text-slate-400 hover:text-green-600"
                      }`}
                    >
                      <ThumbsUp size={10} />
                      {wellPutSent ? "Thanks!" : "Well put!"}
                    </button>
                  )}
                  {onReportIrrelevant && (
                    <button
                      onClick={handleReportIrrelevant}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <ThumbsDown size={10} />
                      Not relevant
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
