import type { Browser, Page } from "playwright-core"
import type { MerchantConfig, QueryComparison, QueryAnalysis, MerchantResult, XtalResult, TeardownReport } from "./types"
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
    '<span style="color:#FFB800;font-size:24px;letter-spacing:-1px;">' +
    "★".repeat(full) +
    (half ? "⯨" : "") +
    '<span style="color:#ccc;">' +
    "★".repeat(empty) +
    "</span>" +
    `<span style="color:#888;font-size:18px;margin-left:6px;">${rating.toFixed(1)}</span>` +
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
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
    <div style="width:80px;height:80px;border-radius:50%;background:${c.bg};color:${c.text};font-size:40px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px ${c.bg}40;">${grade.letter}</div>
    <div style="font-size:18px;color:#888;text-align:center;max-width:240px;line-height:1.4;">${escapeHtml(grade.reason)}</div>
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

// ── Compact card functions for 2×3 grid layout ──────────────

function merchantCardCompact(r: MerchantResult): string {
  const img = r.imageUrl
    ? `<img src="${escapeHtml(r.imageUrl)}" style="width:80px;height:80px;object-fit:contain;border-radius:6px;background:#f5f5f5;flex-shrink:0;" onerror="this.style.display='none'">`
    : `<div style="width:80px;height:80px;border-radius:6px;background:#f0f0f0;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;">No img</div>`

  return `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px;background:white;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.03);border:1px solid #f0f0f0;">
    ${img}
    <div style="min-width:0;flex:1;">
      <div style="font-size:15px;font-weight:500;color:#1a1a1a;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(truncate(r.title, 90))}</div>
      ${r.price ? `<div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-top:6px;">${formatPrice(r.price)}</div>` : ""}
    </div>
  </div>`
}

function xtalCardCompact(r: XtalResult): string {
  const img = r.imageUrl
    ? `<img src="${escapeHtml(r.imageUrl)}" style="width:80px;height:80px;object-fit:contain;border-radius:6px;background:#f5f5f5;flex-shrink:0;" onerror="this.style.display='none'">`
    : `<div style="width:80px;height:80px;border-radius:6px;background:#f0f0f0;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;">No img</div>`

  return `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px;background:white;border-radius:10px;box-shadow:0 6px 16px rgba(27,45,91,0.08);border:1px solid rgba(27,45,91,0.1);">
    ${img}
    <div style="min-width:0;flex:1;">
      <div style="font-size:15px;font-weight:500;color:#1a1a1a;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(truncate(r.title, 90))}</div>
      ${r.price ? `<div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-top:6px;">${formatPrice(r.price)}</div>` : ""}
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
  const merchantResults = comparison.merchant.results.slice(0, 6)
  const xtalResults = comparison.xtal.results.slice(0, 6)
  const analysis = comparison.analysis

  const merchantError = comparison.merchant.error
    ? `<div style="padding:24px;text-align:center;color:#999;font-style:italic;font-size:20px;">${escapeHtml(comparison.merchant.error)}</div>`
    : ""

  const merchantEmpty =
    !comparison.merchant.error && merchantResults.length === 0
      ? `<div style="padding:64px 32px;text-align:center;color:#cc0000;font-weight:600;font-size:28px;background:#fff5f5;border-radius:16px;border:2px dashed #fecaca;">0 results found<div style="font-size:18px;color:#dc2626;font-weight:400;margin-top:12px;">Shopper abandons search</div></div>`
      : ""

  const xtalEmpty =
    xtalResults.length === 0
      ? `<div style="padding:64px 32px;text-align:center;color:#cc0000;font-weight:600;font-size:28px;background:#fff5f5;border-radius:16px;border:2px dashed #fecaca;">0 results found</div>`
      : ""

  // Build 2×3 grid for merchant results
  const merchantGrid = merchantResults.length > 0
    ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${merchantResults.map((r) => merchantCardCompact(r)).join("")}
      </div>`
    : ""

  // Build 2×3 grid for XTAL results
  const xtalGrid = xtalResults.length > 0
    ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${xtalResults.map((r) => xtalCardCompact(r)).join("")}
      </div>`
    : ""

  // Analysis panel — natural height, generous padding. No flex:1.
  const analysisPanel = analysis
    ? `<div style="padding:12px 48px 8px;display:flex;gap:20px;">
        <div style="flex:1;background:white;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.04);border:1px solid #e2e8f0;padding:14px 18px;">
          <div style="font-size:12px;font-weight:700;color:#1B2D5B;letter-spacing:0.05em;">SHOPPER INTENT</div>
          <div style="font-size:14px;color:#333;line-height:1.5;margin-top:6px;">${escapeHtml(analysis.shopperIntent)}</div>
        </div>
        <div style="flex:1;background:white;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.04);border:1px solid #e2e8f0;padding:14px 18px;">
          <div style="font-size:12px;font-weight:700;color:#1B2D5B;letter-spacing:0.05em;">WHAT HAPPENED</div>
          <div style="font-size:14px;color:#333;line-height:1.5;margin-top:6px;">${escapeHtml(analysis.whatHappened)}</div>
        </div>
        <div style="flex:1;background:#fff5f5;border-radius:12px;box-shadow:0 4px 16px rgba(220,38,38,0.04);border:1px solid #fecaca;padding:14px 18px;">
          <div style="font-size:12px;font-weight:700;color:#dc2626;letter-spacing:0.05em;">CUSTOMER IMPACT</div>
          <div style="font-size:14px;color:#991b1b;line-height:1.5;margin-top:6px;">${escapeHtml(analysis.customerImpact)}</div>
        </div>
      </div>`
    : comparison.grade
      ? `<div style="padding:12px 48px 8px;">
          <div style="background:white;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.04);border:1px solid #e2e8f0;padding:14px 18px;">
            <div style="font-size:16px;color:#555;line-height:1.5;">${escapeHtml(comparison.grade.reason)}</div>
          </div>
        </div>`
      : ""

  // Grade bar
  const gradeBar = comparison.grade
    ? (() => {
        const gc = gradeColor(comparison.grade.letter)
        return `<div style="display:flex;align-items:center;gap:16px;padding:12px 48px;border-top:2px solid #e2e8f0;background:#fafbfc;">
          <div style="width:44px;height:44px;border-radius:50%;background:${gc.bg};color:${gc.text};font-size:22px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${comparison.grade.letter}</div>
          <div>
            <div style="font-size:18px;font-weight:600;color:#333;">${escapeHtml(comparison.grade.reason)}</div>
            <div style="font-size:14px;color:#888;margin-top:2px;">Score: ${comparison.grade.score}/100</div>
          </div>
        </div>`
      })()
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
  <div style="background:#0F1A35;padding:32px 64px 24px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <span style="color:rgba(255,255,255,0.5);font-size:18px;font-weight:600;letter-spacing:0.1em;">SEARCH TEARDOWN</span>
      <span style="color:rgba(255,255,255,0.4);font-size:18px;">${slideIndex} / ${totalSlides}</span>
    </div>
    <div style="color:white;font-size:42px;font-weight:700;line-height:1.3;margin-bottom:16px;">"${escapeHtml(truncate(comparison.query, 120))}"</div>
    <div style="display:inline-block;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.9);font-size:16px;font-weight:600;padding:6px 16px;border-radius:100px;letter-spacing:0.04em;">${categoryLabel}</div>
  </div>

  <!-- Column Headers -->
  <div style="display:flex;border-bottom:2px solid #eee;">
    <div style="flex:1;padding:16px 64px;display:flex;align-items:center;gap:12px;border-right:1px solid #eee;">
      <div style="width:12px;height:12px;border-radius:50%;background:${merchant.primaryColor};"></div>
      <span style="font-size:24px;font-weight:700;color:#333;">${escapeHtml(merchant.name)}</span>
      <span style="font-size:18px;color:#888;margin-left:auto;font-weight:500;">${comparison.merchant.resultCount} results</span>
    </div>
    <div style="flex:1;padding:16px 64px;display:flex;align-items:center;gap:12px;background:#f5f7fa;">
      <div style="width:12px;height:12px;border-radius:50%;background:#1B2D5B;"></div>
      <span style="font-size:24px;font-weight:700;color:#1B2D5B;">XTAL Search</span>
      <span style="font-size:18px;color:#888;margin-left:auto;font-weight:500;">${comparison.xtal.resultCount} results</span>
    </div>
  </div>

  <!-- Results Grid (2×3 per side) -->
  <div style="display:flex;flex:1;overflow:hidden;">
    <!-- Merchant Column -->
    <div style="flex:1;padding:20px 48px;border-right:1px solid #eee;display:flex;flex-direction:column;justify-content:flex-start;">
      ${merchantError}
      ${merchantEmpty}
      ${merchantGrid}
    </div>
    <!-- XTAL Column -->
    <div style="flex:1;padding:20px 48px;background:#f5f7fa;display:flex;flex-direction:column;justify-content:flex-start;">
      ${xtalEmpty}
      ${xtalGrid}
    </div>
  </div>

  <!-- Analysis Panel -->
  ${analysisPanel}

  <!-- Grade Bar -->
  ${gradeBar}

  <!-- Footer (margin-top:auto pins to bottom) -->
  <div style="background:#0F1A35;padding:16px 64px;display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
    <div style="display:flex;align-items:center;gap:12px;">
      ${xtalLogoImg(32, 32)}
      <span style="color:white;font-size:18px;font-weight:600;letter-spacing:0.15em;">XTAL</span>
    </div>
    <span style="color:rgba(255,255,255,0.5);font-size:16px;">xtalsearch.com</span>
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
  <div style="color:rgba(255,255,255,0.25);font-size:13px;margin-top:12px;">5-minute read</div>
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

  <div style="color:white;font-size:52px;font-weight:800;line-height:1.15;max-width:900px;margin-bottom:36px;">
    See the full picture.
  </div>

  <div style="color:rgba(255,255,255,0.6);font-size:20px;font-weight:400;line-height:1.65;max-width:740px;margin-bottom:48px;">
    This teardown covered 20 queries. The full search health report tests your store against 50+ ranking signals and returns a complete scorecard &mdash; free, in under 60 seconds.
  </div>

  <div style="background:white;color:#1B2D5B;font-size:22px;font-weight:700;padding:18px 56px;border-radius:12px;margin-bottom:16px;">
    xtalsearch.com/grade
  </div>

  <div style="color:rgba(255,255,255,0.35);font-size:14px;margin-top:12px;">Free &middot; No signup required &middot; 60 seconds</div>

  <div style="color:rgba(255,255,255,0.3);font-size:14px;margin-top:28px;">Or reply to this email. We&rsquo;ll walk you through your results in 15 minutes.</div>

  <div style="position:absolute;bottom:36px;display:flex;align-items:center;gap:10px;">
    ${xtalLogoImg(28, 28)}
    <span style="color:white;font-size:16px;font-weight:600;letter-spacing:0.15em;">XTAL</span>
  </div>
</div>
</body>
</html>`
}

export function buildIntroSlideHtml(
  merchant: MerchantConfig,
): string {
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
  <div style="background:#0F1A35;padding:28px 80px 20px;">
    <div style="color:rgba(255,255,255,0.5);font-size:16px;font-weight:600;letter-spacing:0.1em;margin-bottom:8px;">SEARCH TEARDOWN</div>
    <div style="color:white;font-size:40px;font-weight:700;">Why This Report Exists</div>
  </div>

  <!-- How to read -->
  <div style="padding:20px 80px 16px;border-bottom:1px solid #e2e8f0;">
    <div style="font-size:14px;font-weight:700;color:#1B2D5B;letter-spacing:0.1em;margin-bottom:10px;">HOW TO READ THIS REPORT</div>
    <div style="font-size:20px;color:#333;line-height:1.5;max-width:1400px;">
      We ran 20 real shopper queries against ${escapeHtml(merchant.name)}&rsquo;s site search and against XTAL&rsquo;s AI search engine &mdash; using the same product catalog. Each query is graded on whether a shopper would find what they came looking for. At the end, a scorecard shows where revenue is leaking and how much.
    </div>
  </div>

  <!-- Hero stats -->
  <div style="padding:24px 80px 16px;">
    <div style="font-size:14px;font-weight:700;color:#1B2D5B;letter-spacing:0.1em;margin-bottom:16px;">WHY SEARCH MATTERS</div>
    <div style="display:flex;gap:28px;">
      <div style="flex:1;background:#f8fafc;border-radius:12px;padding:24px 28px;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.03);">
        <div style="font-size:52px;font-weight:900;color:#1B2D5B;line-height:1;">44%</div>
        <div style="font-size:17px;color:#333;line-height:1.4;margin-top:10px;">of e-commerce revenue comes from search sessions</div>
        <div style="font-size:13px;color:#888;margin-top:10px;">&mdash; Constructor, 2025 (609M searches, 113 retail sites)</div>
      </div>
      <div style="flex:1;background:#f8fafc;border-radius:12px;padding:24px 28px;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.03);">
        <div style="font-size:52px;font-weight:900;color:#1B2D5B;line-height:1;">2.4&times;</div>
        <div style="font-size:17px;color:#333;line-height:1.4;margin-top:10px;">Searchers convert at 2.4&times; the rate of non-searchers</div>
        <div style="font-size:13px;color:#888;margin-top:10px;">&mdash; Forrester Research</div>
      </div>
      <div style="flex:1;background:#fff5f5;border-radius:12px;padding:24px 28px;border:1px solid #fecaca;box-shadow:0 4px 16px rgba(220,38,38,0.04);">
        <div style="font-size:52px;font-weight:900;color:#dc2626;line-height:1;">80%</div>
        <div style="font-size:17px;color:#333;line-height:1.4;margin-top:10px;">of shoppers leave after a failed search &mdash; and buy elsewhere</div>
        <div style="font-size:13px;color:#888;margin-top:10px;">&mdash; Google Cloud Retail Study</div>
      </div>
    </div>
  </div>

  <!-- Supporting stats -->
  <div style="padding:8px 80px 16px;display:flex;gap:28px;">
    <div style="flex:1;padding:14px 20px;background:#fef2f2;border-radius:10px;border-left:4px solid #dc2626;">
      <div style="font-size:16px;color:#333;line-height:1.4;"><strong style="color:#dc2626;">70%</strong> of e-commerce search engines fail to return relevant results for synonym queries like &ldquo;sofa&rdquo; vs. &ldquo;couch&rdquo;</div>
      <div style="font-size:12px;color:#888;margin-top:6px;">&mdash; Baymard Institute</div>
    </div>
    <div style="flex:1;padding:14px 20px;background:#fef2f2;border-radius:10px;border-left:4px solid #dc2626;">
      <div style="font-size:16px;color:#333;line-height:1.4;"><strong style="color:#dc2626;">31%</strong> of product-finding tasks end in complete failure, even when the store carries exactly what the shopper wants</div>
      <div style="font-size:12px;color:#888;margin-top:6px;">&mdash; Baymard Institute</div>
    </div>
  </div>

  <!-- Revenue framework -->
  <div style="padding:8px 80px 16px;">
    <div style="background:#f5f7fa;border-radius:12px;padding:18px 28px;border-left:4px solid #1B2D5B;">
      <div style="font-size:18px;color:#333;line-height:1.5;"><strong>The revenue math:</strong> If 44% of your revenue flows through search, and failed queries drive 80% of those shoppers elsewhere, every search failure has a direct cost. The scorecard at the end calculates yours.</div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:auto;background:#0F1A35;padding:14px 80px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:10px;">
      ${xtalLogoImg(28, 28)}
      <span style="color:white;font-size:16px;font-weight:600;letter-spacing:0.15em;">XTAL</span>
    </div>
    <span style="color:rgba(255,255,255,0.5);font-size:13px;">Sources: Constructor.io State of E-commerce Search 2025; Forrester Research; Google Cloud Retail; Baymard Institute</span>
  </div>
</div>
</body>
</html>`
}

export function buildQueryPreviewSlideHtml(
  merchant: MerchantConfig,
  comparisons: QueryComparison[],
): string {
  const categories = [
    { key: "natural_language", label: "Natural Language", desc: "Full phrases, not keywords. Stores that only match keywords miss the shopper\u2019s real intent." },
    { key: "typo", label: "Typo Tolerance", desc: "Shoppers type fast on mobile. One misspelling shouldn\u2019t return zero results." },
    { key: "synonym", label: "Synonym Handling", desc: "\u201CSofa\u201D and \u201Ccouch\u201D are the same product. 70% of search engines get this wrong." },
    { key: "long_tail", label: "Long-Tail", desc: "Multi-attribute queries signal high purchase intent. These shoppers are ready to buy." },
    { key: "category", label: "Category Browse", desc: "Broad exploration queries. Poor results lose the customer before they begin." },
    { key: "use_case", label: "Use Case", desc: "Searches by how they\u2019ll use a product. Tests whether search understands context." },
    { key: "budget", label: "Budget Search", desc: "Price-qualified searches from shoppers who\u2019ve narrowed their criteria and are ready to buy." },
    { key: "gift", label: "Gift / Occasion", desc: "Time-sensitive purchases. The shopper won\u2019t wait \u2014 they\u2019ll buy from whoever surfaces results first." },
  ]

  // Group queries by category
  const queryByCategory: Record<string, string[]> = {}
  for (const comp of comparisons) {
    if (!queryByCategory[comp.category]) queryByCategory[comp.category] = []
    queryByCategory[comp.category].push(comp.query)
  }

  const cards = categories
    .filter((cat) => queryByCategory[cat.key]?.length > 0)
    .map((cat) => {
      const queries = queryByCategory[cat.key] || []
      const count = queries.length
      return `<div style="background:#f8fafc;border-radius:10px;padding:14px 20px;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div style="font-size:16px;font-weight:700;color:#1B2D5B;">${cat.label}</div>
          <div style="font-size:13px;font-weight:600;color:#888;background:#e2e8f0;padding:2px 10px;border-radius:100px;">${count}q</div>
        </div>
        <div style="font-size:14px;color:#444;line-height:1.4;">${cat.desc}</div>
      </div>`
    })
    .join("")

  const totalQueries = comparisons.length
  const categoryCount = Object.keys(queryByCategory).length

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
  <div style="background:#0F1A35;padding:28px 80px 20px;">
    <div style="color:rgba(255,255,255,0.5);font-size:16px;font-weight:600;letter-spacing:0.1em;margin-bottom:8px;">SEARCH TEARDOWN</div>
    <div style="color:white;font-size:36px;font-weight:700;margin-bottom:8px;">The ${totalQueries} Queries We Tested</div>
    <div style="color:rgba(255,255,255,0.6);font-size:18px;">Grouped by ${categoryCount} search capabilities that separate high-performing stores from the rest.</div>
  </div>

  <!-- Category grid -->
  <div style="flex:1;padding:20px 80px;display:grid;grid-template-columns:1fr 1fr;gap:14px 36px;align-content:start;">
    ${cards}
  </div>

  <!-- Footer -->
  <div style="margin-top:auto;background:#0F1A35;padding:14px 80px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:10px;">
      ${xtalLogoImg(28, 28)}
      <span style="color:white;font-size:16px;font-weight:600;letter-spacing:0.15em;">XTAL</span>
    </div>
    <span style="color:rgba(255,255,255,0.5);font-size:14px;">xtalsearch.com</span>
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
  comparisons: QueryComparison[],
): string {
  const gc = gradeColor(overallGrade)

  // Revenue-at-risk calculation
  const failCount = comparisons.filter((c) => c.grade && c.grade.score < 60).length
  const totalQueries = comparisons.length
  const failRate = totalQueries > 0 ? failCount / totalQueries : 0
  const revenueAtRisk = 0.44 * failRate * 0.80
  const revenueAtRiskPct = (revenueAtRisk * 100).toFixed(1)
  const failRatePct = (failRate * 100).toFixed(0)
  const passRatePct = (((totalQueries - failCount) / totalQueries) * 100).toFixed(0)

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
      return `<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
        <div style="width:200px;font-size:20px;font-weight:600;color:#333;text-align:right;">${label}</div>
        <div style="flex:1;height:40px;background:#f0f4f8;border-radius:10px;overflow:hidden;position:relative;">
          <div style="width:${barWidth}%;height:100%;background:${dc.bg};border-radius:10px;display:flex;align-items:center;justify-content:flex-end;padding-right:12px;">
            <span style="color:${dc.text};font-size:18px;font-weight:700;">${d.avgScore}</span>
          </div>
        </div>
        <div style="width:48px;height:48px;border-radius:50%;background:${dc.bg};color:${dc.text};font-size:22px;font-weight:800;display:flex;align-items:center;justify-content:center;">${d.grade}</div>
        <div style="width:60px;font-size:16px;color:#888;">${d.queryCount}q</div>
      </div>`
    })
    .join("")

  // Revenue-at-risk block
  const revenueBlock = failCount > 0
    ? `<div style="margin-top:16px;padding:16px 24px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;">
        <div style="font-size:13px;font-weight:700;color:#991b1b;letter-spacing:0.04em;margin-bottom:8px;">ESTIMATED REVENUE AT RISK</div>
        <div style="font-size:40px;font-weight:900;color:#dc2626;line-height:1;">${revenueAtRiskPct}%</div>
        <div style="font-size:14px;color:#666;margin-top:8px;line-height:1.3;">of total revenue</div>
        <div style="font-size:13px;color:#888;margin-top:10px;line-height:1.4;border-top:1px solid #fecaca;padding-top:8px;">44% &times; ${failRatePct}% &times; 80%</div>
      </div>`
    : `<div style="margin-top:16px;padding:16px 24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
        <div style="font-size:13px;font-weight:700;color:#166534;letter-spacing:0.04em;margin-bottom:8px;">REVENUE RISK</div>
        <div style="font-size:24px;font-weight:700;color:#166534;">Low</div>
        <div style="font-size:14px;color:#666;margin-top:6px;line-height:1.3;">No queries scored below passing</div>
      </div>`

  // Connecting sentence
  const connectingSentence = failCount > 0
    ? `<div style="padding:0 80px 16px;">
        <div style="background:#f8fafc;border-left:4px solid #1B2D5B;border-radius:0 10px 10px 0;padding:16px 24px;box-shadow:0 4px 16px rgba(0,0,0,0.02);">
          <div style="font-size:18px;color:#333;line-height:1.5;">${escapeHtml(merchant.name)}&rsquo;s search failed <strong>${failCount} of ${totalQueries}</strong> queries &mdash; a <strong>${failRatePct}%</strong> failure rate. Based on industry benchmarks, that puts an estimated <strong style="color:#dc2626;">${revenueAtRiskPct}%</strong> of total revenue at risk from search alone.</div>
        </div>
      </div>`
    : `<div style="padding:0 80px 16px;">
        <div style="background:#f8fafc;border-left:4px solid #16a34a;border-radius:0 10px 10px 0;padding:16px 24px;box-shadow:0 4px 16px rgba(0,0,0,0.02);">
          <div style="font-size:18px;color:#333;line-height:1.5;">A passing grade requires relevant results on at least 60% of common shopper queries. ${escapeHtml(merchant.name)} hit <strong>${passRatePct}%</strong>.</div>
        </div>
      </div>`

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
<div style="width:${SLIDE_W}px;height:${SLIDE_H}px;display:flex;flex-direction:column;background:#FCFDFF;">

  <!-- Header -->
  <div style="background:#0F1A35;padding:32px 80px 24px;">
    <div style="color:rgba(255,255,255,0.5);font-size:16px;font-weight:600;letter-spacing:0.1em;margin-bottom:8px;">SEARCH SCORECARD</div>
    <div style="color:white;font-size:40px;font-weight:700;">${escapeHtml(merchant.name)} &mdash; Search Quality Assessment</div>
  </div>

  <!-- Content -->
  <div style="flex:1;padding:28px 80px 16px;display:flex;gap:48px;">

    <!-- Left: Overall score -->
    <div style="width:320px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:16px;">
      <div style="width:140px;height:140px;border-radius:50%;background:${gc.bg};color:${gc.text};font-size:64px;font-weight:900;display:flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:0 8px 24px ${gc.bg}40;">${overallGrade}</div>
      <div style="font-size:48px;font-weight:800;color:#1a1a1a;">${overallScore}</div>
      <div style="font-size:18px;color:#888;margin-top:6px;">out of 100</div>
      ${revenueBlock}
    </div>

    <!-- Right: Dimension bars -->
    <div style="flex:1;padding-top:12px;">
      <div style="font-size:22px;font-weight:700;color:#333;margin-bottom:24px;">Category Breakdown</div>
      ${dimBars}
    </div>
  </div>

  <!-- Connecting sentence -->
  ${connectingSentence}

  <!-- Footer -->
  <div style="margin-top:auto;background:#0F1A35;padding:14px 80px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:10px;">
      ${xtalLogoImg(28, 28)}
      <span style="color:white;font-size:16px;font-weight:600;letter-spacing:0.15em;">XTAL</span>
    </div>
    <span style="color:rgba(255,255,255,0.5);font-size:13px;">Revenue methodology: Constructor.io (2025), Google Cloud Retail</span>
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
