import type { Page } from "playwright-core"

const SLIDE_W = 1080
const SLIDE_H = 1350

/**
 * Assemble slide PNG buffers into a multi-page carousel PDF.
 * Each PNG becomes one full-bleed page at 1080x1350px.
 */
export async function assemblePdf(
  slides: Buffer[],
  outputPath: string,
  page: Page,
): Promise<void> {
  // Convert buffers to base64 data URIs
  const slideDataUris = slides.map(
    (buf) => `data:image/png;base64,${buf.toString("base64")}`,
  )

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: ${SLIDE_W}px ${SLIDE_H}px; margin: 0; }
  body { width:${SLIDE_W}px; }
  .slide {
    width: ${SLIDE_W}px;
    height: ${SLIDE_H}px;
    page-break-after: always;
    overflow: hidden;
  }
  .slide:last-child {
    page-break-after: auto;
  }
  .slide img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
</head>
<body>
${slideDataUris.map((uri) => `<div class="slide"><img src="${uri}"></div>`).join("\n")}
</body>
</html>`

  await page.setContent(html, { waitUntil: "load", timeout: 30_000 })

  const pdfBuffer = await page.pdf({
    width: `${SLIDE_W}px`,
    height: `${SLIDE_H}px`,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  })

  const fs = await import("fs")
  fs.writeFileSync(outputPath, pdfBuffer)
}
