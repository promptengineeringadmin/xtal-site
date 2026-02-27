"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Users,
  MousePointerClick,
  TrendingUp,
  ShoppingCart,
  Target,
} from "lucide-react"
import StatCard from "@/components/admin/StatCard"
import TimeRangeSelector from "@/components/admin/TimeRangeSelector"
import VolumeChart from "@/components/admin/VolumeChart"
import TopQueriesTable from "@/components/admin/TopQueriesTable"
import TopProductsTable from "@/components/admin/TopProductsTable"
import { useCollection } from "@/lib/admin/CollectionContext"
import type { AnalyticsDashboard } from "@/lib/admin/types"

export default function DashboardPage() {
  const { collection } = useCollection()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    if (!collection) return
    setLoading(true)
    setError(null)

    const url = `/api/admin/analytics/dashboard?days=${days}&collection=${encodeURIComponent(collection)}`
    const maxAttempts = 2

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url)
        if (!res.ok) {
          // Retry once on transient backend errors
          if (attempt < maxAttempts && res.status >= 502 && res.status <= 504) {
            await new Promise((r) => setTimeout(r, 1000))
            continue
          }
          const body = await res.json().catch(() => null)
          const detail = body?.detail || body?.error || `Status ${res.status}`
          throw new Error(`Failed to fetch: ${detail}`)
        }
        const json: AnalyticsDashboard = await res.json()
        setData(json)
        setLoading(false)
        return
      } catch (err) {
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000))
          continue
        }
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      }
    }
    setLoading(false)
  }, [days, collection])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const s = data?.summary
  const hasData = s && s.total_searches > 0

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <TimeRangeSelector value={days} onChange={setDays} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasData && (
        <div className="mb-6 p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <Search className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-slate-500 text-sm">
            No search data yet. Once customers start using XTAL Search, analytics will appear here.
          </p>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Searches"
          value={s?.total_searches?.toLocaleString() ?? "0"}
          icon={Search}
          loading={loading}
        />
        <StatCard
          label="Unique Sessions"
          value={s?.unique_sessions?.toLocaleString() ?? "0"}
          icon={Users}
          loading={loading}
        />
        <StatCard
          label="Click-Through Rate"
          value={s ? `${(s.click_through_rate * 100).toFixed(1)}%` : "0%"}
          icon={MousePointerClick}
          loading={loading}
        />
        <StatCard
          label="Avg Click Position"
          value={s?.avg_click_position?.toFixed(1) ?? "0"}
          icon={Target}
          loading={loading}
        />
        <StatCard
          label="Add to Cart"
          value={s?.add_to_cart_from_search?.toLocaleString() ?? "0"}
          icon={ShoppingCart}
          loading={loading}
        />
        <StatCard
          label="Search Conversion"
          value={s ? `${(s.search_conversion_rate * 100).toFixed(2)}%` : "0%"}
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Volume chart */}
      <div className="mb-6">
        <VolumeChart data={data?.daily_volume ?? []} loading={loading} />
      </div>

      {/* Tables side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopQueriesTable data={data?.top_queries ?? []} loading={loading} />
        <TopProductsTable data={data?.top_products ?? []} loading={loading} />
      </div>

      {data && !loading && (
        <div className="mt-6 text-xs text-slate-400">
          Showing last {days} days
        </div>
      )}
    </div>
  )
}
