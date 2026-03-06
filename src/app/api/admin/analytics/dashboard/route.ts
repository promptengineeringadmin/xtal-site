import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"
import { getAllCustomers } from "@/lib/api/billing-customer"
import { getBillingUsage, getBillingEventLog } from "@/lib/api/billing-usage"
import { getCustomer } from "@/lib/api/billing-customer"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    let days = parseInt(searchParams.get("days") || "30", 10)

    // Clamp days so dashboard never shows pre-launch data (e.g. optimization runs)
    let launchDate: string | undefined
    if (collection) {
      try {
        const customers = await getAllCustomers()
        const customer = customers.find(c => c.collections?.includes(collection))
        if (customer?.launch_date) {
          launchDate = customer.launch_date
          const daysSinceLaunch = Math.ceil(
            (Date.now() - new Date(launchDate).getTime()) / 86_400_000
          )
          if (daysSinceLaunch > 0) {
            days = Math.min(days, daysSinceLaunch)
          }
        }
      } catch (e) {
        // Non-critical — fall through with unclamped days
        console.warn("Failed to look up customer launch_date:", e)
      }
    }

    const params = new URLSearchParams()
    if (collection) params.set("collection", collection)
    params.set("days", String(days))

    const res = await adminFetch(`/api/analytics/dashboard?${params.toString()}`, {
      signal: AbortSignal.timeout(25_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)")
      console.error(`Analytics dashboard backend error: ${res.status} — ${text}`)
      return NextResponse.json(
        { error: `Backend returned ${res.status}`, detail: text },
        { status: res.status >= 500 ? 502 : res.status }
      )
    }

    const data = await res.json()
    if (launchDate) data.launch_date = launchDate

    // Override counts and daily volume with billing log (respects billing_start)
    if (collection) {
      try {
        const customer = await getCustomer(collection)
        const billingStartMs = customer?.billing_start
          ? new Date(customer.billing_start).getTime()
          : 0

        const billingUsage = await getBillingUsage(collection)
        if (data.summary) {
          data.summary.total_searches = billingUsage.search
          data.summary.unique_sessions = billingUsage.search
        }

        // Build daily volume from billing event log
        if (billingStartMs > 0) {
          const events = await getBillingEventLog(collection, billingStartMs, Date.now())
          const dailyMap = new Map<string, { searches: number; clicks: number; add_to_carts: number }>()
          for (const e of events) {
            const date = new Date(e.timestamp).toISOString().split("T")[0]
            const day = dailyMap.get(date) || { searches: 0, clicks: 0, add_to_carts: 0 }
            if (e.type === "search") day.searches++
            dailyMap.set(date, day)
          }
          data.daily_volume = Array.from(dailyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, vol]) => ({ date, ...vol }))
        }
      } catch {
        // Non-critical — fall through with backend data
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Analytics dashboard proxy error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch analytics dashboard" },
      { status: 502 }
    )
  }
}
