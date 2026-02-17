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
  getStoreType,
  saveStoreType,
} from "@/lib/admin/admin-settings"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION

  try {
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

  // Fallback: read from Redis (scoped by collection)
  const fallbackCollection = collection ?? "default"
  const [queryEnhancementEnabled, merchRerankStrength, bm25Weight, keywordRerankStrength, storeType] = await Promise.all([
    getQueryEnhancement(fallbackCollection),
    getMerchRerankStrength(fallbackCollection),
    getBm25Weight(fallbackCollection),
    getKeywordRerankStrength(fallbackCollection),
    getStoreType(fallbackCollection),
  ])
  return NextResponse.json({
    query_enhancement_enabled: queryEnhancementEnabled,
    merch_rerank_strength: merchRerankStrength,
    bm25_weight: bm25Weight,
    keyword_rerank_strength: keywordRerankStrength,
    store_type: storeType,
    _source: "redis_fallback",
  })
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    const body = await request.json()
    const params = new URLSearchParams({ collection: collection ?? "" })

    // Always persist to Redis as local fallback (scoped by collection)
    const fallbackCollection = collection ?? process.env.XTAL_COLLECTION ?? "default"
    try {
      if (body.query_enhancement_enabled !== undefined) {
        await saveQueryEnhancement(fallbackCollection, body.query_enhancement_enabled)
      }
      if (body.merch_rerank_strength !== undefined) {
        await saveMerchRerankStrength(fallbackCollection, body.merch_rerank_strength)
      }
      if (body.bm25_weight !== undefined) {
        await saveBm25Weight(fallbackCollection, body.bm25_weight)
      }
      if (body.keyword_rerank_strength !== undefined) {
        await saveKeywordRerankStrength(fallbackCollection, body.keyword_rerank_strength)
      }
      if (body.store_type !== undefined) {
        await saveStoreType(fallbackCollection, body.store_type)
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
    const errText = await res.text().catch(() => "unknown")
    console.error(`Settings backend sync failed (${res.status}): ${errText}`)
    return NextResponse.json({
      ...body,
      _source: "redis_fallback",
      backendWarning:
        "Settings saved locally but failed to sync to search backend. Changes won't affect search results until the backend issue is resolved.",
    })
  } catch (error) {
    console.error("Settings PUT proxy error:", error)

    // Backend unreachable — Redis save already happened above
    return NextResponse.json({
      _source: "redis_fallback",
      backendWarning:
        "Settings saved locally but failed to sync to search backend. Changes won't affect search results until the backend issue is resolved.",
    })
  }
}
