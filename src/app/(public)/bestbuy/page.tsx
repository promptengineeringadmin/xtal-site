import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"
import { serverSearch } from "@/lib/server-search"
import { getResultsPerPage } from "@/lib/admin/admin-settings"

export const metadata: Metadata = {
  title: "Best Buy | XTAL AI Search Demo",
  description:
    "AI-powered product search across Best Buy's full catalog. Try natural language queries to discover products.",
}

export default async function BestBuyPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const resultsPerPage = await getResultsPerPage("bestbuy")
  const initialSearchData = q ? await serverSearch(q, "bestbuy", resultsPerPage) : null

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch collection="bestbuy" initialQuery={q} initialSearchData={initialSearchData} defaultResultsPerPage={resultsPerPage} />
      </main>
    </>
  )
}
