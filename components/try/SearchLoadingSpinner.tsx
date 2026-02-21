"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

const TIPS = [
  "Analyzing shopping intent and matching product attributes\u2026",
  "XTAL understands natural language \u2014 try \u2018lightweight jacket for spring hiking\u2019",
  "Try: \u2018gift for a coffee lover under $50\u2019",
  "XTAL searches by meaning, not just keywords",
  "Refine your results with filters and price ranges after searching",
]

export default function SearchLoadingSpinner() {
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-center py-24 px-6"
      role="status"
      aria-live="polite"
      aria-label="Searching for products"
    >
      {/* Spinner */}
      <div className="relative mb-8 w-20 h-20">
        <div className="absolute inset-0 border-4 border-xtal-ice rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-xtal-navy rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-xtal-navy animate-pulse" />
        </div>
      </div>

      {/* Rotating tip */}
      <div className="max-w-md text-center">
        <p key={tipIndex} className="text-sm text-slate-600 leading-relaxed animate-fadeIn">
          {TIPS[tipIndex]}
        </p>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {TIPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === tipIndex ? "w-6 bg-xtal-navy" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
