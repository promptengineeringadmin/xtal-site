import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { urls } = body as { urls: string[] }

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "urls array is required" },
        { status: 400 }
      )
    }

    if (urls.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 URLs per batch" },
        { status: 400 }
      )
    }

    // Batch processing happens client-side by calling analyze/search/evaluate
    // sequentially for each URL. This endpoint just validates and returns
    // the normalized URL list for the admin UI to process.
    const normalizedUrls = urls
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .map((u) => (u.startsWith("http") ? u : `https://${u}`))

    return NextResponse.json({
      urls: normalizedUrls,
      total: normalizedUrls.length,
    })
  } catch (error) {
    console.error("Batch validation error:", error)
    return NextResponse.json(
      { error: "Failed to process batch" },
      { status: 500 }
    )
  }
}
