import { NextResponse } from "next/server"
import { getReport } from "@/lib/grader/logger"

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

    // Verify the report exists before launching a browser
    const report = await getReport(id)

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Dynamically import Playwright + Chromium (server-side only)
    const chromium = (await import("@sparticuz/chromium")).default
    const { chromium: playwright } = await import("playwright-core")

    const browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    try {
      const page = await browser.newPage()

      // Build the URL for the shared report page
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

      await page.goto(`${baseUrl}/grade/${id}`, {
        waitUntil: "networkidle",
        timeout: 20_000,
      })

      // Generate PDF with print-optimized CSS
      const pdfBuffer = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: { top: "0.4in", right: "0.4in", bottom: "0.4in", left: "0.4in" },
      })

      const filename = `${report.storeName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-search-report.pdf`

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, max-age=3600",
        },
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
