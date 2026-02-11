/**
 * Generate a PDF from an existing grader-output report.json
 * Usage: npx tsx scripts/generate-pdf.ts <path-to-report.json> [output.pdf]
 */

import { renderToFile } from "@react-pdf/renderer"
import { GraderPdfDocument } from "../lib/grader/pdf-document"
import * as fs from "fs"
import * as path from "path"

async function main() {
  const reportPath = process.argv[2]
  if (!reportPath) {
    console.error("Usage: npx tsx scripts/generate-pdf.ts <path-to-report.json> [output.pdf]")
    process.exit(1)
  }

  const reportJson = fs.readFileSync(reportPath, "utf-8")
  const report = JSON.parse(reportJson)

  // Add missing fields if this is a raw report from run-grader.ts
  if (!report.id) report.id = "test-" + Date.now()
  if (!report.emailCaptured) report.emailCaptured = false

  const outputPath = process.argv[3] || path.join(
    path.dirname(reportPath),
    `${report.storeName?.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "report"}-search-report.pdf`
  )

  console.log(`Generating PDF for ${report.storeName || "Unknown Store"}...`)
  console.log(`  Score: ${report.overallScore}/100 (${report.overallGrade})`)
  console.log(`  Dimensions: ${report.dimensions?.length || 0}`)
  console.log(`  Recommendations: ${report.recommendations?.length || 0}`)

  await renderToFile(GraderPdfDocument({ report }), outputPath)

  console.log(`\nPDF saved to: ${outputPath}`)
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`)
}

main().catch((err) => {
  console.error("PDF generation failed:", err)
  process.exit(1)
})
