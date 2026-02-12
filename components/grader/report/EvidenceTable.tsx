"use client"

import type { GraderReport } from "@/lib/grader/types"
import { buildEvidenceRows } from "@/lib/grader/evidence"

interface EvidenceTableProps {
  report: GraderReport
  maxRows?: number // if set, truncate and show blur overlay
}

export default function EvidenceTable({ report, maxRows }: EvidenceTableProps) {
  const evidenceRows = buildEvidenceRows(report)
  const visibleRows = maxRows ? evidenceRows.slice(0, maxRows) : evidenceRows
  const hasMore = maxRows && evidenceRows.length > maxRows

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden print:break-inside-avoid">
      {/* Header Section */}
      <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-5">
        <h3 className="text-xl font-bold text-[#0F172A]">Queries We Tested</h3>
        <p className="text-sm text-slate-600 mt-1">
          We ran {evidenceRows.length} queries designed to reflect real shopper
          behavior to generate your score.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase font-bold tracking-wider text-slate-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs uppercase font-bold tracking-wider text-slate-500">
                Test Query
              </th>
              <th className="px-6 py-3 text-left text-xs uppercase font-bold tracking-wider text-slate-500">
                Expected Behavior
              </th>
              <th className="px-6 py-3 text-right text-xs uppercase font-bold tracking-wider text-slate-500">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((row, idx) => (
              <tr
                key={idx}
                className={row.verdict === "fail" ? "bg-red-50/30" : ""}
              >
                <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-400 text-xs uppercase">
                  {row.categoryLabel}
                </td>
                <td className="px-6 py-4 font-mono text-[#0F172A]">
                  &quot;{row.query}&quot;
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {row.expectedBehavior}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  {row.verdict === "pass" && (
                    <span className="font-bold text-green-500">PASS</span>
                  )}
                  {row.verdict === "partial" && (
                    <span className="font-bold text-amber-500">PARTIAL</span>
                  )}
                  {row.verdict === "fail" && (
                    <span className="font-bold text-red-500">FAIL</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Blur Overlay for Truncated Rows */}
      {hasMore && (
        <div className="relative">
          {/* Hidden rows for blur effect */}
          <div className="opacity-50 pointer-events-none">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                {evidenceRows.slice(maxRows, maxRows + 3).map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-400 text-xs uppercase">
                      {row.categoryLabel}
                    </td>
                    <td className="px-6 py-4 font-mono text-[#0F172A]">
                      &quot;{row.query}&quot;
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.expectedBehavior}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-400">---</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white backdrop-blur-sm flex items-center justify-center">
            <p className="text-center text-slate-700 font-semibold px-6 py-3 bg-white/90 rounded-lg shadow-sm">
              Unlock your full report to see all test results
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
