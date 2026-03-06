import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"
import { getAllCustomers } from "@/lib/api/billing-customer"
import { getBillingUsage } from "@/lib/api/billing-usage"

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

    // Override total_searches with billing log count (respects billing_start)
    if (collection) {
      try {
        const billingUsage = await getBillingUsage(collection)
        if (data.summary) {
          data.summary.total_searches = billingUsage.search
        }
      } catch {
        // Non-critical — fall through with backend count
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
