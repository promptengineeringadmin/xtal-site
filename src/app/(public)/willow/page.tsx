import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"

export const metadata: Metadata = {
  title: "Willow Home Goods | XTAL AI Search Demo",
  description:
    "AI-powered product search demo for Willow's home goods catalog.",
}

export default function WillowPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch collection="willow" />
      </main>
    </>
  )
}
