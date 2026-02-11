import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL
    const collection = process.env.XTAL_COLLECTION

    if (!backendUrl) {
      return NextResponse.json({ error: "XTAL_BACKEND_URL not configured" }, { status: 500 })
    }

    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, collection }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Search proxy error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 502 })
  }
}
