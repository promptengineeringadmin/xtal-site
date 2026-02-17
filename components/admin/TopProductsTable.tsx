"use client"

import type { TopProduct } from "@/lib/admin/types"

interface TopProductsTableProps {
  data: TopProduct[]
  loading?: boolean
}

export default function TopProductsTable({ data, loading }: TopProductsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Clicked Products</h3>
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
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Clicked Products</h3>
      {data.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          No click data yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">Product</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Clicks</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">Queries</th>
                <th className="text-right py-2 pl-3 text-slate-500 font-medium">Add to Cart</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pr-4 text-slate-800 font-medium truncate max-w-[220px]" title={row.product_title}>
                    {row.product_title}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                    {row.clicks.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                    {row.from_queries.toLocaleString()}
                  </td>
                  <td className="py-2.5 pl-3 text-right text-slate-600 tabular-nums">
                    {row.add_to_carts.toLocaleString()}
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
