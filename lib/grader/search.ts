import type { Platform, QueryResult, SearchResult, TestQuery } from "./types"

// ─── HTML entity decoding for scraped titles ────────────────

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
}

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

// ─── Extract search results section from full page HTML ──────
// Avoids matching navigation/menu product links that appear sitewide.

function extractSearchResultsSection(html: string): string | null {
  // Look for common search results container patterns.
  // We find an opening tag and grab a generous chunk after it.
  const containerPatterns = [
    // WooCommerce
    /(<(?:div|section|main)[^>]*class="[^"]*woocommerce[^"]*"[^>]*>)/i,
    // Generic search results containers
    /(<(?:div|section|main)[^>]*(?:id|class)="[^"]*search[_-]?results?[^"]*"[^>]*>)/i,
    /(<(?:div|section|main)[^>]*(?:id|class)="[^"]*results?[_-]?container[^"]*"[^>]*>)/i,
    /(<(?:div|section|main)[^>]*(?:id|class)="[^"]*product[_-]?list[^"]*"[^>]*>)/i,
    /(<(?:div|section|main)[^>]*(?:id|class)="[^"]*products[^"]*"[^>]*>)/i,
    // BigCommerce
    /(<(?:div|section|main)[^>]*(?:id|class)="[^"]*productGrid[^"]*"[^>]*>)/i,
    // Magento
    /(<(?:div|section|main)[^>]*class="[^"]*search[. ]results[^"]*"[^>]*>)/i,
    // Generic main content
    /(<main[^>]*>)/i,
  ]

  for (const pattern of containerPatterns) {
    const match = html.match(pattern)
    if (match && match.index !== undefined) {
      // Take from the container start to 50KB after it (or end of doc)
      const start = match.index
      const section = html.slice(start, start + 50_000)
      // Sanity check: only use if section has some product-like content
      if (/product|item|result/i.test(section)) {
        return section
      }
    }
  }

  return null
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

  // Try to extract product titles from the search results HTML.
  // Strategy: first try to isolate the search results container,
  // then apply high-confidence class-based patterns.
  // Only fall back to URL-based patterns on the scoped HTML to avoid
  // matching navigation/menu links that appear across the whole page.

  const results: SearchResult[] = []

  // Attempt to extract just the search results section of the page
  const scopedHtml = extractSearchResultsSection(html) ?? html
  const isScoped = scopedHtml !== html

  // High-confidence patterns: class-based selectors specific to search results
  const highConfidencePatterns = [
    /class="[^"]*product[_-]?title[^"]*"[^>]*>([^<]{3,100})</gi,
    /class="[^"]*product[_-]?name[^"]*"[^>]*>([^<]{3,100})</gi,
    /class="[^"]*card[_-]?title[^"]*"[^>]*>([^<]{3,100})</gi,
    /class="[^"]*search[_-]?result[_-]?title[^"]*"[^>]*>([^<]{3,100})</gi,
    /<h[2-4][^>]*class="[^"]*title[^"]*"[^>]*>([^<]{3,100})</gi,
    // Elementor/WP: entry titles (class-based, reasonably specific)
    /class="[^"]*entry[_-]?title[^"]*"[^>]*>\s*<a[^>]*>([^<]{3,100})</gi,
  ]

  // Low-confidence patterns: URL-based, match product links anywhere on page.
  // Only safe to use on scoped HTML (search results section).
  const lowConfidencePatterns = [
    /href="[^"]*\/product\/[^"]*"[^>]*>([^<]{3,100})</gi,
    /href="[^"]*\/products?\/[^"]*"[^>]*>([^<]{3,100})</gi,
  ]

  // First pass: high-confidence patterns on scoped HTML
  for (const pattern of highConfidencePatterns) {
    for (const match of Array.from(scopedHtml.matchAll(pattern))) {
      const title = decodeEntities(match[1].trim())
      if (title && title.length > 2 && !results.some((r) => r.title === title)) {
        results.push({ title })
      }
    }
    if (results.length >= 10) break
  }

  // Second pass: if no results yet, try low-confidence patterns on SCOPED html only
  if (results.length === 0 && isScoped) {
    for (const pattern of lowConfidencePatterns) {
      for (const match of Array.from(scopedHtml.matchAll(pattern))) {
        const title = decodeEntities(match[1].trim())
        if (title && title.length > 2 && !results.some((r) => r.title === title)) {
          results.push({ title })
        }
      }
      if (results.length >= 10) break
    }
  }

  // Try to extract result count
  let count = results.length
  const countPatterns = [
    /(\d+)\s*results?\s*(?:found|for)/i,
    /showing\s*\d+\s*(?:–|-)\s*\d+\s*of\s*(\d+)/i,
    /(\d+)\s*products?\s*found/i,
    // WooCommerce: "Showing all X results" or "Showing 1–12 of X results"
    /showing\s+(?:all\s+)?(\d+)\s+results?/i,
    // Generic: "X items" or "X products"
    /(\d+)\s*(?:items?|products?)\s*$/im,
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
