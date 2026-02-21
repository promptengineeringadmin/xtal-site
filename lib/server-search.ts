import type { SearchResponse } from "./xtal-types"

export async function serverSearch(
  query: string,
  collection?: string,
  limit?: number,
  revalidate?: number,
): Promise<SearchResponse | null> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  const col = collection || process.env.XTAL_COLLECTION
  if (!backendUrl || !query) return null

  try {
    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, collection: col, ...(limit && { limit }) }),
      ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }),
    })
    if (!res.ok) {
      console.error(`[serverSearch] Backend returned ${res.status}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.error("[serverSearch] Fetch error:", err)
    return null
  }
}
