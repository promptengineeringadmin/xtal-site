"use client"

import { useMemo } from "react"
import { Sparkles } from "lucide-react"
import { LOADING_CONTENT, detectQuerySignal } from "@/lib/loading-content"

interface SearchLoadingSpinnerProps {
  query?: string
  storeType?: string
  isFirstSearch?: boolean
  suggestions?: string[]
  onSuggestionClick?: (q: string) => void
}

export default function SearchLoadingSpinner({
  query,
  storeType,
  isFirstSearch = true,
  suggestions,
  onSuggestionClick,
}: SearchLoadingSpinnerProps) {
  const signal = useMemo(() => (query ? detectQuerySignal(query) : "default"), [query])

  const statusLine = isFirstSearch
    ? LOADING_CONTENT.statusLines.firstSearch
    : LOADING_CONTENT.statusLines.returning

  const processDescription =
    LOADING_CONTENT.querySignalMessages[signal] ||
    LOADING_CONTENT.storeTypeDefaults[(storeType || "").toLowerCase()] ||
    LOADING_CONTENT.querySignalMessages.default

  const aspectHint = isFirstSearch
    ? LOADING_CONTENT.aspectHints[Math.floor(Math.random() * LOADING_CONTENT.aspectHints.length)]
    : null

  return (
    <div
      className="flex flex-col items-center justify-center py-24 px-6"
      role="status"
      aria-live="polite"
      aria-label="Searching for products"
    >
      {/* Zone A: Sparkles spinner */}
      <div className="relative mb-6 w-20 h-20">
        <div className="absolute inset-0 border-4 border-xtal-ice rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-xtal-navy rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-xtal-navy animate-pulse" />
        </div>
      </div>

      <div className="max-w-md text-center space-y-2">
        {/* Zone B: Status line */}
        <p className="text-sm font-medium text-slate-700">{statusLine}</p>

        {/* Zone C: User query echo */}
        {query && (
          <p className="text-base italic text-xtal-navy">&ldquo;{query}&rdquo;</p>
        )}

        {/* Zone D: Context-aware process description */}
        <p className="text-sm text-slate-500">{processDescription}</p>

        {/* Zone E: Aspect hint (first search only) */}
        {aspectHint && (
          <p className="text-xs text-slate-400 mt-3">{aspectHint}</p>
        )}

        {/* Suggestion pills */}
        {suggestions && suggestions.length > 0 && onSuggestionClick && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestionClick(s)}
                className="px-3 py-1.5 text-xs bg-xtal-navy/5 text-xtal-navy rounded-full hover:bg-xtal-navy/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
