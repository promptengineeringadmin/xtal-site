"use client"

import { useState, useEffect, useCallback } from "react"
import EventsTable from "@/components/admin/EventsTable"
import DateRangePicker from "@/components/admin/DateRangePicker"
import type { MetricEvent, EventType } from "@/lib/admin/types"
import { EVENT_TYPE_LABELS } from "@/lib/admin/types"

const ALL_EVENT_TYPES: EventType[] = [
  "search_request",
  "aspect_generation",
  "product_fetch",
  "brand_prompt_updated",
  "marketing_prompt_updated",
]

export default function EventsPage() {
  const [events, setEvents] = useState<MetricEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>("all")
  const [limit, setLimit] = useState(50)

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const [startDate, setStartDate] = useState(
    weekAgo.toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0])

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterType !== "all") {
        params.set("event_types", filterType)
      }
      params.set("limit", String(limit))
      if (startDate) params.set("start_date", startDate)
      if (endDate) params.set("end_date", endDate)

      const res = await fetch(`/api/admin/metrics/events?${params.toString()}`)
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setEvents(data.events ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }, [filterType, limit, startDate, endDate])

  useEffect(() => {
    setLoading(true)
    fetchEvents()
  }, [fetchEvents])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Event History</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-600 outline-none focus:border-xtal-navy"
          >
            <option value="all">All Types</option>
            {ALL_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s)
              setEndDate(e)
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <EventsTable events={events} loading={loading} />

      {!loading && events.length >= limit && (
        <button
          onClick={() => setLimit((l) => l + 50)}
          className="mt-4 w-full py-2.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Load more
        </button>
      )}
    </div>
  )
}
