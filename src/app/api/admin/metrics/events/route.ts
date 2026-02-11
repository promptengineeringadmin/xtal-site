import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION

    const params = new URLSearchParams()

    // event_types can appear multiple times — forward each occurrence
    const eventTypes = searchParams.getAll("event_types")
    for (const et of eventTypes) {
      params.append("event_types", et)
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
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Metrics events proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics events" }, { status: 502 })
  }
}
