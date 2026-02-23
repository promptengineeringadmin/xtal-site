import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"
import { serverSearch } from "@/lib/server-search"
import { getResultsPerPage } from "@/lib/admin/admin-settings"
import { getShowcaseQueries, getExtraSuggestions, fetchShowcaseData } from "@/lib/showcase"

export const metadata: Metadata = {
  title: "Dennis Playground | XTAL AI Search",
  description:
    "Dennis's personal AI-powered product search playground.",
}

export default async function DennisPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const resultsPerPage = await getResultsPerPage("dennis")
  const initialSearchData = q ? await serverSearch(q, "dennis", resultsPerPage) : null

  let showcaseData = null
  if (!q) {
    const queries = getShowcaseQueries("dennis")
    if (queries) showcaseData = await fetchShowcaseData(queries, "dennis")
  }
  const extraSuggestions = getExtraSuggestions("dennis")

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch
          collection="dennis"
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
