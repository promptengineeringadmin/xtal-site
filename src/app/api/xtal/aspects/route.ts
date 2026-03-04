import { NextResponse } from "next/server"
import { getAspectsPrompt, DEFAULT_ASPECTS_SYSTEM_PROMPT } from "@/lib/admin/aspects-prompt"
import { getStoreType, getAspectsEnabled } from "@/lib/admin/admin-settings"
import { corsHeaders, handleOptions } from "@/lib/api/cors"
import { isValidCollection } from "@/lib/admin/demo-collections"

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
      signal: AbortSignal.timeout(5000),
    })
    const backendMs = Date.now() - t1

    const data = await res.json()
    return NextResponse.json({ ...data, aspects_enabled: aspectsEnabled }, {
      status: res.status,
      headers: { ...cors, "Server-Timing": `redis;dur=${redisMs}, backend;dur=${backendMs}` },
    })
  } catch (error: unknown) {
    const cors = await corsHeaders(undefined, origin)
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Backend timeout" },
        { status: 504, headers: cors }
      )
    }
    console.error("Aspects proxy error:", error)
    return NextResponse.json(
      { error: "Aspects failed" },
      { status: 502, headers: cors }
    )
  }
}
