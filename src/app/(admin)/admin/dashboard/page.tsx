"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Package,
  DollarSign,
  Sparkles,
  Settings,
  Timer,
} from "lucide-react"
import StatCard from "@/components/admin/StatCard"
import TimeRangeSelector from "@/components/admin/TimeRangeSelector"
import { useCollection } from "@/lib/admin/CollectionContext"
import type { MetricsSummary } from "@/lib/admin/types"

const COST_PER_SEARCH = 0.1

export default function DashboardPage() {
  const { collection } = useCollection()
  const [days, setDays] = useState(30)
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/metrics/summary?days=${days}&collection=${encodeURIComponent(collection)}`)
      if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.status}`)
      const data = await res.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics")
    } finally {
      setLoading(false)
    }
  }, [days, collection])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const totalSearches = metrics?.total_search_requests ?? 0
  const totalProducts = metrics?.total_products ?? 0
  const costPerSearch = COST_PER_SEARCH
  const aspectGens = metrics?.total_aspect_generations ?? 0
  const configUpdates = metrics?.configuration_updates?.total_config_updates ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <TimeRangeSelector value={days} onChange={setDays} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Searches"
          value={totalSearches.toLocaleString()}
          icon={Search}
          loading={loading}
        />
        <StatCard
          label="Total Products"
          value={totalProducts.toLocaleString()}
          icon={Package}
          loading={loading}
        />
        <StatCard
          label="Cost / Search"
          value={`$${costPerSearch.toFixed(2)}`}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          label="Aspect Generations"
          value={aspectGens.toLocaleString()}
          icon={Sparkles}
          loading={loading}
        />
        <StatCard
          label="Config Updates"
          value={configUpdates.toLocaleString()}
          icon={Settings}
          loading={loading}
        />
        <StatCard
          label="Period"
          value={`${days} days`}
          icon={Timer}
          loading={loading}
        />
      </div>

      {metrics && (
        <div className="mt-6 text-xs text-slate-400">
          Data from {new Date(metrics.period_start).toLocaleDateString()} to{" "}
          {new Date(metrics.period_end).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}
