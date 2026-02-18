import { Metadata } from "next"
import { getAllCollections } from "@/lib/admin/demo-collections"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"
import { serverSearch } from "@/lib/server-search"

export const metadata: Metadata = {
  title: "Willow Home Goods | XTAL AI Search Demo",
  description:
    "AI-powered product search demo for Willow's home goods catalog.",
}

export default async function WillowPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, collections] = await Promise.all([
    searchParams,
    getAllCollections(),
  ])
  const willow = collections.find((c) => c.id === "willow")
  const initialSearchData = q ? await serverSearch(q, "willow") : null

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch collection="willow" suggestions={willow?.suggestions} initialQuery={q} initialSearchData={initialSearchData} />
      </main>
    </>
  )
}
