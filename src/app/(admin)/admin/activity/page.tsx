"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RefreshCw } from "lucide-react"
import SearchPipelineCard from "@/components/admin/SearchPipelineCard"
import ActivityEventCard from "@/components/admin/ActivityEventCard"
import DateRangePicker from "@/components/admin/DateRangePicker"
import { useCollection } from "@/lib/admin/CollectionContext"
import {
  correlateEvents,
  buildTimeline,
  type TimelineItem,
} from "@/lib/admin/activityUtils"
import type { MetricEvent, SearchEventData } from "@/lib/admin/types"

type Segment = "searches" | "all" | "system"

const SEGMENT_LABELS: Record<Segment, string> = {
  searches: "Searches",
  all: "All",
  system: "System",
}

/** Map segments to backend event_types filter */
function eventTypesForSegment(segment: Segment): string | undefined {
  switch (segment) {
    case "searches":
      return "search_request,aspect_generation"
    case "system":
      return "product_fetch,brand_prompt_updated,marketing_prompt_updated"
    case "all":
      return undefined // fetch everything
  }
}

export default function ActivityPage() {
  const { collection } = useCollection()
  const [events, setEvents] = useState<MetricEvent[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [segment, setSegment] = useState<Segment>("searches")
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
      const types = eventTypesForSegment(segment)
      if (types) params.set("event_types", types)
      params.set("collection", collection)
      params.set("limit", String(limit))
      if (startDate) params.set("start_date", `${startDate}T00:00:00Z`)
      if (endDate) {
        const endBoundary = new Date(`${endDate}T23:59:59Z`)
        const now = new Date()
        params.set(
          "end_date",
          (endBoundary > now ? now : endBoundary).toISOString()
        )
      }

      const res = await fetch(
        `/api/admin/metrics/events?${params.toString()}`
      )
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      const raw = data.events ?? []
      setEvents(raw)

      const correlated = correlateEvents(raw)
      setTimeline(buildTimeline(correlated))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity")
    } finally {
      setLoading(false)
    }
  }, [segment, limit, startDate, endDate, collection])

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

  // In "searches" view, hide orphan aspect events — only show pipeline cards
  const visibleTimeline =
    segment === "searches"
      ? timeline.filter((item) => item.kind === "search")
      : timeline
  const itemCount = visibleTimeline.length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
          {autoRefresh && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-green-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => (
              <button
                key={s}
                onClick={() => setSegment(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  segment === s
                    ? "bg-white text-xtal-navy shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {SEGMENT_LABELS[s]}
              </button>
            ))}
          </div>

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

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
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
      ) : itemCount === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm">
            No {segment === "searches" ? "search" : ""} events found for this
            period.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-3">
            {itemCount} event{itemCount !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {visibleTimeline.map((item, i) => {
              if (item.kind === "search") {
                const aspectData = item.activity.aspectEvent?.event_data as
                  | { aspects_generated?: string[] }
                  | undefined
                return (
                  <SearchPipelineCard
                    key={`search-${item.activity.timestamp}-${i}`}
                    event={{
                      event_data:
                        item.activity.searchEvent
                          .event_data as SearchEventData,
                      timestamp: item.activity.timestamp,
                    }}
                    aspectsGenerated={aspectData?.aspects_generated}
                  />
                )
              }
              return (
                <ActivityEventCard
                  key={`event-${item.event.timestamp}-${i}`}
                  event={item.event}
                />
              )
            })}
          </div>

          {events.length >= limit && (
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
