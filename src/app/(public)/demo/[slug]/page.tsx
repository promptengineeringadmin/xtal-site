import { notFound } from "next/navigation"
import { getAllCollections } from "@/lib/admin/demo-collections"
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"
import { serverSearch } from "@/lib/server-search"
import { getResultsPerPage } from "@/lib/admin/admin-settings"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
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

export default async function DemoPage({ params, searchParams }: Props) {
  const [{ slug }, { q }, collections] = await Promise.all([
    params,
    searchParams,
    getAllCollections(),
  ])
  const demo = collections.find((c) => c.id === slug)

  if (!demo) notFound()

  const resultsPerPage = await getResultsPerPage(slug)
  const initialSearchData = q ? await serverSearch(q, slug, resultsPerPage) : null

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch collection={slug} suggestions={demo.suggestions} initialQuery={q} initialSearchData={initialSearchData} defaultResultsPerPage={resultsPerPage} />
      </main>
    </>
  )
}
