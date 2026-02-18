import type { SearchResponse } from "./xtal-types"

export async function serverSearch(
  query: string,
  collection?: string
): Promise<SearchResponse | null> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  const col = collection || process.env.XTAL_COLLECTION

  if (!backendUrl) {
    console.error("[serverSearch] XTAL_BACKEND_URL is not set")
    return null
  }
  if (!query) {
    console.error("[serverSearch] No query provided")
    return null
  }

  const url = `${backendUrl}/api/search`
  console.log(`[serverSearch] Fetching: ${url} | query="${query}" collection="${col}"`)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, collection: col }),
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[serverSearch] Backend returned ${res.status}: ${body.slice(0, 200)}`)
      return null
    }
    const data = await res.json()
    console.log(`[serverSearch] Success: ${data.total ?? 0} results`)
    return data
  } catch (err) {
    console.error("[serverSearch] Fetch error:", err)
    return null
  }
}
