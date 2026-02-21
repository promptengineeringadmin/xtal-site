import { NextResponse } from "next/server"
import { getAspectsPrompt, DEFAULT_ASPECTS_SYSTEM_PROMPT } from "@/lib/admin/aspects-prompt"
import { getStoreType, getAspectsEnabled } from "@/lib/admin/admin-settings"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL
    const collection = body.collection || process.env.XTAL_COLLECTION

    if (!backendUrl) {
      return NextResponse.json({ error: "XTAL_BACKEND_URL not configured" }, { status: 500 })
    }

    // Fetch aspects prompt, store type, and enabled flag from Redis
    const t0 = Date.now()
    const [rawPrompt, storeType, aspectsEnabled] = await Promise.all([
      getAspectsPrompt(collection || "default"),
      getStoreType(collection || "default"),
      getAspectsEnabled(collection || "default"),
    ])
    const redisMs = Date.now() - t0

    // Interpolate {store_type} into the prompt
    const interpolated = rawPrompt.replaceAll("{store_type}", storeType)

    // Only send system_prompt if prompt or store_type has been customized
    const isCustom = rawPrompt !== DEFAULT_ASPECTS_SYSTEM_PROMPT || storeType !== "online retailer"
    const payload = {
      query: body.query,
      collection,
      selected_aspects: body.selected_aspects,
      ...(isCustom && { system_prompt: interpolated }),
    }

    const t1 = Date.now()
    const res = await fetch(`${backendUrl}/api/aspects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const backendMs = Date.now() - t1

    const data = await res.json()
    return NextResponse.json({ ...data, aspects_enabled: aspectsEnabled }, {
      status: res.status,
      headers: { "Server-Timing": `redis;dur=${redisMs}, backend;dur=${backendMs}` },
    })
  } catch (error) {
    console.error("Aspects proxy error:", error)
    return NextResponse.json({ error: "Aspects failed" }, { status: 502 })
  }
}
