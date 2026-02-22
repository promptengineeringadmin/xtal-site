import { NextResponse } from "next/server"
import { corsHeaders, handleOptions } from "@/lib/api/cors"
import { VIBE_MAP, VALID_VIBES, synthesizeQuery } from "@/lib/budtender/vibes"
import { buildBudtenderPrompt } from "@/lib/budtender/prompt"
import { validateApiKey } from "@/lib/api/api-key-auth"
import { trackBudtenderUsage } from "@/lib/api/budtender-usage"

export async function OPTIONS() {
  return handleOptions()
}

interface SearchResult {
  id: string
  title: string
  description?: string
  price: number
  vendor: string
  product_type: string
  image_url?: string | null
  images?: { src: string }[]
  product_url: string
  tags: string[]
  available: boolean
}

async function doSearch(
  backendUrl: string,
  body: Record<string, unknown>
): Promise<{
  results: SearchResult[]
  total: number
  query_time: number
  relevance_scores?: Record<string, number>
}> {
  const res = await fetch(`${backendUrl}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  })
  return res.json()
}

export async function POST(request: Request) {
  const t0 = Date.now()

  // --- API key auth ---
  const auth = await validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json(
      { error: "Missing or invalid API key. Pass a valid X-API-Key header." },
      { status: 401, headers: corsHeaders() }
    )
  }

  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL

    if (!backendUrl) {
      return NextResponse.json(
        { error: "XTAL_BACKEND_URL not configured" },
        { status: 500, headers: corsHeaders() }
      )
    }

    // --- Validate inputs ---
    const { terpenes, strains, effects, formats, query, vibe, price_range } = body
    const includeReasoning = body.include_reasoning === true
    const limit = Math.min(5, Math.max(1, body.limit ?? 3))

    if (vibe && !VALID_VIBES.includes(vibe)) {
      return NextResponse.json(
        { error: `Invalid vibe. Valid options: ${VALID_VIBES.join(", ")}` },
        { status: 400, headers: corsHeaders() }
      )
    }

    const hasStructured = [terpenes, strains, effects, formats].some(
      (a) => Array.isArray(a) && a.length > 0
    )
    if (!query && !vibe && !hasStructured) {
      return NextResponse.json(
        { error: "Provide at least one of: query, vibe, terpenes, strains, effects, formats" },
        { status: 400, headers: corsHeaders() }
      )
    }

    // --- Resolve vibe + merge filters ---
    const vibeProfile = vibe ? VIBE_MAP[vibe] : null

    const resolvedFilters: Record<string, string[]> = {}
    if (vibeProfile) {
      for (const [k, v] of Object.entries(vibeProfile.facet_filters)) {
        resolvedFilters[k] = [...v]
      }
    }
    if (terpenes?.length)
      resolvedFilters.terpene = Array.from(
        new Set((resolvedFilters.terpene || []).concat(terpenes))
      )
    if (strains?.length)
      resolvedFilters["strain-type"] = Array.from(
        new Set((resolvedFilters["strain-type"] || []).concat(strains))
      )
    if (effects?.length)
      resolvedFilters.effect = Array.from(
        new Set((resolvedFilters.effect || []).concat(effects))
      )
    if (formats?.length)
      resolvedFilters.format = Array.from(
        new Set((resolvedFilters.format || []).concat(formats))
      )

    const resolvedQuery =
      query || vibeProfile?.query || synthesizeQuery({ terpenes, strains, effects, formats })

    // --- Search (pass 1: with filters) ---
    const collection = "goldcanna"
    const overFetchLimit = limit * 3
    const hasFilters = Object.keys(resolvedFilters).length > 0

    let searchData = await doSearch(backendUrl, {
      query: resolvedQuery,
      collection,
      facet_filters: hasFilters ? resolvedFilters : undefined,
      price_range: price_range || undefined,
      limit: overFetchLimit,
      k: overFetchLimit,
    })

    // --- Fallback: if no results with filters, retry without ---
    let usedFallback = false
    if ((!searchData.results || searchData.results.length === 0) && hasFilters) {
      searchData = await doSearch(backendUrl, {
        query: resolvedQuery,
        collection,
        price_range: price_range || undefined,
        limit: overFetchLimit,
        k: overFetchLimit,
      })
      usedFallback = true
    }

    // --- Select top available products ---
    const available = (searchData.results || []).filter((p) => p.available !== false)
    const topProducts = available.slice(0, limit)

    if (topProducts.length === 0) {
      return NextResponse.json(
        {
          picks: [],
          meta: {
            vibe: vibe || undefined,
            resolved_query: resolvedQuery,
            resolved_filters: usedFallback ? {} : resolvedFilters,
            total_candidates: 0,
            query_time_ms: Date.now() - t0,
            fallback_reason: "No products matched your preferences. Try a broader search.",
          },
        },
        { headers: corsHeaders() }
      )
    }

    // --- Generate AI reasoning in parallel (only if requested) ---
    let explainResults: PromiseSettledResult<{ explanation?: string }>[] | null = null

    if (includeReasoning) {
      const systemPrompt = buildBudtenderPrompt()
      explainResults = await Promise.allSettled(
        topProducts.map((product) =>
          fetch(`${backendUrl}/api/explain`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: resolvedQuery,
              collection,
              product_id: product.id,
              score: searchData.relevance_scores?.[product.id],
              system_prompt: systemPrompt,
            }),
            signal: AbortSignal.timeout(5000),
          }).then((r) => r.json())
        )
      )
    }

    // --- Assemble picks ---
    const picks = topProducts.map((product, i) => {
      let reasoning: string | null = null
      if (includeReasoning && explainResults) {
        const result = explainResults[i]
        reasoning =
          result.status === "fulfilled"
            ? result.value.explanation || "This product matches your preferences."
            : "This product matches your preferences."
      }

      return {
        product: {
          id: product.id,
          title: product.title,
          price: product.price,
          vendor: product.vendor,
          product_type: product.product_type,
          image_url: product.image_url || product.images?.[0]?.src || null,
          product_url: product.product_url,
          tags: product.tags,
          available: product.available,
        },
        reasoning,
        relevance_score: searchData.relevance_scores?.[product.id] ?? 0,
      }
    })

    // Fire-and-forget: track usage for billing
    trackBudtenderUsage(auth.client, {
      endpoint: "/api/xtal/budtender/recommend",
      status: 200,
      latency_ms: Date.now() - t0,
    })

    return NextResponse.json(
      {
        picks,
        meta: {
          vibe: vibe || undefined,
          resolved_query: resolvedQuery,
          resolved_filters: usedFallback ? {} : resolvedFilters,
          total_candidates: searchData.total || 0,
          query_time_ms: Date.now() - t0,
          ...(usedFallback && {
            fallback_reason: "Broadened search — exact filter match returned no results.",
          }),
        },
      },
      {
        headers: {
          ...corsHeaders(),
          "Server-Timing": `total;dur=${Date.now() - t0}`,
        },
      }
    )
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Backend timeout" },
        { status: 504, headers: corsHeaders() }
      )
    }
    console.error("Budtender recommend error:", error)
    return NextResponse.json(
      { error: "Recommendation failed" },
      { status: 502, headers: corsHeaders() }
    )
  }
}
