import type { GraderReport } from "@/lib/grader/types"
import { buildEvidenceRows } from "@/lib/grader/evidence"

const VERDICT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pass: { bg: "bg-green-50", text: "text-green-700", label: "PASS" },
  partial: { bg: "bg-amber-50", text: "text-amber-700", label: "PARTIAL" },
  fail: { bg: "bg-red-50", text: "text-red-700", label: "FAIL" },
}

export default function PrintEvidenceTable({ report }: { report: GraderReport }) {
  const rows = buildEvidenceRows(report)

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Queries Tested</h2>
      <p className="text-xs text-slate-500 mb-4">{rows.length} search queries evaluated against {report.storeName}</p>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-300">
            <th className="text-left py-2 pr-2 text-slate-600 font-semibold w-[72px]">Type</th>
            <th className="text-left py-2 pr-2 text-slate-600 font-semibold">Query</th>
            <th className="text-center py-2 pr-2 text-slate-600 font-semibold w-[52px]">Results</th>
            <th className="text-left py-2 pr-2 text-slate-600 font-semibold">Top Results</th>
            <th className="text-center py-2 text-slate-600 font-semibold w-[56px]">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const verdict = VERDICT_STYLES[row.verdict] || VERDICT_STYLES.fail
            const rowBg = row.verdict === "fail" ? "bg-red-50/40" : ""

            return (
              <tr key={i} className={`border-b border-slate-100 ${rowBg}`} style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                <td className="py-2 pr-2 text-slate-500">{row.categoryLabel}</td>
                <td className="py-2 pr-2 font-mono text-slate-800">{row.query}</td>
                <td className="py-2 pr-2 text-center text-slate-600">{row.resultCount}</td>
                <td className="py-2 pr-2 text-slate-600">
                  {row.topResults.length > 0
                    ? row.topResults.slice(0, 3).join(", ")
                    : <span className="text-slate-400 italic">No results</span>
                  }
                </td>
                <td className="py-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${verdict.bg} ${verdict.text}`} style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                    {verdict.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
