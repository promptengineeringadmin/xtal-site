import { NextResponse } from "next/server"
import { createFeedback } from "@/lib/search-quality/logger"

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

    // Persist enriched feedback to Redis (fire-and-forget — never blocks response)
    createFeedback({
      query: body.query,
      augmented_query: body.augmented_query || null,
      collection,
      product_id: body.product_id,
      product_title: body.product_title || "",
      product_vendor: body.product_vendor || "",
      product_type: body.product_type || "",
      product_tags: body.product_tags || [],
      product_price: body.product_price ?? 0,
      product_image_url: body.product_image_url || null,
      relevance_score: body.score ?? null,
    }).catch((err) => console.error("Search quality log error:", err))

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
