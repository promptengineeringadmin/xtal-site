/**
 * Generate a PDF of the XTAL Integration Guide docs page.
 *
 * Usage:
 *   npx ts-node scripts/generate-integration-pdf.ts
 *
 * Prerequisites:
 *   - The dev server must be running (npm run dev) on localhost:3000
 *   - Or pass a custom URL: npx ts-node scripts/generate-integration-pdf.ts https://xtalsearch.com
 *
 * Alternative (no script needed):
 *   Open /docs/integration in Chrome → Print → Save as PDF
 */

import { chromium } from "playwright"
import { writeFileSync } from "fs"
import { resolve } from "path"

async function generatePdf() {
  const baseUrl = process.argv[2] || "http://localhost:3000"
  const url = `${baseUrl}/docs/integration`
  const outputPath = resolve(__dirname, "../docs/xtal-integration-guide.pdf")

  console.log(`Generating PDF from: ${url}`)

  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage()

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 20_000,
    })

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.4in", right: "0.4in", bottom: "0.4in", left: "0.4in" },
    })

    writeFileSync(outputPath, pdfBuffer)
    console.log(`PDF saved to: ${outputPath}`)
  } finally {
    await browser.close()
  }
}

generatePdf().catch((err) => {
  console.error("PDF generation failed:", err)
  process.exit(1)
})
