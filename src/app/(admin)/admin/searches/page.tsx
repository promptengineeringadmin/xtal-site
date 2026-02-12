"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RefreshCw } from "lucide-react"
import SearchPipelineCard from "@/components/admin/SearchPipelineCard"
import DateRangePicker from "@/components/admin/DateRangePicker"
import { useCollection } from "@/lib/admin/CollectionContext"
import type { MetricEvent, SearchEventData } from "@/lib/admin/types"

export default function SearchesPage() {
  const { collection } = useCollection()
  const [events, setEvents] = useState<MetricEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [limit, setLimit] = useState(50)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const [startDate, setStartDate] = useState(
    weekAgo.toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0])

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set("event_types", "search_request")
      params.set("collection", collection)
      params.set("limit", String(limit))
      if (startDate) params.set("start_date", `${startDate}T00:00:00Z`)
      if (endDate) {
        const endBoundary = new Date(`${endDate}T23:59:59Z`)
        const now = new Date()
        params.set("end_date", (endBoundary > now ? now : endBoundary).toISOString())
      }

      const res = await fetch(`/api/admin/metrics/events?${params.toString()}`)
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setEvents(data.events ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load searches")
    } finally {
      setLoading(false)
    }
  }, [limit, startDate, endDate, collection])

  useEffect(() => {
    setLoading(true)
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchEvents, 30000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, fetchEvents])

  const searchEvents = events.filter(
    (e) => e.event_type === "search_request"
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Search Monitor</h1>
        <div className="flex items-center gap-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s)
              setEndDate(e)
            }}
          />
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              autoRefresh
                ? "bg-xtal-navy text-white border-xtal-navy"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin" : ""}`}
            />
            Auto
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"
            >
              <div className="h-5 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mt-2" />
            </div>
          ))}
        </div>
      ) : searchEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm">
            No search events found for this period.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-3">
            {searchEvents.length} search{searchEvents.length !== 1 ? "es" : ""}
          </p>
          <div className="space-y-3">
            {searchEvents.map((event, i) => (
              <SearchPipelineCard
                key={`${event.timestamp}-${i}`}
                event={{
                  event_data: event.event_data as SearchEventData,
                  timestamp: event.timestamp,
                }}
              />
            ))}
          </div>
          {searchEvents.length >= limit && (
            <button
              onClick={() => setLimit((l) => l + 50)}
              className="mt-4 w-full py-2.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Load more
            </button>
          )}
        </>
      )}
    </div>
  )
}
