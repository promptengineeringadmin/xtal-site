"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { DimensionScore, Grade } from "@/lib/grader/types"

interface DimensionBarProps {
  dimension: DimensionScore
  expanded?: boolean
  showDetail?: boolean
}

const GRADE_COLORS: Record<Grade, { bg: string; text: string; bar: string }> = {
  A: { bg: "bg-green-50", text: "text-green-700", bar: "bg-green-500" },
  B: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-500" },
  C: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  D: { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-500" },
  F: { bg: "bg-red-50", text: "text-red-700", bar: "bg-red-500" },
}

export default function DimensionBar({
  dimension,
  expanded: defaultExpanded = false,
  showDetail = false,
}: DimensionBarProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const colors = GRADE_COLORS[dimension.grade]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => showDetail && setExpanded(!expanded)}
        disabled={!showDetail}
        className={`w-full p-5 flex items-center gap-4 ${showDetail ? "cursor-pointer hover:bg-slate-50" : ""} transition-colors`}
      >
        {/* Grade badge */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${colors.bg} ${colors.text}`}
        >
          {dimension.grade}
        </div>

        {/* Label + bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-900">
              {dimension.label}
            </span>
            <span className="text-sm font-bold text-slate-600">
              {dimension.score}/100
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
              style={{ width: `${dimension.score}%` }}
            />
          </div>
        </div>

        {/* Expand icon */}
        {showDetail && (
          <ChevronDown
            className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Expanded detail */}
      {showDetail && expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 animate-slideUp">
          {/* Explanation */}
          <p className="text-sm text-slate-600 mb-4">{dimension.explanation}</p>

          {/* Failures */}
          {dimension.failures.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                Issues Found
              </p>
              <ul className="space-y-1.5">
                {dimension.failures.map((f, i) => (
                  <li
                    key={i}
                    className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Test queries */}
          {dimension.testQueries?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Test Results
              </p>
              <div className="space-y-2">
                {dimension.testQueries.map((tq, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 text-sm bg-slate-50 px-3 py-2 rounded-lg"
                  >
                    <span
                      className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                        tq.verdict === "pass"
                          ? "bg-green-500"
                          : tq.verdict === "partial"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="font-medium text-slate-700">
                        &ldquo;{tq.query}&rdquo;
                      </span>
                      <span className="text-slate-400 ml-2">
                        {tq.resultCount} results
                      </span>
                      {tq.topResults?.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          Top: {tq.topResults.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
