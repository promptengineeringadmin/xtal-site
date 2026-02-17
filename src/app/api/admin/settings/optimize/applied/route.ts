import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function POST(request: Request) {
  try {
    const { event_id } = await request.json()
    if (!event_id) {
      return NextResponse.json(
        { error: "event_id is required" },
        { status: 400 }
      )
    }

    const res = await adminFetch(
      `/api/vendor/settings/optimization/${event_id}/applied`,
      { method: "POST" }
    )

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: text || `Backend returned ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Applied tracking proxy error:", error)
    return NextResponse.json(
      { error: "Failed to mark optimization as applied" },
      { status: 502 }
    )
  }
}
