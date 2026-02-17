import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    const days = searchParams.get("days") || "30"

    const params = new URLSearchParams()
    if (collection) params.set("collection", collection)
    params.set("days", days)

    const res = await adminFetch(`/api/analytics/dashboard?${params.toString()}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Analytics dashboard proxy error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics dashboard" },
      { status: 502 }
    )
  }
}
