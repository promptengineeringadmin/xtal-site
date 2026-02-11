"use client"

import { Sparkles } from "lucide-react"
import type { Recommendation } from "@/lib/grader/types"

interface RecommendationListProps {
  recommendations: Recommendation[]
}

const BORDER_COLORS = [
  "border-l-blue-500",
  "border-l-indigo-500",
  "border-l-purple-500",
  "border-l-teal-500",
  "border-l-green-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-cyan-500",
]

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  if (!recommendations?.length) return null

  return (
    <div>
      <h3 className="text-xl font-bold text-xtal-navy mb-6">
        How XTAL Would Fix This
      </h3>

      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <div
            key={rec.dimension}
            className={`bg-white rounded-xl border border-slate-200 border-l-4 ${BORDER_COLORS[i % BORDER_COLORS.length]} shadow-sm overflow-hidden`}
          >
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  {rec.dimensionLabel}
                </span>
              </div>

              <p className="text-sm text-red-600 font-medium mb-2">
                {rec.problem}
              </p>

              <p className="text-sm text-slate-600 mb-3">
                {rec.suggestion}
              </p>

              <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 font-medium">
                  {rec.xtalAdvantage}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <a
          href="/try"
          className="inline-flex items-center gap-2 px-8 py-4 bg-xtal-navy text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-900/20"
        >
          <Sparkles className="w-5 h-5" />
          See XTAL in Action
        </a>
      </div>
    </div>
  )
}
