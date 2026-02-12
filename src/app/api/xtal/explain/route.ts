import { NextResponse } from "next/server"
import { getExplainPrompt, DEFAULT_EXPLAIN_SYSTEM_PROMPT } from "@/lib/admin/explain-prompt"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL
    const collection = process.env.XTAL_COLLECTION

    if (!backendUrl) {
      return NextResponse.json({ error: "XTAL_BACKEND_URL not configured" }, { status: 500 })
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
      body: JSON.stringify({ ...body, collection, ...(system_prompt && { system_prompt }) }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Explain proxy error:", error)
    return NextResponse.json({ error: "Explain failed" }, { status: 502 })
  }
}
