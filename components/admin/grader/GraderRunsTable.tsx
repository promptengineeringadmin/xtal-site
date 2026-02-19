"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCw, Play, Loader2 } from "lucide-react"
import type { GraderRunLog, Grade } from "@/lib/grader/types"

const GRADE_COLORS: Record<Grade, string> = {
  A: "bg-green-100 text-green-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-orange-100 text-orange-700",
  F: "bg-red-100 text-red-700",
}

const STATUS_STYLES: Record<string, string> = {
  running: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
}

export default function GraderRunsTable() {
  const [runs, setRuns] = useState<GraderRunLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRuns = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/grader/admin/runs?limit=50")
      if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`)
      const data = await res.json()
      setRuns(data.runs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Recent Runs</h2>
        <button
          onClick={fetchRuns}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 sticky left-0 bg-slate-50 z-10">Store</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Platform</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Score</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Source</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading runs...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No grading runs yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <Link
                        href={`/admin/grader/${run.id}`}
                        className="font-medium text-xtal-navy hover:text-blue-600 transition-colors"
                      >
                        {run.storeName || run.storeUrl}
                      </Link>
                      <div className="text-xs text-slate-400 truncate max-w-[200px]">{run.storeUrl}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-500 uppercase">{run.platform}</span>
                    </td>
                    <td className="px-4 py-3">
                      {run.report ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{run.report.overallScore}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${GRADE_COLORS[run.report.overallGrade]}`}>
                            {run.report.overallGrade}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[run.status] || "bg-slate-100 text-slate-600"}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{run.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {new Date(run.startedAt).toLocaleDateString()}{" "}
                        {new Date(run.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
