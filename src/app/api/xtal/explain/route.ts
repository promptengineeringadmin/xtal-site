import { NextResponse } from "next/server"
import { getRandomExplainPrompt } from "@/lib/admin/explain-prompt"
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

    // Pick a random prompt from the pool
    let system_prompt: string
    let prompt_hash: string
    try {
      const picked = await getRandomExplainPrompt()
      system_prompt = picked.content
      prompt_hash = picked.prompt_hash
    } catch {
      // Redis unavailable — proceed without custom prompt (backend uses its default)
      system_prompt = ""
      prompt_hash = "default"
    }

    // Inject date context so the model can reason about seasonality
    if (system_prompt) {
      const now = new Date()
      const dateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      const month = now.getMonth()
      const season =
        month <= 1 || month === 11
          ? "winter"
          : month <= 4
            ? "spring"
            : month <= 7
              ? "summer"
              : "fall"
      system_prompt = `Today is ${dateStr} (${season}). If this product is seasonal, consider whether it fits this time of year.\n\n${system_prompt}`
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
      signal: AbortSignal.timeout(9000),
    })

    const data = await res.json()
    return NextResponse.json(
      { ...data, prompt_hash },
      { status: res.status, headers: corsHeaders() }
    )
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
