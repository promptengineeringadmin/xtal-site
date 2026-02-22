import { NextResponse } from "next/server"
import { corsHeaders, handleOptions } from "@/lib/api/cors"
import { COLLECTIONS } from "@/lib/admin/collections"
import { logProxyTiming } from "@/lib/admin/proxy-timing"

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

    // Extract geo headers from Vercel
    const geoCountry = request.headers.get("x-vercel-ip-country") || undefined
    const geoRegion = request.headers.get("x-vercel-ip-country-region") || undefined

    const enrichedBody = {
      query: body.query,
      collection,
      filters: body.filters,
      page: body.page,
      k: body.k,
      limit: body.limit,
      selected_aspects: body.selected_aspects,
      search_context: body.search_context,
      facet_filters: body.facet_filters,
      price_range: body.price_range,
      geo_country: geoCountry,
      geo_region: geoRegion,
    }

    const t0 = Date.now()
    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedBody),
      signal: AbortSignal.timeout(8000),
    })
    const backendMs = Date.now() - t0

    const data = await res.json()

    // Fire-and-forget: log proxy timing to Redis for admin drilldowns
    logProxyTiming({
      query: (body.query ?? "").toLowerCase(),
      collection,
      timestamp: t0,
      route: "search",
      redisMs: 0,
      backendMs,
      totalMs: backendMs,
    })

    return NextResponse.json(data, {
      status: res.status,
      headers: { ...corsHeaders(), "Server-Timing": `backend;dur=${backendMs}` },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Backend timeout" },
        { status: 504, headers: corsHeaders() }
      )
    }
    console.error("Search proxy error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 502, headers: corsHeaders() }
    )
  }
}
