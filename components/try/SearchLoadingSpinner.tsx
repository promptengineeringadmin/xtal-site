"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles } from "lucide-react"
import { detectQuerySignal, PROCESS_PHRASES } from "@/lib/query-signals"

interface SearchLoadingSpinnerProps {
  query?: string
  isFirstSearch?: boolean
}

export default function SearchLoadingSpinner({ query, isFirstSearch }: SearchLoadingSpinnerProps) {
  const signalMessage = query ? detectQuerySignal(query) : "Understanding your intent and finding matches"
  const phrases = [signalMessage, ...PROCESS_PHRASES]
  const displayQuery = query && query.length > 80 ? query.slice(0, 77) + "…" : query

  // Live stopwatch: starts at 0 on mount, ticks every 50ms
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(performance.now())

  // Cycling phrases: fade out → swap → fade in every 2.5s
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(performance.now() - startRef.current)
    }, 50)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % phrases.length)
        setVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(id)
  }, [phrases.length])

  return (
    <div
      className="flex flex-col items-center justify-center py-16 md:py-20 px-6"
      role="status"
      aria-live="polite"
      aria-label="Searching for products"
    >
      {/* Zone A: Spinner */}
      <div className="relative mb-4 w-20 h-20">
        <div className="absolute inset-0 border-4 border-xtal-ice rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-xtal-navy rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-xtal-navy animate-pulse" />
        </div>
      </div>

      {/* Zone A-1: Live elapsed timer */}
      <p className="text-xs text-slate-400 mb-4 tabular-nums" aria-hidden="true">
        {(elapsed / 1000).toFixed(2)}s
      </p>

      {/* Zone B + C: Query echo + process description */}
      <div className="max-w-[280px] sm:max-w-sm md:max-w-md text-center">
        {displayQuery && (
          <p className="text-sm md:text-base text-slate-700 italic leading-relaxed">
            &ldquo;{displayQuery}&rdquo;
          </p>
        )}

        <p className={`text-sm text-slate-400 mt-3 leading-relaxed transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
          {phrases[phraseIndex]}
        </p>

        {/* Zone D: Conditional first-search hint */}
        {isFirstSearch && (
          <p className="text-xs text-slate-300 mt-4">
            You&rsquo;ll be able to refine by category and price when ready
          </p>
        )}
      </div>
    </div>
  )
}
