import type { SearchResponse } from "./xtal-types"

export async function serverSearch(
  query: string,
  collection?: string
): Promise<SearchResponse | null> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  const col = collection || process.env.XTAL_COLLECTION
  if (!backendUrl || !query) return null

  try {
    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, collection: col }),
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
