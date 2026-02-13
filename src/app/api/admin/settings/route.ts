import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"
import {
  getQueryEnhancement,
  saveQueryEnhancement,
  getMerchRerankStrength,
  saveMerchRerankStrength,
  getBm25Weight,
  saveBm25Weight,
  getKeywordRerankStrength,
  saveKeywordRerankStrength,
} from "@/lib/admin/admin-settings"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    const params = new URLSearchParams({ collection: collection ?? "" })

    const res = await adminFetch(`/api/vendor/settings?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
    // Backend returned an error — fall back to Redis
  } catch (error) {
    console.error("Settings GET proxy error:", error)
  }

  // Fallback: read from Redis
  const [queryEnhancementEnabled, merchRerankStrength, bm25Weight, keywordRerankStrength] = await Promise.all([
    getQueryEnhancement(),
    getMerchRerankStrength(),
    getBm25Weight(),
    getKeywordRerankStrength(),
  ])
  return NextResponse.json({
    query_enhancement_enabled: queryEnhancementEnabled,
    merch_rerank_strength: merchRerankStrength,
    bm25_weight: bm25Weight,
    keyword_rerank_strength: keywordRerankStrength,
    _source: "redis_fallback",
  })
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    const body = await request.json()
    const params = new URLSearchParams({ collection: collection ?? "" })

    // Always persist to Redis as local fallback
    try {
      if (body.query_enhancement_enabled !== undefined) {
        await saveQueryEnhancement(body.query_enhancement_enabled)
      }
      if (body.merch_rerank_strength !== undefined) {
        await saveMerchRerankStrength(body.merch_rerank_strength)
      }
      if (body.bm25_weight !== undefined) {
        await saveBm25Weight(body.bm25_weight)
      }
      if (body.keyword_rerank_strength !== undefined) {
        await saveKeywordRerankStrength(body.keyword_rerank_strength)
      }
    } catch (e) {
      console.error("Redis settings save error:", e)
    }

    // Try backend
    const res = await adminFetch(`/api/vendor/settings?${params.toString()}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }

    // Backend failed but Redis succeeded — return success with warning
    return NextResponse.json({
      ...body,
      _source: "redis_fallback",
    })
  } catch (error) {
    console.error("Settings PUT proxy error:", error)

    // Backend unreachable — Redis save already happened above
    return NextResponse.json({
      _source: "redis_fallback",
    })
  }
}
