"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Users,
  MousePointerClick,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Repeat,
  Loader2,
  DollarSign,
  Package,
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
  const [warmingUp, setWarmingUp] = useState(false)

  const fetchDashboard = useCallback(async () => {
    if (!collection) return
    setLoading(true)
    setError(null)
    setWarmingUp(false)

    const url = `/api/admin/analytics/dashboard?days=${days}&collection=${encodeURIComponent(collection)}`
    const maxAttempts = 5

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url)
        if (!res.ok) {
          // Transient backend errors — show warming-up state and retry
          if (res.status >= 502 && res.status <= 504) {
            setWarmingUp(true)
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 3000))
              continue
            }
          }
          const body = await res.json().catch(() => null)
          const detail = body?.detail || body?.error || `Status ${res.status}`
          throw new Error(`Failed to fetch: ${detail}`)
        }
        const json: AnalyticsDashboard = await res.json()
        setData(json)
        setWarmingUp(false)
        setLoading(false)
        return
      } catch (err) {
        if (attempt === maxAttempts) {
          setError(err instanceof Error ? err.message : "Failed to load analytics")
        }
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

      {warmingUp && loading && (
        <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-lg flex items-center gap-3 text-sm text-sky-700">
          <Loader2 className="animate-spin shrink-0" size={18} />
          Backend is warming up — analytics will appear shortly. You can navigate to other pages meanwhile.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboard}
            className="ml-4 shrink-0 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 font-medium transition-colors"
          >
            Retry
          </button>
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
        <div className="flex flex-col gap-2">
          <StatCard
            label="Clicks / Search"
            value={s?.clicks_per_search != null ? s.clicks_per_search.toFixed(2) : "0"}
            icon={BarChart3}
            loading={loading}
            compact
          />
          <StatCard
            label="Searches / Session"
            value={s?.searches_per_session != null ? s.searches_per_session.toFixed(1) : "0"}
            icon={Repeat}
            loading={loading}
            compact
          />
        </div>
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
        {data?.attribution && (
          <>
            <StatCard
              label="XTAL Orders"
              value={data.attribution.total_orders.toLocaleString()}
              icon={Package}
              loading={loading}
            />
            <StatCard
              label="XTAL Revenue"
              value={`$${data.attribution.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
              loading={loading}
            />
          </>
        )}
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
          {data.launch_date
            ? `Showing data since launch (${new Date(data.launch_date.includes("T") ? data.launch_date : data.launch_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`
            : `Showing last ${days} days`}
        </div>
      )}
    </div>
  )
}
