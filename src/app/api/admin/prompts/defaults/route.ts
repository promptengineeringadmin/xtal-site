import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function GET() {
  try {
    const collection = process.env.XTAL_COLLECTION
    const params = new URLSearchParams({ collection: collection ?? "" })

    const res = await adminFetch(`/api/vendor/prompt-defaults?${params.toString()}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Prompt defaults proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch prompt defaults" }, { status: 502 })
  }
}
