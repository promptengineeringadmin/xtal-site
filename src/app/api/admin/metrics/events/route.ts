import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"
import { getProxyTimings, matchProxyTiming } from "@/lib/admin/proxy-timing"
import type { MetricEvent, SearchEventData } from "@/lib/admin/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION

    const params = new URLSearchParams()

    // event_types may arrive comma-separated — split into repeated params
    // so FastAPI can parse them as list[EventType]
    const eventTypes = searchParams.getAll("event_types")
    for (const et of eventTypes) {
      for (const single of et.split(",")) {
        params.append("event_types", single.trim())
      }
    }

    const startDate = searchParams.get("start_date")
    if (startDate) params.set("start_date", startDate)

    const endDate = searchParams.get("end_date")
    if (endDate) params.set("end_date", endDate)

    const days = searchParams.get("days")
    if (days) params.set("days", days)

    const limit = searchParams.get("limit")
    if (limit) params.set("limit", limit)

    params.set("collection", collection ?? "")

    const res = await adminFetch(`/api/metrics/events?${params.toString()}`)
    const data = await res.json()

    // Enrich search_request events with proxy timing from Redis
    const events: MetricEvent[] = data.events ?? []
    if (events.length > 0 && collection) {
      try {
        const timestamps = events.map((e) => new Date(e.timestamp).getTime())
        const minTs = Math.min(...timestamps) - 10_000
        const maxTs = Math.max(...timestamps) + 10_000

        const timings = await getProxyTimings(collection, minTs, maxTs)

        if (timings.length > 0) {
          const consumed = new Set<number>()

          for (const event of events) {
            if (event.event_type !== "search_request") continue
            const sd = event.event_data as SearchEventData
            const eventTs = new Date(event.timestamp).getTime()

            const match = matchProxyTiming(
              timings,
              sd.user_query ?? "",
              eventTs,
              consumed,
            )

            if (match) {
              ;(event.event_data as Record<string, unknown>).proxy_timing = {
                redis_ms: match.redisMs,
                backend_ms: match.backendMs,
                total_ms: match.totalMs,
                route: match.route,
                aspects_failed: match.aspectsFailed,
              }
            }
          }
        }
      } catch {
        // Redis unavailable — return events without enrichment
      }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Metrics events proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics events" }, { status: 502 })
  }
}
