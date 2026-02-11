import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import ScoreHero from "@/components/grader/ScoreHero"
import DimensionGrid from "@/components/grader/DimensionGrid"
import RevenueImpact from "@/components/grader/RevenueImpact"
import RecommendationList from "@/components/grader/RecommendationList"
import ShareBar from "@/components/grader/ShareBar"
import type { GraderReport } from "@/lib/grader/types"

async function getReport(id: string): Promise<GraderReport | null> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  try {
    const res = await fetch(`${baseUrl}/api/grader/report/${id}`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.report ?? data
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const report = await getReport(id)

  if (!report) {
    return { title: "Report Not Found | XTAL Search" }
  }

  const title = `${report.storeName} scored ${report.overallScore}/100 on search health`
  const description = `${report.storeName} received a grade of ${report.overallGrade} on their site search. ${report.summary}`

  return {
    title: `${title} | XTAL Search`,
    description,
    openGraph: {
      title,
      description,
      url: `/grade/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const report = await getReport(id)

  if (!report) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#FCFDFF]">
      <Navbar />

      <div className="pt-16">
        <ScoreHero
          score={report.overallScore}
          grade={report.overallGrade}
          storeName={report.storeName}
          storeUrl={report.storeUrl}
        />

        <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
          <p className="text-lg text-slate-600 text-center">
            {report.summary}
          </p>

          <div>
            <h3 className="text-xl font-bold text-xtal-navy mb-6">
              Search Health Breakdown
            </h3>
            <DimensionGrid
              dimensions={report.dimensions}
              showDetail={true}
            />
          </div>

          <RevenueImpact
            impact={report.revenueImpact}
            overallScore={report.overallScore}
          />

          <ShareBar
            reportId={report.id}
            storeName={report.storeName}
            score={report.overallScore}
          />

          <RecommendationList recommendations={report.recommendations} />

          {/* CTA */}
          <div className="text-center pt-8 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-4">
              Want to see how your search could perform?
            </p>
            <a
              href="/grade"
              className="inline-block px-8 py-4 bg-xtal-navy text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-900/20"
            >
              Grade Your Store
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
