import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import ReportLayout from "@/components/grader/report/ReportLayout"
import type { GraderReport } from "@/lib/grader/types"

async function getReport(id: string): Promise<GraderReport | null> {
  // Use the public production domain — NOT VERCEL_URL, which resolves to a
  // deployment-specific URL behind Vercel's auth protection.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://xtalsearch.com"

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
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="pt-16">
        <ReportLayout report={report} />
      </div>

      {/* CTA — hidden in print */}
      <div className="text-center py-12 print:hidden">
        <p className="text-sm text-slate-500 mb-4">
          Want to see how your search could perform?
        </p>
        <a
          href="/grade"
          className="inline-block px-8 py-4 bg-[#0F172A] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-900/20"
        >
          Grade Your Store
        </a>
      </div>
    </main>
  )
}
