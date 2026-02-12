import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    const params = new URLSearchParams({ collection: collection ?? "" })

    const res = await adminFetch(`/api/vendor/settings?${params.toString()}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Settings GET proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 502 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    const body = await request.json()

    const payload = { ...body, collection }

    let res = await adminFetch("/api/vendor/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    })

    // If PUT returns 404, fallback to POST (resource doesn't exist yet)
    if (res.status === 404) {
      res = await adminFetch("/api/vendor/settings", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    }

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Settings PUT proxy error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 502 })
  }
}
