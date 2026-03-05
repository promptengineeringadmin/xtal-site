import { NextResponse } from "next/server"
import { isValidCollection } from "@/lib/admin/demo-collections"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION

  if (!collection || !(await isValidCollection(collection))) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 })
  }

  const qdrantUrl = process.env.QDRANT_URL

  if (!qdrantUrl) {
    return NextResponse.json({ error: "QDRANT_URL not configured" }, { status: 500 })
  }

  try {
    // Scroll Qdrant directly to extract all unique tag prefixes from ui_tags
    const prefixes = new Set<string>()
    let offset: string | number | null = null

    // Scroll in batches until we've seen enough or exhausted the collection
    for (let i = 0; i < 10; i++) {
      const res: Response = await fetch(`${qdrantUrl}/collections/${collection}/points/scroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 500,
          with_payload: { include: ["ui_tags"] },
          with_vector: false,
          ...(offset !== null && { offset }),
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "unknown")
        return NextResponse.json({ error: `Qdrant error: ${text}` }, { status: 502 })
      }

      const data = await res.json()
      const points = data.result?.points || []

      for (const point of points) {
        const tags: string[] = point.payload?.ui_tags || []
        for (const tag of tags) {
          const idx = tag.indexOf("_")
          if (idx > 0) {
            prefixes.add(tag.substring(0, idx))
          }
        }
      }

      // Stop if no more pages
      offset = data.result?.next_page_offset ?? null
      if (offset === null || points.length === 0) break
    }

    const facets = Array.from(prefixes).sort()
    return NextResponse.json({ facets })
  } catch (error) {
    console.error("Facet discovery error:", error)
    return NextResponse.json({ error: "Failed to discover facets" }, { status: 502 })
  }
}
