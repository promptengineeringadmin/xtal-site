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

    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)")
      console.error(`Analytics dashboard backend error: ${res.status} — ${text}`)
      return NextResponse.json(
        { error: `Backend returned ${res.status}`, detail: text },
        { status: res.status >= 500 ? 502 : res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Analytics dashboard proxy error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch analytics dashboard" },
      { status: 502 }
    )
  }
}
