import { notFound } from "next/navigation"
import { getAllCollections } from "@/lib/admin/demo-collections"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const collections = await getAllCollections()
  const demo = collections.find((c) => c.id === slug)
  if (!demo) return { title: "Demo Not Found" }
  return {
    title: `${demo.label} | XTAL AI Search Demo`,
    description: `AI-powered product search demo for ${demo.label}.`,
  }
}

export default async function DemoPage({ params }: Props) {
  const { slug } = await params
  const collections = await getAllCollections()
  const demo = collections.find((c) => c.id === slug)

  if (!demo) notFound()

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch collection={slug} />
      </main>
    </>
  )
}
