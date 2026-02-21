"use client"

import { ChevronRight } from "lucide-react"
import type { Product, ShowcaseRow } from "@/lib/xtal-types"

function formatPrice(price: number | number[]): string {
  if (Array.isArray(price)) {
    const sorted = [...price].sort((a, b) => a - b)
    if (sorted.length === 0) return ""
    if (sorted.length === 1 || sorted[0] === sorted[sorted.length - 1]) {
      return `$${sorted[0].toFixed(2)}`
    }
    return `$${sorted[0].toFixed(2)} – $${sorted[sorted.length - 1].toFixed(2)}`
  }
  return `$${price.toFixed(2)}`
}

interface ColdStartPanelProps {
  showcaseData: ShowcaseRow[] | null
  onSearch: (query: string, previewProducts?: Product[]) => void
  suggestions?: string[]
}

const EXTRA_SUGGESTIONS = [
  "dainty jewelry for everyday wear",
  "setting up a home cocktail bar",
]

export default function ColdStartPanel({ showcaseData, onSearch, suggestions }: ColdStartPanelProps) {
  const hasShowcase = showcaseData && showcaseData.length > 0

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* (A) Value line */}
      <p className="text-[13px] text-slate-400 text-center mb-6">
        Describe a scenario &mdash; not just a product name
      </p>

      {hasShowcase ? (
        <>
          {/* Showcase rows */}
          <div className="space-y-5">
            {showcaseData.map((row) => (
              <ShowcaseRowCard key={row.query} row={row} onSearch={onSearch} />
            ))}
          </div>

          {/* "More to try:" extra chips */}
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">More to try:</span>
            {EXTRA_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSearch(s)}
                className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600
                           hover:border-xtal-navy hover:text-xtal-navy transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Fallback: flat query chips (no showcase data) */
        <div className="flex gap-2 flex-wrap justify-center">
          {(suggestions ?? [
            "cozy gift for someone who is always cold",
            "hosting a dinner party this weekend",
            "make my bathroom feel like a spa",
            ...EXTRA_SUGGESTIONS,
          ]).map((s) => (
            <button
              key={s}
              onClick={() => onSearch(s)}
              className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600
                         hover:border-xtal-navy hover:text-xtal-navy transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* (D) Differentiator */}
      <p className="text-[13px] text-slate-400 text-center mt-8">
        Notice these aren&rsquo;t product names &mdash;{" "}
        they&rsquo;re shopping scenarios. Try your own.
      </p>
    </div>
  )
}

function ShowcaseRowCard({ row, onSearch }: { row: ShowcaseRow; onSearch: (query: string, previewProducts?: Product[]) => void }) {
  return (
    <div
      className="rounded-xl border border-slate-100 bg-white/60 p-4 hover:border-slate-200 transition-colors cursor-pointer"
      onClick={() => onSearch(row.query, row.products)}
    >
      {/* (B) Query header */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm font-medium text-slate-700 hover:text-xtal-navy transition-colors flex-1">
          &ldquo;{row.query}&rdquo;
        </p>
        <ChevronRight size={16} className="text-slate-400 shrink-0" />
      </div>
      <p className="text-[11px] text-slate-400 -mt-2 mb-3">{row.label}</p>

      {/* (C) Product thumbnails */}
      <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2
                      md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:snap-none md:pb-0">
        {row.products.map((product) => (
          <ProductThumbnail key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

function ProductThumbnail({ product }: { product: Product }) {
  const imageUrl = product.image_url || product.featured_image || product.images?.[0]?.src

  return (
    <div className="w-[120px] sm:w-[140px] md:w-auto shrink-0 snap-start">
      <div className="aspect-square rounded-lg bg-slate-50 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-contain p-1.5"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
            No image
          </div>
        )}
      </div>
      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-tight">{product.title}</p>
      <p className="text-xs font-semibold text-xtal-navy">{formatPrice(product.price)}</p>
    </div>
  )
}
