import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL
    const collection = process.env.XTAL_COLLECTION

    if (!backendUrl) {
      return NextResponse.json({ error: "XTAL_BACKEND_URL not configured" }, { status: 500 })
    }

    // Extract geo headers from Vercel
    const geoCountry = request.headers.get("x-vercel-ip-country") || undefined
    const geoRegion = request.headers.get("x-vercel-ip-country-region") || undefined

    const enrichedBody = {
      ...body,
      collection,
      geo_country: geoCountry,
      geo_region: geoRegion,
    }

    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedBody),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Search proxy error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 502 })
  }
}
