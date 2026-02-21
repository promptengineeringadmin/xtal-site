import { NextResponse } from "next/server"
import { getRandomExplainPrompt } from "@/lib/admin/explain-prompt"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL
    const collection = body.collection || process.env.XTAL_COLLECTION

    if (!backendUrl) {
      return NextResponse.json({ error: "XTAL_BACKEND_URL not configured" }, { status: 500 })
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

    const res = await fetch(`${backendUrl}/api/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, collection, ...(system_prompt && { system_prompt }) }),
    })

    const data = await res.json()
    return NextResponse.json(
      { ...data, prompt_hash },
      { status: res.status }
    )
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Backend timeout" },
        { status: 504 }
      )
    }
    console.error("Explain proxy error:", error)
    return NextResponse.json({ error: "Explain failed" }, { status: 502 })
  }
}
