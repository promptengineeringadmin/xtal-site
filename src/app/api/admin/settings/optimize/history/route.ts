import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection =
      searchParams.get("collection") || process.env.XTAL_COLLECTION

    const params = new URLSearchParams({
      event_types: "weight_optimization",
      days: "90",
      limit: "50",
    })
    if (collection) params.set("collection", collection)

    const res = await adminFetch(`/api/metrics/events?${params.toString()}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Optimization history proxy error:", error)
    return NextResponse.json(
      { error: "Failed to fetch optimization history" },
      { status: 502 }
    )
  }
}
