import type { Recommendation } from "@/lib/grader/types"

export default function PrintRecommendations({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div className="break-before-page">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Strategic Recommendations</h2>
      <p className="text-xs text-slate-500 mb-6">Prioritized opportunities to improve search performance</p>

      {recommendations.map((rec, i) => (
        <div key={i} className="mb-6 break-inside-avoid border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{rec.dimensionLabel}</div>

          <div className="mb-3">
            <div className="text-xs font-semibold text-red-600 mb-1">Problem</div>
            <p className="text-xs text-slate-700 leading-relaxed">{rec.problem}</p>
          </div>

          <div className="mb-3">
            <div className="text-xs font-semibold text-slate-600 mb-1">Recommendation</div>
            <p className="text-xs text-slate-700 leading-relaxed">{rec.suggestion}</p>
          </div>

          <div className="bg-blue-50 rounded-md p-3" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1">XTAL Advantage</div>
            <p className="text-xs text-blue-800 leading-relaxed">{rec.xtalAdvantage}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
