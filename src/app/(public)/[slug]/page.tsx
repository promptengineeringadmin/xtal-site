import { notFound } from "next/navigation"
import { Metadata } from "next"
import { getAllCollections } from "@/lib/admin/demo-collections"
import { serverSearch } from "@/lib/server-search"
import { getResultsPerPage } from "@/lib/admin/admin-settings"
import { getShowcaseQueries, getExtraSuggestions, fetchShowcaseData } from "@/lib/showcase"

// Import JSON data
import howItWorksData from "@/data/howitworks.json"
import pricingData from "@/data/pricing.json"
import useCasesData from "@/data/use-cases.json"

// Import Component Blocks
import Navbar from "@/components/Navbar"
import TrySearch from "@/components/try/TrySearch"
import PageHero from "@/components/blocks/PageHero"
import FeatureShowcase from "@/components/blocks/FeatureShowcase"
import PricingCards from "@/components/blocks/PricingCards"
import ComparisonGrid from "@/components/blocks/ComparisonGrid"
import FAQAccordion from "@/components/blocks/FAQAccordion"
import PageCTA from "@/components/blocks/PageCTA"
import StatsBar from "@/components/blocks/StatsBar"
import TechSpecs from "@/components/blocks/TechSpecs"
import FeatureDetail from "@/components/blocks/FeatureDetail"
import CostCalculator from "@/components/blocks/CostCalculator"
import ComparisonSection from "@/components/blocks/ComparisonSection"
import BeforeAfterShowcase from "@/components/blocks/BeforeAfterShowcase"
import ValueComparison from "@/components/blocks/ValueComparison"
import UseCaseGrid from "@/components/blocks/UseCaseGrid"

// Map JSON "type" to React Components
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  "page-hero": PageHero,
  "feature-showcase": FeatureShowcase,
  "pricing-cards": PricingCards,
  "comparison-grid": ComparisonGrid,
  "competitor-pricing": ComparisonGrid,
  "faq-accordion": FAQAccordion,
  "page-cta": PageCTA,
  "stats-bar": StatsBar,
  "use-case-grid": UseCaseGrid,
  "process-deep-dive": FeatureShowcase,
  "value-comparison": ValueComparison,
  "tech-specs": TechSpecs,
  "feature-detail": FeatureDetail,
  "cost-calculator": CostCalculator,
  "comparison-section": ComparisonSection,
  "before-after-showcase": BeforeAfterShowcase,
}

// Page data mapping (JSON-driven secondary pages)
const PAGE_DATA: Record<string, any> = {
  "how-it-works": howItWorksData,
  "pricing": pricingData,
  "use-cases": useCasesData,
}

// Generate static params for JSON pages only
// Collection pages are fully dynamic (ISR via revalidate)
export function generateStaticParams() {
  return [
    { slug: "how-it-works" },
    { slug: "pricing" },
    { slug: "use-cases" },
  ]
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}

// Generate metadata dynamically — handles both JSON pages and collection pages
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  // JSON page metadata
  const data = PAGE_DATA[slug]
  if (data) {
    return {
      title: data.meta.title,
      description: data.meta.description,
      openGraph: {
        title: data.meta.title,
        description: data.meta.description,
        images: data.meta.ogImage ? [data.meta.ogImage] : [],
      },
    }
  }

  // Collection page metadata
  const collections = await getAllCollections()
  const collection = collections.find((c) => c.id === slug)
  if (collection) {
    return {
      title: `${collection.label} | XTAL AI Search Demo`,
      description: `AI-powered product search demo for ${collection.label}.`,
    }
  }

  return { title: "Page Not Found | XTAL Search" }
}

export default async function DynamicPage({ params, searchParams }: PageProps) {
  const { slug } = await params

  // 1. Check JSON-driven secondary pages first
  const data = PAGE_DATA[slug]
  if (data) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#FCFDFF]">
          {data.sections.map((section: any, index: number) => {
            const Component = COMPONENT_MAP[section.type]
            if (!Component) {
              console.warn(`Unknown component type: ${section.type}`)
              return null
            }
            return (
              <section key={section.id || index} id={section.id} className="relative">
                <Component {...section} />
              </section>
            )
          })}
        </main>
      </>
    )
  }

  // 2. Check dynamic collections (hardcoded + Redis)
  const [{ q }, collections] = await Promise.all([
    searchParams,
    getAllCollections(),
  ])
  const collection = collections.find((c) => c.id === slug)

  if (!collection) notFound()

  const resultsPerPage = await getResultsPerPage(slug)
  const initialSearchData = q ? await serverSearch(q, slug, resultsPerPage) : null

  let showcaseData = null
  if (!q) {
    const queries = getShowcaseQueries(slug, collection.suggestions)
    if (queries) showcaseData = await fetchShowcaseData(queries, slug)
  }
  const extraSuggestions = getExtraSuggestions(slug, collection.suggestions)

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch
          collection={slug}
          suggestions={collection.suggestions}
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
