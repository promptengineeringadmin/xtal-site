import { NextResponse } from "next/server"
import { getAspectsPrompt, DEFAULT_ASPECTS_SYSTEM_PROMPT } from "@/lib/admin/aspects-prompt"
import { getStoreType, getAspectsEnabled } from "@/lib/admin/admin-settings"
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

    const searchBody = {
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

    // Fetch aspects config from Redis
    const t0 = Date.now()
    const [rawPrompt, storeType, aspectsEnabled] = await Promise.all([
      getAspectsPrompt(collection || "default"),
      getStoreType(collection || "default"),
      getAspectsEnabled(collection || "default"),
    ])
    const redisMs = Date.now() - t0

    // Build aspects payload
    const interpolated = rawPrompt.replaceAll("{store_type}", storeType)
    const isCustom = rawPrompt !== DEFAULT_ASPECTS_SYSTEM_PROMPT || storeType !== "online retailer"
    const aspectsBody = {
      query: body.query,
      collection,
      selected_aspects: body.selected_aspects,
      ...(isCustom && { system_prompt: interpolated }),
    }

    // Fire search and aspects in parallel
    const t1 = Date.now()
    const [searchResult, aspectsResult] = await Promise.allSettled([
      fetch(`${backendUrl}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchBody),
        signal: AbortSignal.timeout(8000),
      }).then((r) => r.json()),
      fetch(`${backendUrl}/api/aspects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aspectsBody),
        signal: AbortSignal.timeout(5000),
      }).then((r) => r.json()),
    ])
    const backendMs = Date.now() - t1

    // Search is required; aspects are optional
    if (searchResult.status === "rejected") {
      const err = searchResult.reason
      if (err instanceof Error && err.name === "TimeoutError") {
        return NextResponse.json(
          { error: "Backend timeout" },
          { status: 504, headers: corsHeaders() }
        )
      }
      throw searchResult.reason
    }

    const searchData = searchResult.value
    const aspectsData =
      aspectsResult.status === "fulfilled" ? aspectsResult.value : null

    // Fire-and-forget: log proxy timing to Redis for admin drilldowns
    logProxyTiming({
      query: (body.query ?? "").toLowerCase(),
      collection,
      timestamp: t0,
      route: "search-full",
      redisMs,
      backendMs,
      totalMs: Date.now() - t0,
      aspectsFailed: aspectsResult.status === "rejected",
    })

    const response = {
      ...searchData,
      aspects: aspectsData?.aspects || [],
      aspects_enabled: aspectsData ? aspectsEnabled : false,
    }

    const timingParts = [`redis;dur=${redisMs}`, `backend;dur=${backendMs}`]
    if (aspectsResult.status === "rejected") {
      timingParts.push("aspects-failed")
    }

    return NextResponse.json(response, {
      headers: {
        ...corsHeaders(),
        "Server-Timing": timingParts.join(", "),
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Backend timeout" },
        { status: 504, headers: corsHeaders() }
      )
    }
    console.error("Search-full proxy error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 502, headers: corsHeaders() }
    )
  }
}
