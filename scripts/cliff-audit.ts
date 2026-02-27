#!/usr/bin/env npx tsx
/**
 * Cliff Audit — Shopper sanity check for relevance cliff detection.
 *
 * Runs 40 queries (10 archetypes × 2 queries × 2 collections) against the
 * live XTAL search API, applies the relevance cliff algorithm to each score
 * distribution, and reports what gets kept vs cut — with flagging for
 * cases where the algorithm may be too aggressive or too permissive.
 *
 * Usage:
 *   npx tsx scripts/cliff-audit.ts
 *   npx tsx scripts/cliff-audit.ts --collection bestbuy   # single collection
 *   npx tsx scripts/cliff-audit.ts --sensitivity 1.5      # override sensitivity
 */

import { writeFileSync, mkdirSync } from "fs"

// ─── Config ────────────────────────────────────────────────────────

const SEARCH_BASE = "https://www.xtalsearch.com"
const LIMIT = 48
const DELAY_MS = 300

// ─── CLI args ──────────────────────────────────────────────────────

const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 ? args[idx + 1] : undefined
}
const COLLECTION_FILTER = getArg("collection")
const SENSITIVITY = parseFloat(getArg("sensitivity") || "1.0")
const CLIFF_RATIO = parseFloat(getArg("cliff-ratio") || "3.0")

// ─── Query suite: 10 archetypes × 2 per collection × 2 collections ─

interface TestQuery {
  id: number
  query: string
  archetype: string
  collection: string
  breadth: "broad" | "medium" | "narrow"
}

const ARCHETYPES: {
  name: string
  breadth: "broad" | "medium" | "narrow"
  bestbuy: [string, string]
  willow: [string, string]
}[] = [
  {
    name: "broad category",
    breadth: "broad",
    bestbuy: ["soundbars", "laptops"],
    willow: ["candles", "baskets"],
  },
  {
    name: "budget + broad",
    breadth: "broad",
    bestbuy: ["home theater on a budget", "affordable gaming setup"],
    willow: ["cheap gifts under 20", "budget kitchen essentials"],
  },
  {
    name: "multi-category intent",
    breadth: "broad",
    bestbuy: ["work from home setup", "dorm room essentials"],
    willow: ["hosting a dinner party", "cozy bedroom makeover"],
  },
  {
    name: "gift + persona",
    breadth: "medium",
    bestbuy: ["gift for a teenage gamer", "tech gifts for dad"],
    willow: ["gifts for coffee lovers", "gift for someone who has everything"],
  },
  {
    name: "direct product",
    breadth: "narrow",
    bestbuy: ["Sony WH-1000XM5", "MacBook Pro"],
    willow: ["Yankee Candle", "Le Creuset"],
  },
  {
    name: "feature-specific",
    breadth: "medium",
    bestbuy: ["noise cancelling headphones", "4K OLED TV"],
    willow: ["soy wax candles", "handwoven throw blanket"],
  },
  {
    name: "problem-solving",
    breadth: "broad",
    bestbuy: ["my wifi doesn't reach the backyard", "laptop keeps overheating"],
    willow: ["my closet is a mess", "kitchen smells bad"],
  },
  {
    name: "vibe / intent-only",
    breadth: "broad",
    bestbuy: ["something to watch movies on", "upgrade my gaming experience"],
    willow: ["make my bathroom feel like a spa", "cozy vibes for winter"],
  },
  {
    name: "multi-attribute",
    breadth: "medium",
    bestbuy: ["lightweight 15 inch laptop good battery", "65 inch 4K TV under 1000"],
    willow: ["soft breathable cotton sheets queen", "large glass vase for dining table"],
  },
  {
    name: "comparison-style",
    breadth: "medium",
    bestbuy: ["best bluetooth speaker", "best wireless earbuds"],
    willow: ["best throw blanket", "best scented candle"],
  },
]

function buildQueries(): TestQuery[] {
  const queries: TestQuery[] = []
  let id = 1
  for (const arch of ARCHETYPES) {
    for (const coll of ["bestbuy", "willow"] as const) {
      if (COLLECTION_FILTER && coll !== COLLECTION_FILTER) continue
      const [q1, q2] = arch[coll]
      queries.push({ id: id++, query: q1, archetype: arch.name, collection: coll, breadth: arch.breadth })
      queries.push({ id: id++, query: q2, archetype: arch.name, collection: coll, breadth: arch.breadth })
    }
  }
  return queries
}

// ─── Relevance cliff algorithm (TS port of relevance_cliff.py) ─────

function kneedleDetect(scores: number[], sensitivity: number): number {
  const n = scores.length
  if (n < 3) return n

  const sMax = scores[0], sMin = scores[n - 1]
  const sRange = sMax - sMin
  if (sRange === 0) return n

  // Normalize to unit square
  const x = Array.from({ length: n }, (_, i) => i / (n - 1))
  const y = scores.map(s => (s - sMin) / sRange)

  // For decreasing curve, reference diagonal is y = 1 - x
  const d = y.map((yi, i) => yi - (1.0 - x[i]))

  // Find max negative deviation (the knee)
  const minD = Math.min(...d)
  if (minD >= 0) return n // curve above diagonal everywhere

  const kneeIdx = d.indexOf(minD)

  // Significance test
  const threshold = 0.30 / sensitivity
  if (Math.abs(minD) < threshold) return n

  // Extend past knee proportionally
  const cut = Math.floor(kneeIdx * (1.0 + 1.0 / sensitivity))
  return Math.min(cut, n)
}

function gapRatioDetect(scores: number[], cliffRatio: number): number {
  const n = scores.length
  if (n < 3) return n

  const gaps = Array.from({ length: n - 1 }, (_, i) => scores[i] - scores[i + 1])
  const totalRange = scores[0] - scores[n - 1]
  if (totalRange <= 0) return n
  const meanGap = totalRange / (n - 1)

  const skip = Math.max(3, Math.floor(n / 5))
  for (let i = skip; i < gaps.length; i++) {
    if (gaps[i] >= cliffRatio * meanGap) {
      return i + 1
    }
  }
  return n
}

function findRelevanceCliff(
  scores: number[],
  minResults = 4,
  sensitivity = 1.0,
  cliffRatio = 3.0,
): number {
  const n = scores.length
  if (n <= minResults) return n
  if (!scores.length || scores[0] === scores[n - 1]) return n

  const kneedleCut = kneedleDetect(scores, sensitivity)
  const gapCut = gapRatioDetect(scores, cliffRatio)

  const cuts: number[] = []
  if (kneedleCut < n) cuts.push(kneedleCut)
  if (gapCut < n) cuts.push(gapCut)

  if (cuts.length === 0) return n

  const cut = Math.min(...cuts)
  return Math.max(cut, minResults)
}

// ─── Validate TS port against Python fixtures ──────────────────────

function validatePort() {
  // Production fixtures from test_relevance_cliff.py
  const fixtures: Record<string, { scores: number[]; minKeep: number; maxKeep: number }> = {
    home_theater_budget: {
      scores: [
        1.0, 0.9287, 0.7676, 0.6526, 0.5243, 0.5193, 0.4737, 0.458, 0.4536, 0.4124,
        0.3943, 0.3783, 0.3655, 0.344, 0.3106, 0.2924, 0.2858, 0.2582, 0.2574, 0.2256,
        0.2231, 0.2192, 0.2097, 0.1958, 0.1933, 0.1802, 0.1603, 0.1553, 0.1501, 0.1322,
        0.1251, 0.1246, 0.1223, 0.107, 0.094, 0.0905, 0.0868, 0.0831, 0.0803, 0.0768,
        0.0734, 0.0725, 0.0529, 0.0306, 0.0201, 0.0095, 0.0047, 0.0,
      ],
      minKeep: 4,
      maxKeep: 25,
    },
    "4k_tv": {
      scores: [
        1.0, 0.9452, 0.864, 0.8295, 0.7829, 0.7374, 0.7236, 0.7226, 0.6758, 0.6481,
        0.6328, 0.6294, 0.6283, 0.6069, 0.5608, 0.5538, 0.5462, 0.4983, 0.4672, 0.4486,
        0.4486, 0.4369, 0.4332, 0.4256, 0.4198, 0.4098, 0.3736, 0.3672, 0.3102, 0.2864,
        0.2812, 0.259, 0.2555, 0.2492, 0.2165, 0.2113, 0.2037, 0.1555, 0.14, 0.0771,
        0.0637, 0.04, 0.0296, 0.0112, 0.0032, 0.003, 0.0003, 0.0,
      ],
      minKeep: 25,
      maxKeep: 48,
    },
    wireless_headphones: {
      scores: [
        1.0, 0.9631, 0.9336, 0.9314, 0.7878, 0.7628, 0.7538, 0.7256, 0.694, 0.6761,
        0.6254, 0.6087, 0.6051, 0.5783, 0.5532, 0.4962, 0.4855, 0.4603, 0.4572, 0.4035,
        0.3878, 0.3773, 0.3665, 0.3383, 0.3173, 0.3141, 0.2399, 0.21, 0.1982, 0.1966,
        0.1775, 0.1587, 0.1472, 0.1396, 0.123, 0.1223, 0.1221, 0.1182, 0.1103, 0.0985,
        0.0944, 0.0612, 0.0539, 0.0505, 0.0435, 0.0272, 0.013, 0.0,
      ],
      minKeep: 25,
      maxKeep: 48,
    },
    gift_baskets_mom: {
      scores: [
        1.0, 0.839, 0.7254, 0.7235, 0.6483, 0.6351, 0.5949, 0.569, 0.5634, 0.5634,
        0.5381, 0.5006, 0.4733, 0.466, 0.4574, 0.435, 0.4332, 0.4293, 0.4262, 0.4154,
        0.414, 0.4107, 0.3978, 0.3256, 0.3243, 0.2856, 0.2774, 0.266, 0.2625, 0.2344,
        0.2212, 0.2181, 0.2154, 0.2077, 0.1701, 0.1545, 0.1528, 0.1344, 0.1252, 0.1,
        0.0872, 0.078, 0.0607, 0.0457, 0.0447, 0.0346, 0.0254, 0.0,
      ],
      minKeep: 15,
      maxKeep: 48,
    },
    candles: {
      scores: [
        1.0, 0.9879, 0.8878, 0.8267, 0.5825, 0.54, 0.5133, 0.4759, 0.4724, 0.4499,
        0.3899, 0.3557, 0.3131, 0.3056, 0.2784, 0.2777, 0.2568, 0.2213, 0.2203, 0.2119,
        0.1947, 0.1946, 0.1898, 0.1853, 0.1622, 0.1601, 0.1542, 0.149, 0.1462, 0.1434,
        0.134, 0.1294, 0.1046, 0.1042, 0.1012, 0.0919, 0.0898, 0.0744, 0.0671, 0.0618,
        0.0451, 0.0401, 0.036, 0.0239, 0.019, 0.009, 0.0087, 0.0,
      ],
      minKeep: 15,
      maxKeep: 48,
    },
    laptop_gaming: {
      scores: [
        1.0, 0.8733, 0.8609, 0.8326, 0.77, 0.7658, 0.6519, 0.6282, 0.6135, 0.6074,
        0.5991, 0.589, 0.5601, 0.5296, 0.5184, 0.4841, 0.4544, 0.4515, 0.4509, 0.3966,
        0.369, 0.3486, 0.3455, 0.3449, 0.3446, 0.338, 0.2782, 0.2724, 0.223, 0.2179,
        0.1993, 0.1958, 0.1669, 0.1456, 0.1381, 0.1291, 0.1276, 0.0945, 0.0911, 0.0872,
        0.0779, 0.0597, 0.0505, 0.0482, 0.0381, 0.0359, 0.0162, 0.0,
      ],
      minKeep: 25,
      maxKeep: 48,
    },
  }

  let allPassed = true
  for (const [name, { scores, minKeep, maxKeep }] of Object.entries(fixtures)) {
    const keep = findRelevanceCliff(scores)
    const ok = keep >= minKeep && keep <= maxKeep
    if (!ok) {
      console.error(`  FAIL ${name}: keep=${keep}, expected ${minKeep}-${maxKeep}`)
      allPassed = false
    }
  }
  return allPassed
}

// ─── Search API ────────────────────────────────────────────────────

interface SearchResult {
  id: string
  title: string
  price: number
  vendor: string
  product_type: string
  category: string
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  relevance_scores: Record<string, number>
  search_mode: string
}

async function runSearch(query: string, collection: string): Promise<SearchResponse> {
  const res = await fetch(`${SEARCH_BASE}/api/xtal/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, collection, limit: LIMIT }),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── Main ──────────────────────────────────────────────────────────

interface QueryResult {
  id: number
  query: string
  archetype: string
  collection: string
  breadth: "broad" | "medium" | "narrow"
  total: number
  scores: number[]
  keep: number
  kneedleCut: number
  gapCut: number
  cutPercent: number
  scoreAtCut: number | null
  verdict: string
  keptProducts: { pos: number; title: string; price: number; vendor: string; category: string }[]
  cutProducts: { pos: number; title: string; price: number; vendor: string; category: string }[]
}

async function main() {
  console.log("=== CLIFF AUDIT — Shopper Sanity Check ===\n")

  // Phase 0: Validate TS port
  console.log("Validating TS port against Python fixtures...")
  if (!validatePort()) {
    console.error("\nFATAL: TS port does not match Python algorithm. Fix before proceeding.")
    process.exit(1)
  }
  console.log("  All 6 fixtures pass.\n")

  const queries = buildQueries()
  console.log(`Running ${queries.length} queries (sensitivity=${SENSITIVITY}, cliff_ratio=${CLIFF_RATIO})...\n`)

  // Phase 1: Run queries
  const results: QueryResult[] = []
  for (const q of queries) {
    process.stdout.write(`  Q${String(q.id).padStart(2)}: [${q.collection}] "${q.query}"...`)

    try {
      const data = await runSearch(q.query, q.collection)
      const products = data.results || []

      // Build score array in result order (they come pre-sorted by relevance)
      const scores = products.map(p => data.relevance_scores[p.id] ?? 0)
      // Sort descending for cliff detection
      const sortedScores = [...scores].sort((a, b) => b - a)

      const keep = findRelevanceCliff(sortedScores, 4, SENSITIVITY, CLIFF_RATIO)
      const kneedleCut = kneedleDetect(sortedScores, SENSITIVITY)
      const gapCut = gapRatioDetect(sortedScores, CLIFF_RATIO)

      const total = products.length
      const cutPercent = total > 0 ? Math.round(((total - keep) / total) * 100) : 0
      const scoreAtCut = keep > 0 && keep <= sortedScores.length ? sortedScores[keep - 1] : null

      // Map products to their cliff position
      const scored = products.map((p, i) => ({
        pos: i + 1,
        title: (p.title || "").substring(0, 70),
        price: p.price || 0,
        vendor: p.vendor || "",
        category: p.product_type || p.category || "",
        score: scores[i],
      }))

      // Sort by score descending to match cliff ordering
      scored.sort((a, b) => b.score - a.score)

      const keptProducts = scored.slice(0, keep).map(p => ({
        pos: p.pos,
        title: p.title,
        price: p.price,
        vendor: p.vendor,
        category: p.category,
      }))
      const cutProducts = scored.slice(keep).map(p => ({
        pos: p.pos,
        title: p.title,
        price: p.price,
        vendor: p.vendor,
        category: p.category,
      }))

      // Verdict heuristic
      let verdict = "OK"
      const keepRatio = keep / total
      if (
        (q.breadth === "broad" || q.breadth === "medium") &&
        keepRatio < 0.5 &&
        total >= 20
      ) {
        verdict = "⚠ AGGRESSIVE"
      } else if (q.breadth === "narrow" && keepRatio > 0.7 && total >= 20) {
        verdict = "⚠ PERMISSIVE"
      }

      results.push({
        ...q,
        total,
        scores: sortedScores,
        keep,
        kneedleCut,
        gapCut,
        cutPercent,
        scoreAtCut,
        verdict,
        keptProducts,
        cutProducts,
      })

      console.log(
        ` ${total} results → keep ${keep} (${100 - cutPercent}%) ${verdict !== "OK" ? verdict : ""}`,
      )
    } catch (e: any) {
      console.log(` ERROR: ${e.message}`)
      results.push({
        ...q,
        total: 0,
        scores: [],
        keep: 0,
        kneedleCut: 0,
        gapCut: 0,
        cutPercent: 0,
        scoreAtCut: null,
        verdict: "ERROR",
        keptProducts: [],
        cutProducts: [],
      })
    }

    await new Promise(r => setTimeout(r, DELAY_MS))
  }

  // Phase 2: Print report
  console.log("\n" + "=".repeat(70))
  console.log("CLIFF AUDIT SUMMARY")
  console.log("=".repeat(70))

  // Per-collection summary
  for (const coll of ["bestbuy", "willow"]) {
    const collResults = results.filter(r => r.collection === coll && r.verdict !== "ERROR")
    if (collResults.length === 0) continue
    const avgKeep = collResults.reduce((s, r) => s + r.keep, 0) / collResults.length
    const avgCut = collResults.reduce((s, r) => s + r.cutPercent, 0) / collResults.length
    const mismatches = collResults.filter(r => r.verdict.includes("⚠")).length
    console.log(
      `\n  ${coll.padEnd(10)} | ${collResults.length} queries | Avg keep: ${avgKeep.toFixed(1)} | Avg cut: ${avgCut.toFixed(0)}% | Flagged: ${mismatches}/${collResults.length}`,
    )
  }

  // Flagged queries
  const flagged = results.filter(r => r.verdict.includes("⚠"))
  if (flagged.length > 0) {
    console.log("\n" + "─".repeat(70))
    console.log("FLAGGED: Cliff may need adjustment")
    console.log("─".repeat(70))

    for (const r of flagged) {
      console.log(`\n  Q${r.id}: "${r.query}" [${r.collection}] — ${r.archetype.toUpperCase()} (${r.breadth})`)
      console.log(`    ${r.total} results → cliff keeps ${r.keep} (${100 - r.cutPercent}%)`)
      console.log(
        `    Score at cut: ${r.scoreAtCut?.toFixed(4) ?? "N/A"} | Kneedle: ${r.kneedleCut} | Gap: ${r.gapCut}`,
      )
      console.log(`    KEPT: ${r.keptProducts.slice(0, 5).map((p, i) => `[${i + 1}] ${p.title.substring(0, 45)} ($${p.price})`).join("  ")}`)
      if (r.cutProducts.length > 0) {
        console.log(`    ─── CUT LINE ───`)
        console.log(`    CUT:  ${r.cutProducts.slice(0, 5).map((p, i) => `[${r.keep + i + 1}] ${p.title.substring(0, 45)} ($${p.price})`).join("  ")}`)
        // Summarize cut categories
        const cutCategories = [...new Set(r.cutProducts.map(p => p.category).filter(Boolean))]
        if (cutCategories.length > 0) {
          console.log(`    ⚠ CUT INCLUDES: ${cutCategories.slice(0, 6).join(", ")}`)
        }
      }
    }
  }

  // Full table
  console.log("\n" + "─".repeat(70))
  console.log("ALL RESULTS")
  console.log("─".repeat(70))
  console.log(
    `\n  ${"#".padStart(3)} | ${"Query".padEnd(40)} | ${"Coll".padEnd(7)} | ${"Archetype".padEnd(22)} | ${"Tot".padStart(3)} | ${"Keep".padStart(4)} | ${"Cut%".padStart(4)} | Verdict`,
  )
  console.log("  " + "─".repeat(100))
  for (const r of results) {
    console.log(
      `  ${String(r.id).padStart(3)} | ${r.query.padEnd(40).substring(0, 40)} | ${r.collection.padEnd(7)} | ${r.archetype.padEnd(22)} | ${String(r.total).padStart(3)} | ${String(r.keep).padStart(4)} | ${String(r.cutPercent).padStart(3)}% | ${r.verdict}`,
    )
  }

  // Detailed per-query breakdown (for flagged + a few non-flagged)
  console.log("\n" + "─".repeat(70))
  console.log("DETAILED BREAKDOWNS (flagged queries + sample)")
  console.log("─".repeat(70))

  const detailed = [
    ...flagged,
    ...results.filter(r => !r.verdict.includes("⚠") && r.verdict !== "ERROR").slice(0, 4),
  ]

  for (const r of detailed) {
    console.log(`\n  === Q${r.id}: "${r.query}" [${r.collection}] (${r.archetype}) ===`)
    console.log(`  Total: ${r.total} | Keep: ${r.keep} | Kneedle: ${r.kneedleCut} | Gap: ${r.gapCut} | ${r.verdict}`)

    // Show score distribution summary
    if (r.scores.length > 0) {
      const q25 = r.scores[Math.floor(r.scores.length * 0.25)]
      const q50 = r.scores[Math.floor(r.scores.length * 0.5)]
      const q75 = r.scores[Math.floor(r.scores.length * 0.75)]
      console.log(
        `  Scores: max=${r.scores[0].toFixed(3)} q25=${q25.toFixed(3)} median=${q50.toFixed(3)} q75=${q75.toFixed(3)} min=${r.scores[r.scores.length - 1].toFixed(3)}`,
      )
    }

    console.log(`\n  KEPT (${r.keptProducts.length}):`)
    for (const p of r.keptProducts.slice(0, 10)) {
      console.log(`    ${String(p.pos).padStart(3)}. ${p.title.substring(0, 55).padEnd(55)} $${String(p.price).padStart(7)} | ${p.vendor} | ${p.category}`)
    }
    if (r.keptProducts.length > 10) console.log(`    ... and ${r.keptProducts.length - 10} more`)

    if (r.cutProducts.length > 0) {
      console.log(`  ─── CUT LINE (score: ${r.scoreAtCut?.toFixed(4) ?? "?"}) ───`)
      console.log(`  CUT (${r.cutProducts.length}):`)
      for (const p of r.cutProducts.slice(0, 10)) {
        console.log(`    ${String(p.pos).padStart(3)}. ${p.title.substring(0, 55).padEnd(55)} $${String(p.price).padStart(7)} | ${p.vendor} | ${p.category}`)
      }
      if (r.cutProducts.length > 10) console.log(`    ... and ${r.cutProducts.length - 10} more`)
    }
  }

  // Phase 3: Save JSON
  mkdirSync("c:/vibe/xtal-site/scripts/cliff-audit", { recursive: true })
  const outPath = "c:/vibe/xtal-site/scripts/cliff-audit/results.json"
  writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`\nSaved full results to ${outPath}`)

  // Final stats
  const ok = results.filter(r => r.verdict === "OK").length
  const aggressive = results.filter(r => r.verdict === "⚠ AGGRESSIVE").length
  const permissive = results.filter(r => r.verdict === "⚠ PERMISSIVE").length
  const errors = results.filter(r => r.verdict === "ERROR").length
  console.log(`\nFinal: ${ok} OK, ${aggressive} aggressive, ${permissive} permissive, ${errors} errors out of ${results.length} queries`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
