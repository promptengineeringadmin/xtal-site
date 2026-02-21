import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"
import { serverSearch } from "@/lib/server-search"
import { getResultsPerPage } from "@/lib/admin/admin-settings"
import type { ShowcaseRow } from "@/lib/xtal-types"

export const metadata: Metadata = {
  title: "Try XTAL Search | Live AI Product Discovery Demo",
  description:
    "Experience AI-powered product search. Try natural language queries and see how XTAL understands intent, not just keywords.",
}

const SHOWCASE_QUERIES = [
  { query: "cozy gift for someone who is always cold", label: "gift + warmth" },
  { query: "hosting a dinner party this weekend", label: "occasion" },
  { query: "make my bathroom feel like a spa", label: "vibe + space" },
]

export default async function TryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const collection = process.env.XTAL_COLLECTION || "xtaldemo"
  const resultsPerPage = await getResultsPerPage(collection)
  const initialSearchData = q ? await serverSearch(q, undefined, resultsPerPage) : null

  // Pre-fetch showcase data for cold start (only when no query)
  let showcaseData: ShowcaseRow[] | null = null
  if (!q) {
    try {
      const rows = await Promise.all(
        SHOWCASE_QUERIES.map(async ({ query, label }) => ({
          query,
          label,
          products: (await serverSearch(query, undefined, 4))?.results?.slice(0, 4) ?? [],
        }))
      )
      // Only include rows that have products
      showcaseData = rows.filter(r => r.products.length > 0)
      if (showcaseData.length === 0) showcaseData = null
    } catch {
      showcaseData = null
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch
          initialQuery={q}
          initialSearchData={initialSearchData}
          defaultResultsPerPage={resultsPerPage}
          showcaseData={showcaseData}
        />
      </main>
    </>
  )
}
