import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"
import { serverSearch } from "@/lib/server-search"

export const metadata: Metadata = {
  title: "Try XTAL Search | Live AI Product Discovery Demo",
  description:
    "Experience AI-powered product search. Try natural language queries and see how XTAL understands intent, not just keywords.",
}

export default async function TryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const initialSearchData = q ? await serverSearch(q) : null

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch initialQuery={q} initialSearchData={initialSearchData} />
      </main>
    </>
  )
}
