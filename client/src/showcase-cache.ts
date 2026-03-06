import type { Product, ShowcaseQuery, XtalAPI } from "./api"

export interface ShowcaseRow {
  query: string
  label: string
  products: Product[]
}

const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface CachedShowcase {
  rows: ShowcaseRow[]
  ts: number
}

function cacheKey(shopId: string): string {
  return `xtal-showcase-${shopId}`
}

function readCache(shopId: string): ShowcaseRow[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(shopId))
    if (!raw) return null
    const cached: CachedShowcase = JSON.parse(raw)
    if (Date.now() - cached.ts > CACHE_TTL) {
      localStorage.removeItem(cacheKey(shopId))
      return null
    }
    return cached.rows
  } catch {
    return null
  }
}

function writeCache(shopId: string, rows: ShowcaseRow[]): void {
  try {
    const data: CachedShowcase = { rows, ts: Date.now() }
    localStorage.setItem(cacheKey(shopId), JSON.stringify(data))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export async function getShowcaseData(
  queries: ShowcaseQuery[],
  shopId: string,
  api: XtalAPI,
): Promise<ShowcaseRow[]> {
  const cached = readCache(shopId)
  if (cached) return cached

  const results = await Promise.allSettled(
    queries.map(async (q) => {
      const res = await api.searchShowcase(q.query, 4)
      return {
        query: q.query,
        label: q.label,
        products: res.results.slice(0, 4),
      }
    })
  )

  const rows: ShowcaseRow[] = results
    .filter((r): r is PromiseFulfilledResult<ShowcaseRow> =>
      r.status === "fulfilled" && r.value.products.length > 0
    )
    .map((r) => r.value)

  if (rows.length > 0) writeCache(shopId, rows)
  return rows
}
