import { NextResponse } from "next/server"
import { createFeedback } from "@/lib/search-quality/logger"
import { corsHeaders, handleOptions } from "@/lib/api/cors"
import { COLLECTIONS } from "@/lib/admin/collections"

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL
    const collection = body.collection || process.env.XTAL_COLLECTION

    if (!backendUrl) {
      return NextResponse.json(
        { error: "XTAL_BACKEND_URL not configured" },
        { status: 500, headers: corsHeaders() }
      )
    }

    if (!COLLECTIONS.some((c) => c.id === collection)) {
      return NextResponse.json(
        { error: "Invalid collection" },
        { status: 400, headers: corsHeaders() }
      )
    }

    // Validate required fields
    if (!body.query || !body.product_id || !body.action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders() }
      )
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
      prompt_hash: body.prompt_hash || null,
    }).catch((err) => console.error("Search quality log error:", err))

    const res = await fetch(`${backendUrl}/api/feedback/relevance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: body.query,
        collection,
        product_id: body.product_id,
        action: body.action,
        score: body.score,
        ...(body.prompt_hash && { prompt_hash: body.prompt_hash }),
      }),
      signal: AbortSignal.timeout(3000),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status, headers: corsHeaders() })
  } catch (error) {
    console.error("Feedback proxy error:", error)
    return NextResponse.json(
      { error: "Feedback submission failed" },
      { status: 502, headers: corsHeaders() }
    )
  }
}
