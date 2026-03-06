import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"
import { getProxyTimings } from "@/lib/admin/proxy-timing"
import { getBillingEventLog } from "@/lib/api/billing-usage"
import { getCustomer } from "@/lib/api/billing-customer"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection")
    if (!collection) {
      return NextResponse.json({ error: "collection required" }, { status: 400 })
    }

    const hours = parseInt(searchParams.get("hours") || "24", 10)
    const now = Date.now()
    const windowStart = now - hours * 60 * 60 * 1000

    // Get customer billing_start
    const customer = await getCustomer(collection)
    const billingStartMs = customer?.billing_start
      ? new Date(customer.billing_start).getTime()
      : 0
    const effectiveStart = Math.max(windowStart, billingStartMs)

    // Query all three stores in parallel
    const backendParams = new URLSearchParams({
      collection,
      event_types: "search_request",
      days: String(Math.ceil(hours / 24)),
    })

    const [backendRes, proxyTimings, billingEvents] = await Promise.all([
      adminFetch(`/api/metrics/events?${backendParams.toString()}`)
        .then((r) => r.json())
        .catch(() => ({ events: [] })),
      getProxyTimings(collection, effectiveStart, now),
      getBillingEventLog(collection, effectiveStart, now),
    ])

    const backendEvents = (backendRes.events ?? []).filter(
      (e: { timestamp: string }) =>
        new Date(e.timestamp).getTime() >= effectiveStart
    )

    // Billing breakdown by type
    const billingByType: Record<string, number> = {}
    for (const e of billingEvents) {
      billingByType[e.type] = (billingByType[e.type] || 0) + 1
    }

    // Hourly breakdown
    const hourlyMap = new Map<
      string,
      { backend: number; proxy: number; billing: number }
    >()

    for (const e of backendEvents) {
      const h = new Date(e.timestamp).toISOString().slice(0, 13)
      const entry = hourlyMap.get(h) || { backend: 0, proxy: 0, billing: 0 }
      entry.backend++
      hourlyMap.set(h, entry)
    }
    for (const t of proxyTimings) {
      const h = new Date(t.timestamp).toISOString().slice(0, 13)
      const entry = hourlyMap.get(h) || { backend: 0, proxy: 0, billing: 0 }
      entry.proxy++
      hourlyMap.set(h, entry)
    }
    for (const e of billingEvents) {
      const h = new Date(e.timestamp).toISOString().slice(0, 13)
      const entry = hourlyMap.get(h) || { backend: 0, proxy: 0, billing: 0 }
      entry.billing++
      hourlyMap.set(h, entry)
    }

    const hourly = Array.from(hourlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, counts]) => ({ hour, ...counts }))

    return NextResponse.json({
      collection,
      window_hours: hours,
      billing_start: customer?.billing_start || null,
      effective_start: new Date(effectiveStart).toISOString(),
      counts: {
        backend_search_events: backendEvents.length,
        proxy_timing_records: proxyTimings.length,
        billing_log_entries: billingEvents.length,
      },
      billing_by_type: billingByType,
      hourly,
    })
  } catch (error) {
    console.error("Billing audit error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Audit failed" },
      { status: 500 }
    )
  }
}
