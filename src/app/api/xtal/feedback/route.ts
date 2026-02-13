import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL
    const collection = body.collection || process.env.XTAL_COLLECTION

    if (!backendUrl) {
      return NextResponse.json({ error: "XTAL_BACKEND_URL not configured" }, { status: 500 })
    }

    // Validate required fields
    if (!body.query || !body.product_id || !body.action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const res = await fetch(`${backendUrl}/api/feedback/relevance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, collection }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Feedback proxy error:", error)
    return NextResponse.json({ error: "Feedback submission failed" }, { status: 502 })
  }
}
