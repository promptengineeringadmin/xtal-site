import { NextResponse } from "next/server"
import { isValidCollection } from "@/lib/admin/demo-collections"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION

  if (!collection || !(await isValidCollection(collection))) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 })
  }

  const backendUrl = process.env.XTAL_BACKEND_URL
  if (!backendUrl) {
    return NextResponse.json({ error: "XTAL_BACKEND_URL not configured" }, { status: 500 })
  }

  try {
    // Run a broad search to discover all facet prefixes
    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "*",
        collection,
        k: 1,
        limit: 1,
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown")
      return NextResponse.json({ error: `Backend error: ${text}` }, { status: 502 })
    }

    const data = await res.json()
    const facets = Object.keys(data.computed_facets || {}).sort()

    return NextResponse.json({ facets })
  } catch (error) {
    console.error("Facet discovery error:", error)
    return NextResponse.json({ error: "Failed to discover facets" }, { status: 502 })
  }
}
