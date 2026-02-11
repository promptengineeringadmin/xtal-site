import type { Platform, QueryResult, SearchResult, TestQuery } from "./types"

// ─── Search execution via Playwright ────────────────────────
// This module provides the search execution logic.
// The actual Playwright browser launch happens in the API route
// because @sparticuz/chromium requires server-side Node.js APIs.

export interface SearchProgress {
  queryIndex: number
  totalQueries: number
  query: string
  status: "running" | "complete" | "error"
  result?: QueryResult
}

// ─── Execute search on a Shopify store via API ──────────────

async function searchShopify(
  origin: string,
  query: string
): Promise<{ results: SearchResult[]; count: number }> {
  const url = `${origin}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=10`

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; XTALGrader/1.0; +https://xtalsearch.com)",
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`Shopify search failed: ${res.status}`)

  const data = await res.json()
  const products = data?.resources?.results?.products ?? []

  return {
    count: products.length,
    results: products.map((p: Record<string, unknown>) => ({
      title: String(p.title ?? ""),
      price: p.price ? parseFloat(String(p.price)) : undefined,
      url: p.url ? String(p.url) : undefined,
    })),
  }
}

// ─── Execute search via URL fetch (generic fallback) ────────

async function searchViaUrl(
  searchUrl: string,
  query: string
): Promise<{ results: SearchResult[]; count: number }> {
  const fullUrl = `${searchUrl}${encodeURIComponent(query)}`

  const res = await fetch(fullUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) throw new Error(`Search request failed: ${res.status}`)

  const html = await res.text()

  // Try to extract product titles from the search results HTML
  const results: SearchResult[] = []

  // Common patterns for product titles in search results
  const patterns = [
    /class="[^"]*product[_-]?title[^"]*"[^>]*>([^<]{3,100})</gi,
    /class="[^"]*product[_-]?name[^"]*"[^>]*>([^<]{3,100})</gi,
    /class="[^"]*card[_-]?title[^"]*"[^>]*>([^<]{3,100})</gi,
    /class="[^"]*search[_-]?result[_-]?title[^"]*"[^>]*>([^<]{3,100})</gi,
    /<h[2-4][^>]*class="[^"]*title[^"]*"[^>]*>([^<]{3,100})</gi,
  ]

  for (const pattern of patterns) {
    for (const match of Array.from(html.matchAll(pattern))) {
      const title = match[1].trim()
      if (title && !results.some((r) => r.title === title)) {
        results.push({ title })
      }
    }
    if (results.length >= 10) break
  }

  // Try to extract result count
  let count = results.length
  const countPatterns = [
    /(\d+)\s*results?\s*(?:found|for)/i,
    /showing\s*\d+\s*(?:–|-)\s*\d+\s*of\s*(\d+)/i,
    /(\d+)\s*products?\s*found/i,
  ]
  for (const cp of countPatterns) {
    const m = html.match(cp)
    if (m) {
      count = parseInt(m[1], 10)
      break
    }
  }

  return { results: results.slice(0, 10), count }
}

// ─── Run a single query ─────────────────────────────────────

export async function runSingleQuery(
  storeUrl: string,
  platform: Platform,
  searchUrl: string | null,
  testQuery: TestQuery
): Promise<QueryResult> {
  const start = Date.now()

  try {
    const origin = new URL(storeUrl.startsWith("http") ? storeUrl : `https://${storeUrl}`).origin
    let searchResults: { results: SearchResult[]; count: number }

    if (platform === "shopify") {
      // Use Shopify's predictive search API (most reliable)
      searchResults = await searchShopify(origin, testQuery.text)
    } else if (searchUrl) {
      // Use known search URL for this platform
      searchResults = await searchViaUrl(searchUrl, testQuery.text)
    } else {
      // Try generic search paths
      const fallbackPaths = ["/search?q=", "/?s=", "/search/?q="]
      searchResults = { results: [], count: 0 }

      for (const path of fallbackPaths) {
        try {
          searchResults = await searchViaUrl(`${origin}${path}`, testQuery.text)
          if (searchResults.results.length > 0) break
        } catch {
          continue
        }
      }
    }

    return {
      query: testQuery.text,
      category: testQuery.category,
      expectedBehavior: testQuery.expectedBehavior,
      resultCount: searchResults.count,
      topResults: searchResults.results,
      responseTime: Date.now() - start,
    }
  } catch (err) {
    return {
      query: testQuery.text,
      category: testQuery.category,
      expectedBehavior: testQuery.expectedBehavior,
      resultCount: 0,
      topResults: [],
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

// ─── Run all queries sequentially ───────────────────────────

export async function runAllQueries(
  storeUrl: string,
  platform: Platform,
  searchUrl: string | null,
  queries: TestQuery[],
  onProgress?: (progress: SearchProgress) => void
): Promise<QueryResult[]> {
  const results: QueryResult[] = []

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i]

    onProgress?.({
      queryIndex: i,
      totalQueries: queries.length,
      query: query.text,
      status: "running",
    })

    const result = await runSingleQuery(storeUrl, platform, searchUrl, query)
    results.push(result)

    onProgress?.({
      queryIndex: i,
      totalQueries: queries.length,
      query: query.text,
      status: result.error ? "error" : "complete",
      result,
    })

    // Small delay to avoid rate limiting
    if (i < queries.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  return results
}
