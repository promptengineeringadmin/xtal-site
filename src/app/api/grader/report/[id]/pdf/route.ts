import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { getReport } from "@/lib/grader/logger"
import { GraderPdfDocument } from "@/lib/grader/pdf-document"

export const maxDuration = 30

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

    const buffer = await renderToBuffer(GraderPdfDocument({ report }))
    const uint8 = new Uint8Array(buffer)

    const filename = `${report.storeName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-search-report.pdf`

    return new Response(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
