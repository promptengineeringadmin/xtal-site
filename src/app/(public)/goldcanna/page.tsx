import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"
import BudtenderTrigger from "@/components/try/BudtenderTrigger"
import { serverSearch } from "@/lib/server-search"
import { getResultsPerPage } from "@/lib/admin/admin-settings"

export const metadata: Metadata = {
  title: "Gold Canna | XTAL AI Search Demo",
  description:
    "AI-powered cannabis strain finder. Search by terpenes, effects, or strain name across Gold Canna's catalog.",
}

const SUGGESTIONS = [
  "relaxing indica for stress relief",
  "strains with limonene and citrus flavor",
  "energizing sativa for daytime",
  "myrcene terpene for sleep",
  "hybrid concentrate",
]

export default async function GoldCannaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const resultsPerPage = await getResultsPerPage("goldcanna")
  const initialSearchData = q ? await serverSearch(q, "goldcanna", resultsPerPage) : null

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch
          collection="goldcanna"
          suggestions={SUGGESTIONS}
          initialQuery={q}
          initialSearchData={initialSearchData}
          defaultResultsPerPage={resultsPerPage}
        />
        <BudtenderTrigger collection="goldcanna" />
      </main>
    </>
  )
}
