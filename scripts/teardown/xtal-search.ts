import type { XtalResult } from "./types"

interface BackendProduct {
  id: string
  title: string
  name: string
  price: number | number[]
  image_url: string | null
  product_url: string
  vendor: string
  tags: string[]
  description?: string
}

interface BackendResponse {
  results: BackendProduct[]
  total: number
  query_time: number
  search_mode?: string
  agent_reasoning?: string
}

export async function searchXtal(
  query: string,
  collection: string,
  limit = 10,
): Promise<{
  results: XtalResult[]
  resultCount: number
  responseTime: number
  searchMode?: string
  agentReasoning?: string
}> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  if (!backendUrl) throw new Error("XTAL_BACKEND_URL not set")

  const start = Date.now()
  const res = await fetch(`${backendUrl}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, collection, limit }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`XTAL search failed (${res.status}): ${text}`)
  }

  const data: BackendResponse = await res.json()
  const elapsed = Date.now() - start

  return {
    results: data.results.map((p) => ({
      title: p.title || p.name,
      price: p.price,
      imageUrl: p.image_url,
      productUrl: p.product_url,
      vendor: p.vendor,
      tags: p.tags || [],
      agentReasoning: data.agent_reasoning,
    })),
    resultCount: data.total,
    responseTime: data.query_time ?? elapsed,
    searchMode: data.search_mode,
    agentReasoning: data.agent_reasoning,
  }
}
