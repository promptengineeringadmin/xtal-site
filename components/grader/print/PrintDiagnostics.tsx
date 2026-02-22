import type { GraderReport, DimensionScore } from "@/lib/grader/types"

const SCORE_COLORS: Record<string, string> = {
  A: "text-green-600",
  B: "text-blue-600",
  C: "text-slate-600",
  D: "text-amber-600",
  F: "text-red-600",
}

const BAR_COLORS: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-blue-500",
  C: "bg-slate-400",
  D: "bg-amber-500",
  F: "bg-red-500",
}

const VERDICT_COLORS: Record<string, string> = {
  pass: "text-green-700",
  partial: "text-amber-700",
  fail: "text-red-700",
}

function DimensionBlock({ dimension }: { dimension: DimensionScore }) {
  const weightPct = Math.round(dimension.weight * 100)

  return (
    <div className="mb-6 break-inside-avoid">
      {/* Header: label + score + grade + weight */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-bold text-slate-900">{dimension.label}</h3>
          <span className={`text-xl font-bold ${SCORE_COLORS[dimension.grade] || "text-slate-600"}`}>
            {dimension.score}
          </span>
          <span className="text-xs text-slate-400">({dimension.grade})</span>
        </div>
        <span className="text-xs text-slate-400">{weightPct}% weight</span>
      </div>

      {/* Score bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-3" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <div
          className={`h-full rounded-full ${BAR_COLORS[dimension.grade] || "bg-slate-400"}`}
          style={{ width: `${dimension.score}%`, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
        />
      </div>

      {/* Full explanation */}
      <p className="text-xs text-slate-700 leading-relaxed mb-2">{dimension.explanation}</p>

      {/* Failures */}
      {dimension.failures.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-semibold text-slate-500 mb-1">Key Observations:</div>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
            {dimension.failures.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Test queries */}
      {dimension.testQueries && dimension.testQueries.length > 0 && (
        <div className="mt-2">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-1 pr-2 text-slate-500 font-medium">Query</th>
                <th className="text-center py-1 pr-2 text-slate-500 font-medium w-[48px]">Results</th>
                <th className="text-left py-1 pr-2 text-slate-500 font-medium">Top Results</th>
                <th className="text-center py-1 text-slate-500 font-medium w-[44px]">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {dimension.testQueries.map((tq, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-1 pr-2 font-mono text-slate-700">{tq.query}</td>
                  <td className="py-1 pr-2 text-center text-slate-600">{tq.resultCount}</td>
                  <td className="py-1 pr-2 text-slate-600">
                    {tq.topResults && tq.topResults.length > 0
                      ? tq.topResults.slice(0, 3).join(", ")
                      : <span className="text-slate-400 italic">None</span>
                    }
                  </td>
                  <td className={`py-1 text-center font-bold ${VERDICT_COLORS[tq.verdict] || "text-slate-600"}`}>
                    {tq.verdict.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-b border-slate-100 mt-4" />
    </div>
  )
}

export default function PrintDiagnostics({ report }: { report: GraderReport }) {
  return (
    <div className="break-before-page">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Diagnostic Breakdown</h2>
      <p className="text-xs text-slate-500 mb-6">Detailed scoring across 8 key dimensions</p>

      {report.dimensions.map((dim) => (
        <DimensionBlock key={dim.key} dimension={dim} />
      ))}
    </div>
  )
}
