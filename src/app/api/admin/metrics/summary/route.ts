import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = process.env.XTAL_COLLECTION

    const params = new URLSearchParams()
    const days = searchParams.get("days")
    if (days) params.set("days", days)
    params.set("collection", collection ?? "")

    const res = await adminFetch(`/api/metrics/summary?${params.toString()}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Metrics summary proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics summary" }, { status: 502 })
  }
}
