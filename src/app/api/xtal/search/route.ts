import { NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { corsHeaders, handleOptions } from "@/lib/api/cors"
import { isValidCollection } from "@/lib/admin/demo-collections"
import { logProxyTiming } from "@/lib/admin/proxy-timing"
import { trackBillableEvent } from "@/lib/api/billing-usage"

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
      signal: AbortSignal.timeout(12000),
    })
    const backendMs = Date.now() - t0

    const data = await res.json()

    // Background: log proxy timing to Redis for admin drilldowns
    waitUntil(logProxyTiming({
      query: (body.query ?? "").toLowerCase(),
      collection,
      timestamp: t0,
      route: "search",
      redisMs: 0,
      backendMs,
      totalMs: backendMs,
    }))

    // Background: track billable events (skip demo page searches)
    if (body.is_demo) {
      // Demo page — no billing
    } else if (!body.search_context) {
      // New search query — billable
      waitUntil(trackBillableEvent(collection, {
        type: "search",
        query: body.query ?? "",
        status: res.status,
        latency_ms: backendMs,
        result_count: data.results?.length,
      }))
    } else if (body.selected_aspects?.length) {
      // Aspect pill click (runs new search) — billable
      waitUntil(trackBillableEvent(collection, {
        type: "aspect_click",
        query: body.query ?? "",
        status: res.status,
        latency_ms: backendMs,
        result_count: data.results?.length,
      }))
    } else if (body.search_context && (body.facet_filters || body.price_range)) {
      // Filter refinement — not billable, but tracked for analytics
      waitUntil(trackBillableEvent(collection, {
        type: "filter",
        query: body.query ?? "",
        status: res.status,
        latency_ms: backendMs,
        result_count: data.results?.length,
        facet_filters: body.facet_filters,
        price_range: body.price_range,
      }))
    }

    return NextResponse.json(data, {
      status: res.status,
      headers: { ...cors, "Server-Timing": `backend;dur=${backendMs}` },
    })
  } catch (error: unknown) {
    const cors = await corsHeaders(undefined, origin)
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Backend timeout" },
        { status: 504, headers: cors }
      )
    }
    console.error("Search proxy error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 502, headers: cors }
    )
  }
}
