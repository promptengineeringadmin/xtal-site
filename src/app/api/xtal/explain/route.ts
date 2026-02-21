import { NextResponse } from "next/server"
import { getExplainPrompt, DEFAULT_EXPLAIN_SYSTEM_PROMPT } from "@/lib/admin/explain-prompt"
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

    // Fetch custom explain prompt from Redis (if one exists)
    let system_prompt: string | undefined
    try {
      const prompt = await getExplainPrompt()
      if (prompt !== DEFAULT_EXPLAIN_SYSTEM_PROMPT) {
        system_prompt = prompt
      }
    } catch {
      // Redis unavailable — proceed without custom prompt
    }

    const res = await fetch(`${backendUrl}/api/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: body.query,
        collection,
        product_id: body.product_id,
        score: body.score,
        ...(system_prompt && { system_prompt }),
      }),
      signal: AbortSignal.timeout(5000),
    })

    const data = await res.json()
    return NextResponse.json(data, {
      status: res.status,
      headers: corsHeaders(),
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Backend timeout" },
        { status: 504, headers: corsHeaders() }
      )
    }
    console.error("Explain proxy error:", error)
    return NextResponse.json(
      { error: "Explain failed" },
      { status: 502, headers: corsHeaders() }
    )
  }
}
