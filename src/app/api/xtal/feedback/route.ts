import { NextResponse } from "next/server"
import { corsHeaders, handleOptions } from "@/lib/api/cors"
import { isValidCollection } from "@/lib/admin/demo-collections"
import { createFeedback } from "@/lib/search-quality/logger"

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request: Request) {
  const origin = request.headers.get("Origin")

  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL
    const collection = body.collection || process.env.XTAL_COLLECTION
    const cors = await corsHeaders(collection, origin)

    if (!backendUrl) {
      return NextResponse.json(
        { error: "XTAL_BACKEND_URL not configured" },
        { status: 500, headers: cors }
      )
    }

    if (!(await isValidCollection(collection))) {
      return NextResponse.json(
        { error: "Invalid collection" },
        { status: 400, headers: cors }
      )
    }

    // Validate required fields
    if (!body.query || !body.product_id || !body.action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: cors }
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
    return NextResponse.json(data, {
      status: res.status,
      headers: cors,
    })
  } catch (error: unknown) {
    const cors = await corsHeaders(undefined, origin)
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Backend timeout" },
        { status: 504, headers: cors }
      )
    }
    console.error("Feedback proxy error:", error)
    return NextResponse.json(
      { error: "Feedback submission failed" },
      { status: 502, headers: cors }
    )
  }
}
