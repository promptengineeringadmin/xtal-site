import { NextResponse } from "next/server"
import { corsHeaders, handleOptions } from "@/lib/api/cors"
import { getSnippetSettings, getResultsPerPage } from "@/lib/admin/admin-settings"
import { COLLECTIONS } from "@/lib/admin/collections"

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shopId = searchParams.get("shopId")

  if (!shopId) {
    return NextResponse.json(
      { error: "Missing shopId parameter" },
      { status: 400, headers: corsHeaders() }
    )
  }

  // Validate shopId against known collections
  const known = COLLECTIONS.find((c) => c.id === shopId)
  if (!known) {
    return NextResponse.json(
      { error: "Unknown shopId" },
      { status: 404, headers: corsHeaders() }
    )
  }

  try {
    const [snippet, resultsPerPage] = await Promise.all([
      getSnippetSettings(shopId),
      getResultsPerPage(shopId),
    ])

    const config = {
      shopId,
      enabled: snippet.enabled,
      searchSelector: snippet.searchSelector,
      resultsSelector: snippet.resultsSelector,
      displayMode: snippet.displayMode,
      resultsPerPage,
      utm: {
        source: "xtal",
        medium: "search",
        campaign: shopId,
      },
      features: {
        aspects: true,
        explain: true,
      },
    }

    return NextResponse.json(config, {
      headers: {
        ...corsHeaders(),
        "Cache-Control": "public, max-age=300",
      },
    })
  } catch (error) {
    console.error("Config API error:", error)
    return NextResponse.json(
      { error: "Failed to load config" },
      { status: 500, headers: corsHeaders() }
    )
  }
}
