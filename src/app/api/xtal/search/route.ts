import { NextResponse } from "next/server"
import { corsHeaders, handleOptions } from "@/lib/api/cors"

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL
    const collection = body.collection || process.env.XTAL_COLLECTION

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

    const t0 = Date.now()
    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedBody),
    })
    const backendMs = Date.now() - t0

    const data = await res.json()
    return NextResponse.json(data, {
      status: res.status,
      headers: { ...corsHeaders(), "Server-Timing": `backend;dur=${backendMs}` },
    })
  } catch (error) {
    console.error("Search proxy error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 502, headers: corsHeaders() })
  }
}
