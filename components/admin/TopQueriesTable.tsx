"use client"

import type { TopQuery } from "@/lib/admin/types"

interface TopQueriesTableProps {
  data: TopQuery[]
  loading?: boolean
}

export default function TopQueriesTable({ data, loading }: TopQueriesTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Queries</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Queries</h3>
      {data.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          No search data yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">Query</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Searches</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Clicks</th>
                <th className="text-right py-2 pl-3 text-slate-500 font-medium">CTR</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pr-4 text-slate-800 font-medium truncate max-w-[200px]">
                    {row.query}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                    {row.searches.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                    {row.clicks.toLocaleString()}
                  </td>
                  <td className="py-2.5 pl-3 text-right text-slate-600 tabular-nums">
                    {(row.ctr * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
