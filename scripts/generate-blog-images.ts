/**
 * Generate hero images for all blog posts.
 *
 * Two pipelines:
 *   1. Playwright HTML→screenshot for programmatic templates (comparisons, data viz, case study)
 *   2. Gemini API (gemini-3-pro-image-preview) for AI-generated conceptual illustrations
 *
 * Usage:
 *   npx tsx scripts/generate-blog-images.ts              # generate all
 *   npx tsx scripts/generate-blog-images.ts <slug>        # generate one
 *
 * Prerequisites:
 *   - GEMINI_API_KEY in .env.local (for AI-generated images)
 *   - playwright installed (already in devDependencies)
 *
 * Output: public/blog/<slug>.png at 1200×630 (OG standard)
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";

// Load .env.local (same pattern as other scripts in this project)
try {
  const envPath = resolve(__dirname, "../.env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on existing env vars
}

const OUT_DIR = resolve(__dirname, "../public/blog");
const WIDTH = 1200;
const HEIGHT = 630;

// ─── Brand tokens ───────────────────────────────────────────────────────────
const NAVY = "#1B2D5B";
const ICE = "#E8ECF1";
const DARK = "#0F1A35";
const PAGE_BG = "#FCFDFF";
const BLUE_ACCENT = "#3B82F6";

// ─── XTAL logo SVG (white, inlined) ────────────────────────────────────────
const XTAL_LOGO_SVG = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect x="20" y="6" width="8" height="36" rx="4" fill="white" transform="rotate(-45 24 24)"/>
  <rect x="20" y="6" width="8" height="36" rx="4" fill="white" transform="rotate(45 24 24)"/>
</svg>`;

const XTAL_LOGO_NAVY = XTAL_LOGO_SVG.replace(/fill="white"/g, `fill="${NAVY}"`);

// ─── Shared HTML wrapper ────────────────────────────────────────────────────
function wrapHtml(bodyContent: string, extraStyles = ""): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
      position: relative;
    }
    .glass-panel {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      backdrop-filter: blur(12px);
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .logo-text {
      font-weight: 700;
      font-size: 24px;
      color: white;
      letter-spacing: 0.05em;
    }
    .xtal-wordmark {
      font-weight: 800;
      font-size: 28px;
      color: white;
      letter-spacing: 0.25em;
    }
    .accent-dot {
      position: absolute;
      border-radius: 50%;
      opacity: 0.08;
    }
    ${extraStyles}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

// ─── Decorative geometric elements ──────────────────────────────────────────
function decorDots(): string {
  return `
    <div class="accent-dot" style="width:300px;height:300px;background:${ICE};top:-80px;right:-60px;"></div>
    <div class="accent-dot" style="width:200px;height:200px;background:${BLUE_ACCENT};bottom:-40px;left:-30px;"></div>
    <div class="accent-dot" style="width:150px;height:150px;background:${ICE};bottom:40px;right:100px;"></div>
  `;
}

// ─── Template 1: Head-to-Head (xtal-vs-searchspring) ────────────────────────
function templateHeadToHead(leftName: string, rightName: string): string {
  return wrapHtml(`
    <div style="width:100%;height:100%;background:radial-gradient(ellipse at 30% 40%, ${NAVY} 0%, ${DARK} 100%);display:flex;align-items:center;justify-content:center;gap:60px;">
      ${decorDots()}
      <div class="glass-panel" style="width:320px;height:300px;">
        <div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
          ${XTAL_LOGO_SVG.replace('width="64" height="64"', 'width="80" height="80"')}
        </div>
        <span class="xtal-wordmark" style="font-size:32px;">XTAL</span>
        <span style="font-size:12px;font-weight:500;color:rgba(255,255,255,0.35);letter-spacing:0.15em;text-transform:uppercase;">AI-Native Search</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="width:3px;height:60px;background:linear-gradient(to bottom,transparent,${ICE},transparent);border-radius:2px;"></div>
        <span style="font-size:48px;font-weight:900;color:${ICE};opacity:0.4;letter-spacing:0.15em;">VS</span>
        <div style="width:3px;height:60px;background:linear-gradient(to bottom,transparent,${ICE},transparent);border-radius:2px;"></div>
      </div>
      <div class="glass-panel" style="width:320px;height:300px;">
        <div style="width:80px;height:80px;border-radius:20px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
          <span style="font-size:36px;font-weight:800;color:rgba(255,255,255,0.7);">S</span>
        </div>
        <span class="logo-text" style="font-size:26px;font-weight:800;">${rightName}</span>
        <span style="font-size:12px;font-weight:500;color:rgba(255,255,255,0.35);letter-spacing:0.15em;text-transform:uppercase;">E-Commerce Search</span>
      </div>
    </div>
  `);
}

// ─── Competitor logo SVGs (inlined) ─────────────────────────────────────────
// Algolia: simplified "A" mark from Simple Icons (MIT license)
const ALGOLIA_LOGO_SVG = `<svg viewBox="0 0 24 24" fill="white" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 2.4a9.6 9.6 0 110 19.2 9.6 9.6 0 010-19.2zM8.4 7.2v7.44l3.6-2.16 3.6 2.16V7.2h-1.44v5.28l-2.16-1.296L9.84 12.48V7.2H8.4z"/>
</svg>`;

// Klevu: stylized "K" mark
const KLEVU_LOGO_SVG = `<svg viewBox="0 0 48 48" fill="none" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="8" width="6" height="32" rx="3" fill="white"/>
  <polygon points="16,24 32,8 40,8 22,26 40,40 32,40 16,24" fill="white"/>
</svg>`;

// ─── Template 2: Three-Way Triptych (klevu-vs-algolia-vs-xtal) ──────────────
function templateTriptych(names: string[]): string {
  const accentColors = ["#6366F1", "#FF6B35", BLUE_ACCENT];
  const logoMap: Record<string, string> = {
    "XTAL": XTAL_LOGO_SVG,
    "Algolia": ALGOLIA_LOGO_SVG,
    "Klevu": KLEVU_LOGO_SVG,
  };

  const panels = names.map((name, i) => {
    const logo = logoMap[name] || `<div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;">
      <span style="font-size:24px;font-weight:800;color:white;opacity:0.7;">${name[0]}</span>
    </div>`;

    return `
      <div class="glass-panel" style="width:280px;height:320px;position:relative;">
        <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:3px;background:${accentColors[i]};border-radius:0 0 4px 4px;"></div>
        <div style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
          ${logo}
        </div>
        <span class="logo-text" style="font-size:22px;">${name}</span>
      </div>
    `;
  });

  const vsJoiner = `<span style="font-size:24px;font-weight:800;color:${ICE};opacity:0.3;align-self:center;">VS</span>`;

  return wrapHtml(`
    <div style="width:100%;height:100%;background:radial-gradient(ellipse at 60% 30%, ${NAVY} 0%, ${DARK} 100%);display:flex;align-items:center;justify-content:center;gap:24px;">
      ${decorDots()}
      ${panels[0]}
      ${vsJoiner}
      ${panels[1]}
      ${vsJoiner}
      ${panels[2]}
    </div>
  `);
}

// ─── Template 3: Alternatives Grid (algolia-alternatives) ───────────────────
function templateAlternativesGrid(): string {
  const competitors = [
    "Algolia", "Klevu", "SearchSpring", "Bloomreach",
    "Doofinder", "Nosto", "Searchanise", "Luigi's Box"
  ];
  const positions = [
    { x: 180, y: 110 }, { x: 480, y: 70 }, { x: 800, y: 100 }, { x: 1020, y: 150 },
    { x: 140, y: 440 }, { x: 420, y: 500 }, { x: 740, y: 480 }, { x: 1000, y: 420 },
  ];
  const accentColors = ["#6366F1", "#22C55E", "#F97316", "#EC4899", "#8B5CF6", "#14B8A6", "#F59E0B", "#06B6D4"];

  const compNodes = competitors.map((name, i) => `
    <div style="position:absolute;left:${positions[i].x}px;top:${positions[i].y}px;transform:translate(-50%,-50%);">
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px 24px;display:flex;align-items:center;gap:10px;backdrop-filter:blur(8px);">
        <div style="width:10px;height:10px;border-radius:50%;background:${accentColors[i]};box-shadow:0 0 8px ${accentColors[i]}40;"></div>
        <span style="font-size:15px;font-weight:700;color:rgba(255,255,255,0.65);">${name}</span>
      </div>
    </div>
  `).join("");

  // Lines radiating from center to each competitor with gradient effect
  const cx = WIDTH / 2, cy = HEIGHT / 2;
  const lines = positions.map((pos, i) =>
    `<line x1="${cx}" y1="${cy}" x2="${pos.x}" y2="${pos.y}" stroke="${accentColors[i]}" stroke-opacity="0.08" stroke-width="1.5" stroke-dasharray="4 6"/>`
  ).join("");

  return wrapHtml(`
    <div style="width:100%;height:100%;background:radial-gradient(ellipse at 50% 50%, ${NAVY} 0%, ${DARK} 100%);position:relative;">
      ${decorDots()}
      <!-- Glow ring behind center -->
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%);z-index:0;"></div>
      <svg style="position:absolute;inset:0;width:100%;height:100%;">${lines}</svg>
      <!-- Center XTAL -->
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;">
        <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:20px;padding:24px 40px;display:flex;align-items:center;gap:16px;box-shadow:0 0 60px rgba(59,130,246,0.15),0 0 120px rgba(59,130,246,0.05);">
          ${XTAL_LOGO_SVG.replace('width="64" height="64"', 'width="48" height="48"')}
          <span class="xtal-wordmark" style="font-size:24px;">XTAL</span>
        </div>
      </div>
      <!-- Subtitle -->
      <div style="position:absolute;bottom:36px;left:50%;transform:translateX(-50%);text-align:center;">
        <span style="font-size:13px;font-weight:600;color:${ICE};opacity:0.35;letter-spacing:0.2em;text-transform:uppercase;">Algolia Alternatives Compared</span>
      </div>
      ${compNodes}
    </div>
  `);
}

// ─── Template 4: Concept vs Concept (semantic-search-vs-keyword-search) ─────
function templateConceptVsConcept(): string {
  // Left: keyword tokens scattered
  const keywords = ["shoes", "red", "size 10", "running", "men's", "nike"];
  const keywordEls = keywords.map((kw, i) => {
    const x = 80 + (i % 3) * 140 + (i * 17) % 40;
    const y = 160 + Math.floor(i / 3) * 120 + (i * 31) % 60;
    const rot = -15 + (i * 7) % 30;
    return `<div style="position:absolute;left:${x}px;top:${y}px;transform:rotate(${rot}deg);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:6px 14px;font-family:monospace;font-size:14px;color:rgba(255,255,255,0.5);">${kw}</div>`;
  }).join("");

  // Right: vector/embedding visualization (connected dots)
  const dots = [
    { x: 750, y: 180 }, { x: 850, y: 150 }, { x: 920, y: 220 },
    { x: 800, y: 280 }, { x: 900, y: 310 }, { x: 780, y: 380 },
    { x: 870, y: 400 }, { x: 950, y: 350 }, { x: 1020, y: 280 },
    { x: 1050, y: 180 }, { x: 1080, y: 340 },
  ];
  const dotEls = dots.map(d =>
    `<circle cx="${d.x}" cy="${d.y}" r="5" fill="${BLUE_ACCENT}" opacity="0.5"/>
     <circle cx="${d.x}" cy="${d.y}" r="12" fill="none" stroke="${BLUE_ACCENT}" stroke-opacity="0.15" stroke-width="1"/>`
  ).join("");

  // Connect nearby dots
  const connections: string[] = [];
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
      if (dist < 180) {
        connections.push(`<line x1="${dots[i].x}" y1="${dots[i].y}" x2="${dots[j].x}" y2="${dots[j].y}" stroke="${BLUE_ACCENT}" stroke-opacity="0.1" stroke-width="1"/>`);
      }
    }
  }

  return wrapHtml(`
    <div style="width:100%;height:100%;background:linear-gradient(135deg, ${DARK} 0%, ${NAVY} 100%);position:relative;">
      ${decorDots()}
      <!-- Center divider -->
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:8px;z-index:2;">
        <div style="width:2px;height:80px;background:linear-gradient(to bottom,transparent,${ICE});border-radius:2px;opacity:0.3;"></div>
        <span style="font-size:32px;font-weight:900;color:${ICE};opacity:0.25;letter-spacing:0.1em;">VS</span>
        <div style="width:2px;height:80px;background:linear-gradient(to bottom,${ICE},transparent);border-radius:2px;opacity:0.3;"></div>
      </div>
      <!-- Left: Keywords -->
      <div style="position:absolute;top:60px;left:100px;">
        <span style="font-size:11px;font-weight:700;color:${ICE};opacity:0.4;letter-spacing:0.2em;text-transform:uppercase;">Keyword Search</span>
      </div>
      ${keywordEls}
      <!-- Right: Vectors -->
      <div style="position:absolute;top:60px;right:100px;">
        <span style="font-size:11px;font-weight:700;color:${BLUE_ACCENT};opacity:0.5;letter-spacing:0.2em;text-transform:uppercase;">Semantic Search</span>
      </div>
      <svg style="position:absolute;inset:0;width:100%;height:100%;">
        ${connections.join("")}
        ${dotEls}
      </svg>
    </div>
  `);
}

// ─── Template 5: Grade Distribution (we-graded-500-ecommerce-stores) ────────
function templateGradeDistribution(): string {
  const grades = [
    { label: "A", pct: 8, color: "#22C55E" },
    { label: "B", pct: 15, color: "#3B82F6" },
    { label: "C", pct: 32, color: "#F59E0B" },
    { label: "D", pct: 28, color: "#F97316" },
    { label: "F", pct: 17, color: "#EF4444" },
  ];

  const maxPct = 32;
  const barMaxW = 500;
  const startX = 380;
  const startY = 140;
  const barH = 52;
  const gap = 18;

  const bars = grades.map((g, i) => {
    const y = startY + i * (barH + gap);
    const w = (g.pct / maxPct) * barMaxW;
    return `
      <div style="position:absolute;left:${startX - 60}px;top:${y}px;display:flex;align-items:center;height:${barH}px;">
        <span style="font-size:28px;font-weight:800;color:${g.color};width:40px;text-align:right;">${g.label}</span>
      </div>
      <div style="position:absolute;left:${startX}px;top:${y}px;width:${w}px;height:${barH}px;background:${g.color};opacity:0.8;border-radius:0 8px 8px 0;display:flex;align-items:center;justify-content:flex-end;padding-right:14px;">
        <span style="font-size:16px;font-weight:700;color:white;">${g.pct}%</span>
      </div>
    `;
  }).join("");

  return wrapHtml(`
    <div style="width:100%;height:100%;background:radial-gradient(ellipse at 20% 30%, ${NAVY} 0%, ${DARK} 100%);position:relative;">
      ${decorDots()}
      <!-- Big number -->
      <div style="position:absolute;left:80px;top:120px;">
        <span style="font-size:160px;font-weight:900;color:white;opacity:0.06;line-height:1;">500</span>
      </div>
      <div style="position:absolute;left:80px;top:200px;">
        <span style="font-size:11px;font-weight:600;color:${ICE};opacity:0.5;letter-spacing:0.2em;text-transform:uppercase;">Stores Graded</span>
      </div>
      <!-- Grid lines -->
      <svg style="position:absolute;inset:0;width:100%;height:100%;">
        ${[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const x = startX + frac * barMaxW;
          return `<line x1="${x}" y1="${startY - 10}" x2="${x}" y2="${startY + 5 * (barH + gap)}" stroke="white" stroke-opacity="0.04" stroke-width="1"/>`;
        }).join("")}
      </svg>
      ${bars}
      <!-- Footer label -->
      <div style="position:absolute;bottom:40px;right:60px;">
        <span style="font-size:12px;font-weight:500;color:${ICE};opacity:0.3;letter-spacing:0.1em;">XTAL Search Quality Report</span>
      </div>
    </div>
  `);
}

// ─── Template 6: Score Gauge (what-is-a-good-ecommerce-search-score) ────────
function templateScoreGauge(): string {
  // SVG semicircular gauge
  const cx = 600, cy = 380, r = 200;
  const zones = [
    { start: 180, end: 216, color: "#EF4444", label: "F" },   // 0-20
    { start: 216, end: 252, color: "#F97316", label: "D" },   // 20-40
    { start: 252, end: 288, color: "#F59E0B", label: "C" },   // 40-60
    { start: 288, end: 324, color: "#3B82F6", label: "B" },   // 60-80
    { start: 324, end: 360, color: "#22C55E", label: "A" },   // 80-100
  ];

  function arcPath(startAngle: number, endAngle: number, radius: number): string {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  const arcs = zones.map(z =>
    `<path d="${arcPath(z.start, z.end, r)}" fill="none" stroke="${z.color}" stroke-width="28" stroke-linecap="round" opacity="0.7"/>`
  ).join("");

  // Label positions
  const labels = zones.map(z => {
    const midAngle = ((z.start + z.end) / 2) * Math.PI / 180;
    const lx = cx + (r + 40) * Math.cos(midAngle);
    const ly = cy + (r + 40) * Math.sin(midAngle);
    return `<text x="${lx}" y="${ly}" fill="${z.color}" font-size="18" font-weight="700" text-anchor="middle" dominant-baseline="middle" opacity="0.6">${z.label}</text>`;
  }).join("");

  // Needle pointing at ~75 (B range)
  const needleAngle = 180 + (75 / 100) * 180; // 315 degrees
  const needleRad = (needleAngle * Math.PI) / 180;
  const nx = cx + (r - 40) * Math.cos(needleRad);
  const ny = cy + (r - 40) * Math.sin(needleRad);

  return wrapHtml(`
    <div style="width:100%;height:100%;background:radial-gradient(ellipse at 50% 60%, ${NAVY} 0%, ${DARK} 100%);position:relative;display:flex;align-items:center;justify-content:center;">
      ${decorDots()}
      <svg width="${WIDTH}" height="${HEIGHT}" style="position:absolute;inset:0;">
        ${arcs}
        ${labels}
        <!-- Needle -->
        <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        <circle cx="${cx}" cy="${cy}" r="8" fill="white" opacity="0.9"/>
        <!-- Score text -->
        <text x="${cx}" y="${cy - 40}" fill="white" font-size="64" font-weight="900" text-anchor="middle" font-family="Inter" opacity="0.9">75</text>
        <text x="${cx}" y="${cy - 5}" fill="${ICE}" font-size="14" font-weight="500" text-anchor="middle" opacity="0.5" letter-spacing="0.15em">SEARCH SCORE</text>
        <!-- Scale numbers -->
        <text x="${cx - r - 10}" y="${cy + 30}" fill="white" font-size="12" font-weight="500" text-anchor="middle" opacity="0.3">0</text>
        <text x="${cx + r + 10}" y="${cy + 30}" fill="white" font-size="12" font-weight="500" text-anchor="middle" opacity="0.3">100</text>
      </svg>
    </div>
  `);
}

// ─── Template 7: Before/After (retailer-cut-zero-result-searches) ───────────
function templateBeforeAfter(): string {
  return wrapHtml(`
    <div style="width:100%;height:100%;display:flex;position:relative;">
      ${decorDots()}
      <!-- Before panel -->
      <div style="width:50%;height:100%;background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;position:relative;">
        <div style="position:absolute;top:0;left:0;width:100%;height:3px;background:#EF4444;opacity:0.6;"></div>
        <span style="font-size:11px;font-weight:700;color:#EF4444;opacity:0.7;letter-spacing:0.2em;text-transform:uppercase;">Before</span>
        <span style="font-size:96px;font-weight:900;color:#EF4444;opacity:0.8;line-height:1;">18%</span>
        <span style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.4);">Zero-Result Rate</span>
        <!-- Sad search icon -->
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.3)" stroke-width="2" style="margin-top:16px;">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          <path d="M8 15s1.5-2 3-2 3 2 3 2" stroke-linecap="round"/>
        </svg>
      </div>
      <!-- After panel -->
      <div style="width:50%;height:100%;background:linear-gradient(135deg, ${DARK} 0%, ${NAVY} 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;position:relative;">
        <div style="position:absolute;top:0;left:0;width:100%;height:3px;background:#22C55E;opacity:0.6;"></div>
        <span style="font-size:11px;font-weight:700;color:#22C55E;opacity:0.7;letter-spacing:0.2em;text-transform:uppercase;">After XTAL</span>
        <span style="font-size:96px;font-weight:900;color:#22C55E;opacity:0.8;line-height:1;">3.6%</span>
        <span style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.4);">Zero-Result Rate</span>
        <!-- Happy search + sparkle -->
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.3)" stroke-width="2" style="margin-top:16px;">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          <path d="M8 13s1.5 2 3 2 3-2 3-2" stroke-linecap="round"/>
        </svg>
      </div>
      <!-- Center arrow/divider -->
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        <span style="font-size:14px;font-weight:800;color:white;opacity:0.5;">-80%</span>
      </div>
    </div>
  `);
}

// ─── Playwright pipeline ────────────────────────────────────────────────────

interface PlaywrightImage {
  slug: string;
  getHtml: () => string;
}

const playwrightImages: PlaywrightImage[] = [
  { slug: "xtal-vs-searchspring", getHtml: () => templateHeadToHead("XTAL", "SearchSpring") },
  { slug: "klevu-vs-algolia-vs-xtal", getHtml: () => templateTriptych(["Klevu", "Algolia", "XTAL"]) },
  { slug: "algolia-alternatives-for-ecommerce", getHtml: templateAlternativesGrid },
  { slug: "semantic-search-vs-keyword-search", getHtml: templateConceptVsConcept },
  { slug: "we-graded-500-ecommerce-stores-search", getHtml: templateGradeDistribution },
  { slug: "what-is-a-good-ecommerce-search-score", getHtml: templateScoreGauge },
  { slug: "retailer-cut-zero-result-searches-with-ai", getHtml: templateBeforeAfter },
];

async function generatePlaywrightImages(slugFilter?: string) {
  const targets = slugFilter
    ? playwrightImages.filter(i => i.slug === slugFilter)
    : playwrightImages;

  if (targets.length === 0) return;

  console.log(`\n🎨 Generating ${targets.length} Playwright image(s)...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
  });

  for (const img of targets) {
    const page = await context.newPage();
    const html = img.getHtml();
    await page.setContent(html);
    // Wait for Inter font to load
    await page.waitForFunction(() => document.fonts.ready, null, { timeout: 10000 });
    // Small extra delay for rendering
    await page.waitForTimeout(500);

    const outPath = resolve(OUT_DIR, `${img.slug}.png`);
    await page.screenshot({ path: outPath, type: "png" });
    console.log(`  ✓ ${img.slug}.png`);
    await page.close();
  }

  await browser.close();
}

// ─── Gemini pipeline ────────────────────────────────────────────────────────

interface GeminiImage {
  slug: string;
  prompt: string;
}

const BRAND_PREFIX = `Create a clean, modern, geometric digital illustration. Color palette: deep navy blue (#1B2D5B), ice blue (#E8ECF1), dark navy (#0F1A35), near-white (#FCFDFF). Accent: soft blue glows (#3B82F6). Style: professional SaaS marketing hero image, minimal and abstract, NOT photorealistic, NOT stock-photo-looking. No text, words, or letters in the image. Wide landscape composition (roughly 2:1 aspect ratio). `;

const geminiImages: GeminiImage[] = [
  {
    slug: "what-is-product-discovery",
    prompt: BRAND_PREFIX + "Show an abstract visualization of product discovery: a person silhouette browsing a digital storefront with floating product cards, recommendation arrows, and branching discovery paths emanating from a search bar. Geometric shapes, subtle glow effects, interconnected nodes representing personalized shopping journeys.",
  },
  {
    slug: "ecommerce-site-search-best-practices",
    prompt: BRAND_PREFIX + "Show a polished, abstract search interface: a magnifying glass icon with a product grid layout, filter sidebar with facet controls, and subtle AI sparkle effects. Clean SaaS dashboard aesthetic. Elements float in 3D space with depth and layering. Rounded rectangles, soft shadows.",
  },
  {
    slug: "improve-shopify-search-without-developer",
    prompt: BRAND_PREFIX + "Show a Shopify-style admin dashboard with a glowing search bar being visually enhanced and upgraded. Drag-and-drop UI elements floating around it, a wrench/tool metaphor integrated subtly. Emphasize simplicity and non-technical ease — no code visible. Toggle switches, slider controls, and visual widgets floating in space.",
  },
];

async function generateGeminiImages(slugFilter?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("  ✗ GEMINI_API_KEY not set in .env.local — skipping AI-generated images");
    return;
  }

  const targets = slugFilter
    ? geminiImages.filter(i => i.slug === slugFilter)
    : geminiImages;

  if (targets.length === 0) return;

  console.log(`\n🤖 Generating ${targets.length} Gemini image(s)...\n`);

  for (const img of targets) {
    try {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";

      const body = {
        contents: [{ parts: [{ text: img.prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`  ✗ ${img.slug}: API error ${res.status} — ${errText}`);
        continue;
      }

      const data = await res.json();

      // Find the image part in the response
      const parts = data?.candidates?.[0]?.content?.parts;
      if (!parts) {
        console.error(`  ✗ ${img.slug}: No parts in response`);
        console.error("    Response:", JSON.stringify(data, null, 2).slice(0, 500));
        continue;
      }

      const imagePart = parts.find((p: any) => p.inlineData?.data);
      if (!imagePart) {
        console.error(`  ✗ ${img.slug}: No image data in response parts`);
        continue;
      }

      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      const outPath = resolve(OUT_DIR, `${img.slug}.png`);
      writeFileSync(outPath, buffer);
      console.log(`  ✓ ${img.slug}.png (${(buffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ✗ ${img.slug}: ${err}`);
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const slugFilter = process.argv[2];

  // Ensure output directory exists
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  if (slugFilter) {
    console.log(`Generating image for: ${slugFilter}`);
  } else {
    console.log("Generating all blog images...");
  }

  // Run both pipelines
  await generatePlaywrightImages(slugFilter);
  await generateGeminiImages(slugFilter);

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
