import { NextResponse } from "next/server"
import { getReport } from "@/lib/grader/logger"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const report = await getReport(id)

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Grader report fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    )
  }
}
