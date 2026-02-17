import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"

export const metadata: Metadata = {
  title: "Best Buy | XTAL AI Search Demo",
  description:
    "AI-powered product search across Best Buy's full catalog. Try natural language queries to discover products.",
}

export default function BestBuyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch collection="bestbuy" />
      </main>
    </>
  )
}
