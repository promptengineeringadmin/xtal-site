import { serverSearch } from "./server-search"
import type { ShowcaseRow } from "./xtal-types"

export interface ShowcaseQueryDef {
  query: string
  label: string
}

const SHOWCASE_QUERIES: Record<string, ShowcaseQueryDef[]> = {
  xtaldemo: [
    { query: "cozy gift for someone who is always cold", label: "gift + warmth" },
    { query: "hosting a dinner party this weekend", label: "occasion" },
    { query: "make my bathroom feel like a spa", label: "vibe + space" },
  ],
  bestbuy: [
    { query: "noise cancelling headphones for commuting", label: "use case + product" },
    { query: "setting up a home theater on a budget", label: "occasion + budget" },
    { query: "gift for a teenage gamer", label: "gift + persona" },
  ],
  willow: [
    { query: "cozy gift for someone who is always cold", label: "gift + warmth" },
    { query: "hosting a dinner party this weekend", label: "occasion" },
    { query: "make my bathroom feel like a spa", label: "vibe + space" },
  ],
  goldcanna: [
    { query: "relaxing indica for stress relief", label: "effect + mood" },
    { query: "strains with limonene and citrus flavor", label: "terpene + flavor" },
    { query: "energizing sativa for daytime", label: "energy + time" },
  ],
}

export const EXTRA_SUGGESTIONS: Record<string, string[]> = {
  xtaldemo: [
    "dainty jewelry for everyday wear",
    "setting up a home cocktail bar",
  ],
  bestbuy: [
    "best laptop for college students",
    "smart home starter kit",
  ],
  willow: [
    "dainty jewelry for everyday wear",
    "setting up a home cocktail bar",
  ],
  goldcanna: [
    "myrcene terpene for sleep",
    "hybrid concentrate",
  ],
}

export function getShowcaseQueries(
  collection: string,
  suggestions?: string[],
): ShowcaseQueryDef[] | null {
  if (SHOWCASE_QUERIES[collection]) {
    return SHOWCASE_QUERIES[collection]
  }
  if (suggestions && suggestions.length > 0) {
    return suggestions.slice(0, 3).map(s => ({
      query: s,
      label: s.split(/\s+/).slice(0, 3).join(" "),
    }))
  }
  return null
}

export function getExtraSuggestions(
  collection: string,
  suggestions?: string[],
): string[] {
  if (EXTRA_SUGGESTIONS[collection]) {
    return EXTRA_SUGGESTIONS[collection]
  }
  if (suggestions && suggestions.length > 3) {
    return suggestions.slice(3, 5)
  }
  return []
}

export async function fetchShowcaseData(
  queries: ShowcaseQueryDef[],
  collection?: string,
): Promise<ShowcaseRow[] | null> {
  try {
    const rows = await Promise.all(
      queries.map(async ({ query, label }) => ({
        query,
        label,
        products: (await serverSearch(query, collection, 4, 3600))?.results?.slice(0, 4) ?? [],
      }))
    )
    const filtered = rows.filter(r => r.products.length > 0)
    return filtered.length > 0 ? filtered : null
  } catch {
    return null
  }
}
