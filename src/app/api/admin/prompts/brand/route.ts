import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    const params = new URLSearchParams({ collection: collection ?? "" })

    const res = await adminFetch(`/api/vendor/brand-prompt?${params.toString()}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Brand prompt GET proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch brand prompt" }, { status: 502 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    const body = await request.json()

    const payload = { brand_prompt: body.brand_prompt, collection }

    let res = await adminFetch("/api/vendor/brand-prompt", {
      method: "PUT",
      body: JSON.stringify(payload),
    })

    // If PUT returns 404, fallback to POST (resource doesn't exist yet)
    if (res.status === 404) {
      res = await adminFetch("/api/vendor/brand-prompt", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    }

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Brand prompt PUT proxy error:", error)
    return NextResponse.json({ error: "Failed to update brand prompt" }, { status: 502 })
  }
}
