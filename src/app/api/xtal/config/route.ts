import { NextResponse } from "next/server"
import { corsHeaders, handleOptions } from "@/lib/api/cors"
import { COLLECTIONS } from "@/lib/admin/collections"
import {
  getSnippetEnabled,
  getSnippetSearchSelector,
  getSnippetDisplayMode,
  getSnippetSiteUrl,
} from "@/lib/admin/admin-settings"

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shopId = searchParams.get("shopId")

  if (!shopId || !COLLECTIONS.some((c) => c.id === shopId)) {
    return NextResponse.json(
      { error: "Unknown shopId" },
      { status: 404, headers: corsHeaders() }
    )
  }

  const [enabled, searchSelector, displayMode, siteUrl] = await Promise.all([
    getSnippetEnabled(shopId),
    getSnippetSearchSelector(shopId),
    getSnippetDisplayMode(shopId),
    getSnippetSiteUrl(shopId),
  ])

  return NextResponse.json(
    {
      enabled,
      searchSelector,
      displayMode,
      siteUrl,
      features: { aspects: true, explain: true },
    },
    {
      headers: {
        ...corsHeaders(),
        "Cache-Control": "public, max-age=300",
      },
    }
  )
}
