import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"
import { serverSearch } from "@/lib/server-search"
import { getResultsPerPage } from "@/lib/admin/admin-settings"
import { getShowcaseQueries, getExtraSuggestions, fetchShowcaseData } from "@/lib/showcase"

export const metadata: Metadata = {
  title: "Try XTAL Search | Live AI Product Discovery Demo",
  description:
    "Experience AI-powered product search. Try natural language queries and see how XTAL understands intent, not just keywords.",
}

export default async function TryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const collection = process.env.XTAL_COLLECTION || "xtaldemo"
  const resultsPerPage = await getResultsPerPage(collection)
  const initialSearchData = q ? await serverSearch(q, undefined, resultsPerPage) : null

  let showcaseData = null
  if (!q) {
    const queries = getShowcaseQueries(collection)
    if (queries) showcaseData = await fetchShowcaseData(queries, collection)
  }
  const extraSuggestions = getExtraSuggestions(collection)

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch
          initialQuery={q}
          initialSearchData={initialSearchData}
          defaultResultsPerPage={resultsPerPage}
          showcaseData={showcaseData}
          extraSuggestions={extraSuggestions}
        />
      </main>
    </>
  )
}
