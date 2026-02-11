import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"

export const metadata: Metadata = {
  title: "Try XTAL Search | Live AI Product Discovery Demo",
  description:
    "Experience AI-powered product search. Try natural language queries and see how XTAL understands intent, not just keywords.",
}

export default function TryPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch />
      </main>
    </>
  )
}
