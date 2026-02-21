import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { GraderReport } from "@/lib/grader/types"
import PrintReport from "@/components/grader/print/PrintReport"

export const metadata: Metadata = {
  robots: "noindex",
}

async function getReport(id: string): Promise<GraderReport | null> {
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

export default async function PrintReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const report = await getReport(id)

  if (!report) {
    notFound()
  }

  return <PrintReport report={report} />
}
