import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection =
      searchParams.get("collection") || process.env.XTAL_COLLECTION
    const params = new URLSearchParams({ collection: collection ?? "" })

    const body = await request.json().catch(() => ({}))

    const res = await adminFetch(
      `/api/vendor/settings/optimize?${params.toString()}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
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
    console.error("Optimize proxy error:", error)
    return NextResponse.json(
      { error: "Failed to reach optimization service" },
      { status: 502 }
    )
  }
}
