import { NextResponse } from "next/server"
import { corsHeaders, handleOptions } from "@/lib/api/cors"
import { isValidCollection } from "@/lib/admin/demo-collections"
import {
  getSnippetEnabled,
  getSnippetSearchSelector,
  getSnippetDisplayMode,
  getSnippetResultsSelector,
  getSnippetSiteUrl,
  getCardTemplate,
  getProductUrlPattern,
  getFiltersEnabled,
  getPricePresets,
  getResultsPerPage,
  getHiddenFacets,
} from "@/lib/admin/admin-settings"

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shopId = searchParams.get("shopId")
  const origin = request.headers.get("Origin")
  const cors = await corsHeaders(shopId || undefined, origin)

  if (!shopId || !(await isValidCollection(shopId))) {
    return NextResponse.json(
      { error: "Unknown shopId" },
      { status: 404, headers: cors }
    )
  }

  const [enabled, searchSelector, displayMode, resultsSelector, siteUrl, cardTemplate, productUrlPattern, filtersEnabled, pricePresets, resultsPerPage, hiddenFacets] =
    await Promise.all([
      getSnippetEnabled(shopId),
      getSnippetSearchSelector(shopId),
      getSnippetDisplayMode(shopId),
      getSnippetResultsSelector(shopId),
      getSnippetSiteUrl(shopId),
      getCardTemplate(shopId),
      getProductUrlPattern(shopId),
      getFiltersEnabled(shopId),
      getPricePresets(shopId),
      getResultsPerPage(shopId),
      getHiddenFacets(shopId),
    ])

  return NextResponse.json(
    {
      enabled,
      searchSelector,
      displayMode,
      ...(resultsSelector ? { resultsSelector } : {}),
      siteUrl,
      features: { aspects: true, explain: true, filters: filtersEnabled },
      ...(cardTemplate ? { cardTemplate } : {}),
      ...(productUrlPattern ? { productUrlPattern } : {}),
      ...(pricePresets ? { pricePresets } : {}),
      ...(hiddenFacets.length > 0 ? { hiddenFacets } : {}),
      resultsPerPage,
    },
    {
      headers: {
        ...cors,
        "Cache-Control": "public, max-age=300",
      },
    }
  )
}
