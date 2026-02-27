import type { Browser, Page } from "playwright-core"
import type { MerchantConfig, QueryComparison, MerchantResult, XtalResult } from "./types"
import { readFileSync } from "fs"
import { resolve } from "path"

const SLIDE_W = 1920
const SLIDE_H = 1080

// Read the real XTAL logo SVG and base64-encode to avoid Playwright SVG transform rendering bugs
const XTAL_LOGO_PATH = resolve(__dirname, "../../public/xtal-logo-white.svg")
const XTAL_LOGO_B64 = readFileSync(XTAL_LOGO_PATH).toString("base64")
const xtalLogoImg = (w: number, h: number) =>
  `<img src="data:image/svg+xml;base64,${XTAL_LOGO_B64}" width="${w}" height="${h}" style="display:block;">`

const CATEGORY_LABELS: Record<string, string> = {
  natural_language: "Natural Language",
  typo: "Typo Tolerance",
  synonym: "Synonym Handling",
  long_tail: "Long-Tail",
  category: "Category Browse",
  use_case: "Use Case",
  budget: "Budget Search",
  gift: "Gift / Occasion",
}

function formatPrice(price: number | number[] | undefined): string {
  if (price === undefined || price === null) return ""
  const val = Array.isArray(price) ? price[0] : price
  return `$${val.toFixed(2)}`
}

function renderStars(rating: number | undefined): string {
  if (!rating) return ""
  const full = Math.floor(rating)
  const half = rating - full >= 0.25 ? 1 : 0
  const empty = 5 - full - half
  return (
    '<span style="color:#FFB800;font-size:14px;letter-spacing:-1px;">' +
    "★".repeat(full) +
    (half ? "⯨" : "") +
    '<span style="color:#ccc;">' +
    "★".repeat(empty) +
    "</span>" +
    `<span style="color:#888;font-size:12px;margin-left:3px;">${rating.toFixed(1)}</span>` +
    "</span>"
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + "…"
}

function merchantResultCard(r: MerchantResult, idx: number): string {
  const img = r.imageUrl
    ? `<img src="${escapeHtml(r.imageUrl)}" style="width:90px;height:90px;object-fit:contain;border-radius:8px;background:#f5f5f5;flex-shrink:0;" onerror="this.style.display='none'">`
    : `<div style="width:90px;height:90px;border-radius:8px;background:#f0f0f0;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:11px;">No img</div>`

  return `<div style="display:flex;gap:14px;align-items:flex-start;padding:10px 0;${idx > 0 ? "border-top:1px solid #eee;" : ""}">
    ${img}
    <div style="min-width:0;flex:1;">
      <div style="font-size:15px;font-weight:500;color:#1a1a1a;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(truncate(r.title, 90))}</div>
      <div style="margin-top:5px;">
        ${r.price ? `<span style="font-size:17px;font-weight:700;color:#1a1a1a;">${formatPrice(r.price)}</span>` : ""}
      </div>
      ${r.rating ? `<div style="margin-top:3px;">${renderStars(r.rating)}</div>` : ""}
    </div>
  </div>`
}

function xtalResultCard(r: XtalResult, idx: number): string {
  const img = r.imageUrl
    ? `<img src="${escapeHtml(r.imageUrl)}" style="width:90px;height:90px;object-fit:contain;border-radius:8px;background:#f5f5f5;flex-shrink:0;" onerror="this.style.display='none'">`
    : `<div style="width:90px;height:90px;border-radius:8px;background:#f0f0f0;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:11px;">No img</div>`

  return `<div style="display:flex;gap:14px;align-items:flex-start;padding:10px 0;${idx > 0 ? "border-top:1px solid #eee;" : ""}">
    ${img}
    <div style="min-width:0;flex:1;">
      <div style="font-size:15px;font-weight:500;color:#1a1a1a;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(truncate(r.title, 90))}</div>
      <div style="margin-top:5px;">
        ${r.price ? `<span style="font-size:17px;font-weight:700;color:#1a1a1a;">${formatPrice(r.price)}</span>` : ""}
      </div>
    </div>
  </div>`
}

export function buildComparisonSlideHtml(
  comparison: QueryComparison,
  slideIndex: number,
  totalSlides: number,
  merchant: MerchantConfig,
): string {
  const categoryLabel = CATEGORY_LABELS[comparison.category] || comparison.category
  const merchantResults = comparison.merchant.results.slice(0, 4)
  const xtalResults = comparison.xtal.results.slice(0, 4)

  const merchantError = comparison.merchant.error
    ? `<div style="padding:20px;text-align:center;color:#999;font-style:italic;">${escapeHtml(comparison.merchant.error)}</div>`
    : ""

  const merchantEmpty =
    !comparison.merchant.error && merchantResults.length === 0
      ? `<div style="padding:40px 20px;text-align:center;color:#cc0000;font-weight:600;">0 results found</div>`
      : ""

  const xtalEmpty =
    xtalResults.length === 0
      ? `<div style="padding:40px 20px;text-align:center;color:#cc0000;font-weight:600;">0 results found</div>`
      : ""

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${SLIDE_W}px; height:${SLIDE_H}px; font-family:'Inter',system-ui,-apple-system,sans-serif; background:#FCFDFF; overflow:hidden; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
</style>
</head>
<body>
<div style="width:${SLIDE_W}px;height:${SLIDE_H}px;display:flex;flex-direction:column;">

  <!-- Header -->
  <div style="background:#0F1A35;padding:24px 48px 18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <span style="color:rgba(255,255,255,0.5);font-size:14px;font-weight:500;letter-spacing:0.05em;">SEARCH TEARDOWN</span>
      <span style="color:rgba(255,255,255,0.4);font-size:14px;">${slideIndex} / ${totalSlides}</span>
    </div>
    <div style="color:white;font-size:30px;font-weight:700;line-height:1.2;margin-bottom:10px;">"${escapeHtml(truncate(comparison.query, 80))}"</div>
    <div style="display:inline-block;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8);font-size:12px;font-weight:500;padding:4px 12px;border-radius:100px;letter-spacing:0.03em;">${categoryLabel}</div>
  </div>

  <!-- Column Headers -->
  <div style="display:flex;border-bottom:2px solid #eee;">
    <div style="flex:1;padding:14px 36px;display:flex;align-items:center;gap:8px;border-right:1px solid #eee;">
      <div style="width:10px;height:10px;border-radius:50%;background:${merchant.primaryColor};"></div>
      <span style="font-size:16px;font-weight:700;color:#333;">${escapeHtml(merchant.name)}</span>
    </div>
    <div style="flex:1;padding:14px 36px;display:flex;align-items:center;gap:8px;">
      <div style="width:10px;height:10px;border-radius:50%;background:#1B2D5B;"></div>
      <span style="font-size:16px;font-weight:700;color:#1B2D5B;">XTAL Search</span>
    </div>
  </div>

  <!-- Results Columns -->
  <div style="display:flex;flex:1;overflow:hidden;">
    <!-- Merchant Column -->
    <div style="flex:1;padding:10px 36px;border-right:1px solid #eee;">
      ${merchantError}
      ${merchantEmpty}
      ${merchantResults.map((r, i) => merchantResultCard(r, i)).join("")}
    </div>
    <!-- XTAL Column -->
    <div style="flex:1;padding:10px 36px;background:rgba(27,45,91,0.02);">
      ${xtalEmpty}
      ${xtalResults.map((r, i) => xtalResultCard(r, i)).join("")}
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#0F1A35;padding:10px 48px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:8px;">
      ${xtalLogoImg(28, 28)}
      <span style="color:white;font-size:14px;font-weight:600;letter-spacing:0.15em;">XTAL</span>
    </div>
    <span style="color:rgba(255,255,255,0.5);font-size:12px;">xtalsearch.com</span>
  </div>
</div>
</body>
</html>`
}

export function buildTitleSlideHtml(
  merchant: MerchantConfig,
  date: string,
  totalQueries: number,
): string {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${SLIDE_W}px; height:${SLIDE_H}px; font-family:'Inter',system-ui,-apple-system,sans-serif; overflow:hidden; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
</style>
</head>
<body>
<div style="width:${SLIDE_W}px;height:${SLIDE_H}px;background:linear-gradient(155deg,#0F1A35 0%,#1B2D5B 50%,#2A4080 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;">

  <div style="margin-bottom:40px;">
    ${xtalLogoImg(72, 72)}
  </div>

  <div style="color:rgba(255,255,255,0.5);font-size:16px;font-weight:500;letter-spacing:0.25em;margin-bottom:24px;">SEARCH TEARDOWN</div>

  <div style="color:white;font-size:56px;font-weight:900;line-height:1.1;margin-bottom:32px;">${escapeHtml(merchant.name)} vs. XTAL</div>

  <div style="color:rgba(255,255,255,0.7);font-size:22px;font-weight:400;line-height:1.5;max-width:800px;margin-bottom:48px;">
    ${totalQueries} real shopper queries.<br>
    Their search vs. ours.<br>
    Side by side.
  </div>

  <div style="width:80px;height:2px;background:rgba(255,255,255,0.2);margin-bottom:24px;"></div>

  <div style="color:rgba(255,255,255,0.4);font-size:14px;">${formattedDate}</div>
</div>
</body>
</html>`
}

export function buildCtaSlideHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${SLIDE_W}px; height:${SLIDE_H}px; font-family:'Inter',system-ui,-apple-system,sans-serif; overflow:hidden; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
</style>
</head>
<body>
<div style="width:${SLIDE_W}px;height:${SLIDE_H}px;background:linear-gradient(155deg,#0F1A35 0%,#1B2D5B 50%,#2A4080 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px;position:relative;">

  <div style="color:white;font-size:48px;font-weight:800;line-height:1.15;max-width:900px;margin-bottom:40px;">
    Is your site search<br>leaving money on the table?
  </div>

  <div style="color:rgba(255,255,255,0.6);font-size:22px;font-weight:400;line-height:1.6;max-width:700px;margin-bottom:48px;">
    Get a free AI-powered search health report for your store in under 60 seconds.
  </div>

  <div style="background:white;color:#1B2D5B;font-size:22px;font-weight:700;padding:18px 56px;border-radius:12px;margin-bottom:16px;">
    xtalsearch.com/grade
  </div>

  <div style="color:rgba(255,255,255,0.4);font-size:15px;margin-top:8px;">Free · No signup required · 60-second analysis</div>

  <div style="position:absolute;bottom:36px;display:flex;align-items:center;gap:10px;">
    ${xtalLogoImg(28, 28)}
    <span style="color:white;font-size:16px;font-weight:600;letter-spacing:0.15em;">XTAL</span>
  </div>
</div>
</body>
</html>`
}

export async function renderSlideToBuffer(
  page: Page,
  html: string,
): Promise<Buffer> {
  await page.setContent(html, { waitUntil: "networkidle", timeout: 15_000 })
  // Extra wait for images to load
  await page.waitForTimeout(500)
  return (await page.screenshot({
    clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H },
    type: "png",
  })) as Buffer
}
