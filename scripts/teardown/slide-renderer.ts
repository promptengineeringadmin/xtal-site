import type { Browser, Page } from "playwright-core"
import type { MerchantConfig, QueryComparison, MerchantResult, XtalResult, TeardownReport } from "./types"
import type { DimensionSummary } from "./query-grader"
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

// ── Grade badge colors ──────────────────────────────────────

function gradeColor(letter: string): { bg: string; text: string } {
  switch (letter) {
    case "A": return { bg: "#16a34a", text: "#ffffff" }
    case "B": return { bg: "#65a30d", text: "#ffffff" }
    case "C": return { bg: "#eab308", text: "#1a1a1a" }
    case "D": return { bg: "#ea580c", text: "#ffffff" }
    case "F": return { bg: "#dc2626", text: "#ffffff" }
    default: return { bg: "#6b7280", text: "#ffffff" }
  }
}

function gradeBadgeHtml(grade: { letter: string; score: number; reason: string }): string {
  const c = gradeColor(grade.letter)
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
    <div style="width:48px;height:48px;border-radius:50%;background:${c.bg};color:${c.text};font-size:24px;font-weight:800;display:flex;align-items:center;justify-content:center;">${grade.letter}</div>
    <div style="font-size:11px;color:#888;text-align:center;max-width:140px;line-height:1.3;">${escapeHtml(grade.reason)}</div>
  </div>`
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
    <div style="flex:1;padding:14px 36px;display:flex;align-items:center;justify-content:space-between;border-right:1px solid #eee;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${merchant.primaryColor};"></div>
        <span style="font-size:16px;font-weight:700;color:#333;">${escapeHtml(merchant.name)}</span>
      </div>
      ${comparison.grade ? gradeBadgeHtml(comparison.grade) : ""}
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

export function buildCoverSheetHtml(
  merchant: MerchantConfig,
  totalQueries: number,
): string {
  const categories = [
    { key: "natural_language", label: "Natural Language", desc: "Conversational queries like a real shopper would type" },
    { key: "budget", label: "Budget Search", desc: "Price-constrained queries with dollar amounts" },
    { key: "use_case", label: "Use Case", desc: "Searching by intended purpose or scenario" },
    { key: "synonym", label: "Synonym Handling", desc: "Alternative words for the same product" },
    { key: "long_tail", label: "Long-Tail", desc: "Multi-attribute, specific product descriptions" },
    { key: "category", label: "Category Browse", desc: "Broad category exploration queries" },
    { key: "typo", label: "Typo Tolerance", desc: "Misspelled queries that still need results" },
    { key: "gift", label: "Gift / Occasion", desc: "Shopping for others with vague intent" },
  ]

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${SLIDE_W}px; height:${SLIDE_H}px; font-family:'Inter',system-ui,-apple-system,sans-serif; overflow:hidden; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
</style>
</head>
<body>
<div style="width:${SLIDE_W}px;height:${SLIDE_H}px;background:#FCFDFF;display:flex;flex-direction:column;">

  <!-- Header -->
  <div style="background:#0F1A35;padding:28px 48px;">
    <div style="color:rgba(255,255,255,0.5);font-size:14px;font-weight:500;letter-spacing:0.05em;margin-bottom:8px;">WHAT WE TESTED</div>
    <div style="color:white;font-size:28px;font-weight:700;">${totalQueries} queries across 8 search categories</div>
  </div>

  <!-- Stats bar -->
  <div style="background:#f0f4f8;padding:16px 48px;display:flex;gap:40px;border-bottom:1px solid #e2e8f0;">
    <div><span style="font-size:28px;font-weight:800;color:#dc2626;">43%</span><span style="font-size:13px;color:#666;margin-left:8px;">of shoppers abandon after a failed search</span></div>
    <div><span style="font-size:28px;font-weight:800;color:#ea580c;">80%</span><span style="font-size:13px;color:#666;margin-left:8px;">bounce immediately on zero results</span></div>
    <div><span style="font-size:28px;font-weight:800;color:#16a34a;">2x</span><span style="font-size:13px;color:#666;margin-left:8px;">higher conversion rate from searchers</span></div>
  </div>

  <!-- Category grid -->
  <div style="flex:1;padding:24px 48px;display:grid;grid-template-columns:1fr 1fr;gap:12px 32px;">
    ${categories.map((cat, i) => `
      <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;">
        <div style="width:32px;height:32px;border-radius:8px;background:#1B2D5B;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</div>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a1a1a;">${cat.label}</div>
          <div style="font-size:13px;color:#666;line-height:1.4;">${cat.desc}</div>
        </div>
      </div>
    `).join("")}
  </div>

  <!-- Footer -->
  <div style="background:#0F1A35;padding:12px 48px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:8px;">
      ${xtalLogoImg(24, 24)}
      <span style="color:white;font-size:13px;font-weight:600;letter-spacing:0.15em;">XTAL</span>
    </div>
    <span style="color:rgba(255,255,255,0.5);font-size:12px;">Sources: Econsultancy, Forrester, Algolia</span>
  </div>
</div>
</body>
</html>`
}

export function buildScorecardHtml(
  merchant: MerchantConfig,
  overallScore: number,
  overallGrade: string,
  dimensionScores: Record<string, DimensionSummary>,
  revenueImpact?: { monthlyLost: number; annualLost: number },
): string {
  const gc = gradeColor(overallGrade)

  // Build dimension bars
  const dimOrder = [
    "natural_language", "budget", "use_case", "synonym",
    "long_tail", "category", "typo", "gift",
  ]
  const dimBars = dimOrder
    .filter((k) => dimensionScores[k])
    .map((k) => {
      const d = dimensionScores[k]
      const dc = gradeColor(d.grade)
      const label = CATEGORY_LABELS[k] || k
      const barWidth = Math.max(d.avgScore, 3) // min visible width
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:140px;font-size:13px;font-weight:500;color:#333;text-align:right;">${label}</div>
        <div style="flex:1;height:28px;background:#f0f4f8;border-radius:6px;overflow:hidden;position:relative;">
          <div style="width:${barWidth}%;height:100%;background:${dc.bg};border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">
            <span style="color:${dc.text};font-size:12px;font-weight:700;">${d.avgScore}</span>
          </div>
        </div>
        <div style="width:36px;height:36px;border-radius:50%;background:${dc.bg};color:${dc.text};font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center;">${d.grade}</div>
        <div style="width:40px;font-size:11px;color:#888;">${d.queryCount}q</div>
      </div>`
    })
    .join("")

  const revenueBlock = revenueImpact
    ? `<div style="margin-top:20px;padding:16px 24px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;display:flex;gap:40px;">
        <div>
          <div style="font-size:12px;color:#991b1b;font-weight:500;">Est. Monthly Revenue Left on Table</div>
          <div style="font-size:28px;font-weight:800;color:#dc2626;">$${revenueImpact.monthlyLost.toLocaleString()}</div>
        </div>
        <div>
          <div style="font-size:12px;color:#991b1b;font-weight:500;">Annualized Impact</div>
          <div style="font-size:28px;font-weight:800;color:#dc2626;">$${revenueImpact.annualLost.toLocaleString()}</div>
        </div>
      </div>`
    : ""

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
<div style="width:${SLIDE_W}px;height:${SLIDE_H}px;display:flex;flex-direction:column;">

  <!-- Header -->
  <div style="background:#0F1A35;padding:24px 48px;">
    <div style="color:rgba(255,255,255,0.5);font-size:14px;font-weight:500;letter-spacing:0.05em;margin-bottom:6px;">SEARCH SCORECARD</div>
    <div style="color:white;font-size:28px;font-weight:700;">${escapeHtml(merchant.name)} — Search Quality Assessment</div>
  </div>

  <!-- Content -->
  <div style="flex:1;padding:28px 48px;display:flex;gap:40px;">

    <!-- Left: Overall score -->
    <div style="width:260px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:20px;">
      <div style="width:140px;height:140px;border-radius:50%;background:${gc.bg};color:${gc.text};font-size:64px;font-weight:900;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">${overallGrade}</div>
      <div style="font-size:48px;font-weight:800;color:#1a1a1a;">${overallScore}</div>
      <div style="font-size:14px;color:#888;margin-top:4px;">out of 100</div>
      ${revenueBlock}
    </div>

    <!-- Right: Dimension bars -->
    <div style="flex:1;padding-top:10px;">
      <div style="font-size:15px;font-weight:700;color:#333;margin-bottom:16px;">Category Breakdown</div>
      ${dimBars}
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#0F1A35;padding:10px 48px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:8px;">
      ${xtalLogoImg(24, 24)}
      <span style="color:white;font-size:13px;font-weight:600;letter-spacing:0.15em;">XTAL</span>
    </div>
    <span style="color:rgba(255,255,255,0.5);font-size:12px;">xtalsearch.com</span>
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
