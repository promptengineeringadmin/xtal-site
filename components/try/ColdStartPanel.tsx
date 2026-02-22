"use client"

import { ChevronRight } from "lucide-react"
import type { Product, ShowcaseRow } from "@/lib/xtal-types"

interface ColdStartPanelProps {
  showcaseData: ShowcaseRow[] | null
  onSearch: (query: string, previewProducts?: Product[]) => void
  suggestions?: string[]
  extraSuggestions?: string[]
}

export default function ColdStartPanel({ showcaseData, onSearch, suggestions, extraSuggestions = [] }: ColdStartPanelProps) {
  const hasShowcase = showcaseData && showcaseData.length > 0

  return (
    <div className="pt-8 md:pt-12 pb-8">
      {hasShowcase ? (
        <>
          <h2 className="text-sm font-semibold text-indigo-600 tracking-wider uppercase mb-8 text-center">Try these examples</h2>
          {/* 3-column category cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8 md:max-w-6xl md:mx-auto">
            {showcaseData.map((row) => (
              <CategoryCard key={row.query} row={row} onSearch={onSearch} />
            ))}
          </div>

          {/* "More to try:" extra chips */}
          {extraSuggestions.length > 0 && (
            <div className="mt-6 flex items-center gap-2 flex-wrap justify-center">
              <span className="text-xs text-slate-400">More to try:</span>
              {extraSuggestions.map((s) => (
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
        </>
      ) : (
        /* Fallback: flat query chips (no showcase data) */
        <div className="flex gap-2 flex-wrap justify-center max-w-2xl mx-auto">
          {(suggestions ?? [
            "cozy gift for someone who is always cold",
            "hosting a dinner party this weekend",
            "make my bathroom feel like a spa",
            "dainty jewelry for everyday wear",
            "setting up a home cocktail bar",
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

    </div>
  )
}

function CategoryCard({ row, onSearch }: { row: ShowcaseRow; onSearch: (query: string, previewProducts?: Product[]) => void }) {
  const [hero, ...thumbnails] = row.products

  return (
    <div
      className="p-4 md:p-5 rounded-xl border border-slate-100 hover:border-xtal-navy/20
                 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onSearch(row.query, row.products)}
    >
      {/* (B) Category label + arrow */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {row.label}
        </p>
        <ChevronRight size={14} className="text-slate-400 shrink-0" />
      </div>

      {/* (E1) Query text — prominent, above images */}
      <p className="text-base font-semibold text-xtal-navy leading-snug mb-3.5">
        &ldquo;{row.query}&rdquo;
      </p>

      {/* (C) Hero image */}
      {hero && (
        <div className="aspect-[4/3] md:aspect-square rounded-lg bg-slate-50 overflow-hidden">
          <ProductImage product={hero} />
        </div>
      )}

      {/* (D) Three thumbnails */}
      {thumbnails.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {thumbnails.map((product) => (
            <div key={product.id} className="aspect-square rounded-md bg-slate-50 overflow-hidden">
              <ProductImage product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductImage({ product }: { product: Product }) {
  const imageUrl = product.image_url || product.featured_image || product.images?.[0]?.src

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
        No image
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt=""
      className="w-full h-full object-cover"
      loading="lazy"
    />
  )
}
