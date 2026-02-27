/**
 * Per-query grading for teardown comparisons.
 *
 * Deterministic scoring — no LLM calls. Grades each query by:
 * - Result count (merchant vs XTAL)
 * - Category-specific logic (price compliance for budget, etc.)
 * - Response time
 *
 * Grade thresholds match the site grader: A(80+), B(60+), C(40+), D(20+), F(<20)
 */

import type { QueryComparison } from "./types"

// ── Types ────────────────────────────────────────────────────

export interface QueryGrade {
  letter: "A" | "B" | "C" | "D" | "F"
  score: number
  reason: string
}

// ── Grade thresholds (match lib/grader/scoring.ts) ───────────

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 80) return "A"
  if (score >= 60) return "B"
  if (score >= 40) return "C"
  if (score >= 20) return "D"
  return "F"
}

// ── Result count scoring ─────────────────────────────────────

function scoreResultCount(merchantCount: number, xtalCount: number): number {
  // If merchant returned good results, give credit
  if (merchantCount >= 5) return 80
  if (merchantCount >= 3) return 60
  if (merchantCount >= 1) return 40

  // 0 results — penalty depends on whether XTAL found results
  if (xtalCount > 0) return 5 // XTAL found results but merchant didn't
  return 15 // Neither found results — less harsh (may be a bad query)
}

// ── Response time scoring ────────────────────────────────────

function scoreResponseTime(ms: number): number {
  if (ms < 500) return 95
  if (ms < 1000) return 85
  if (ms < 2000) return 70
  if (ms < 3000) return 55
  if (ms < 5000) return 35
  return 15
}

// ── Category-specific grading ────────────────────────────────

function gradeTypo(comp: QueryComparison): QueryGrade {
  const mc = comp.merchant.resultCount
  const xc = comp.xtal.resultCount

  if (mc >= 3) {
    return { letter: scoreToGrade(85), score: 85, reason: "Handled misspelling well" }
  }
  if (mc >= 1) {
    return { letter: scoreToGrade(55), score: 55, reason: "Partial typo handling" }
  }
  if (xc > 0) {
    return { letter: "F", score: 10, reason: "0 results for misspelled query" }
  }
  return { letter: "F", score: 15, reason: "No results (niche query)" }
}

function gradeNaturalLanguage(comp: QueryComparison): QueryGrade {
  const mc = comp.merchant.resultCount
  const xc = comp.xtal.resultCount
  const mr = comp.merchant.results.length

  // NLP queries are the hardest — most keyword-based engines fail
  if (mc === 0 && xc > 0) {
    return { letter: "F", score: 5, reason: "No NLP understanding — 0 results" }
  }
  if (mc === 0) {
    return { letter: "F", score: 10, reason: "Failed natural language query" }
  }
  if (mr >= 5) {
    return { letter: scoreToGrade(75), score: 75, reason: "Returned results for conversational query" }
  }
  if (mr >= 2) {
    return { letter: scoreToGrade(50), score: 50, reason: "Limited NLP results" }
  }
  return { letter: scoreToGrade(35), score: 35, reason: "Minimal NLP handling" }
}

function gradeBudget(comp: QueryComparison): QueryGrade {
  const mc = comp.merchant.resultCount
  const mr = comp.merchant.results

  if (mc === 0) {
    return { letter: "F", score: 5, reason: "No results for budget query" }
  }

  // Check price compliance: extract budget from query
  const priceMatch = comp.query.match(/(?:under|below|less than|<)\s*\$?(\d+)/i) ||
    comp.query.match(/\$?(\d+)\s*(?:budget|or less|max)/i)

  if (priceMatch && mr.length > 0) {
    const budget = parseFloat(priceMatch[1])
    const withinBudget = mr.filter((r) => r.price != null && r.price <= budget)
    const compliance = withinBudget.length / mr.length

    if (compliance >= 0.7) {
      return { letter: scoreToGrade(85), score: 85, reason: "Price-compliant results" }
    }
    if (compliance >= 0.3) {
      return { letter: scoreToGrade(55), score: 55, reason: "Mixed price compliance" }
    }
    return { letter: scoreToGrade(25), score: 25, reason: "Ignored price constraint" }
  }

  // No price extractable — grade on result count
  return gradeByResultCount(comp, "budget query")
}

function gradeUseCase(comp: QueryComparison): QueryGrade {
  const mc = comp.merchant.resultCount
  const xc = comp.xtal.resultCount

  if (mc === 0 && xc > 0) {
    return { letter: "F", score: 5, reason: "No results for use-case query" }
  }
  if (mc === 0) {
    return { letter: "F", score: 10, reason: "Failed use-case query" }
  }
  if (mc >= 5) {
    return { letter: scoreToGrade(75), score: 75, reason: "Reasonable use-case results" }
  }
  return gradeByResultCount(comp, "use-case query")
}

function gradeSynonym(comp: QueryComparison): QueryGrade {
  const mc = comp.merchant.resultCount
  const xc = comp.xtal.resultCount

  if (mc === 0 && xc > 0) {
    return { letter: "F", score: 8, reason: "No synonym recognition" }
  }
  if (mc === 0) {
    return { letter: "F", score: 15, reason: "Unrecognized synonym" }
  }
  if (mc >= 3) {
    return { letter: scoreToGrade(80), score: 80, reason: "Good synonym handling" }
  }
  return gradeByResultCount(comp, "synonym query")
}

function gradeLongTail(comp: QueryComparison): QueryGrade {
  const mc = comp.merchant.resultCount
  const xc = comp.xtal.resultCount

  if (mc === 0 && xc > 0) {
    return { letter: "F", score: 5, reason: "No long-tail matching" }
  }
  if (mc === 0) {
    return { letter: "D", score: 20, reason: "No results (complex query)" }
  }
  if (mc >= 3) {
    return { letter: scoreToGrade(75), score: 75, reason: "Handled multi-attribute query" }
  }
  return gradeByResultCount(comp, "long-tail query")
}

function gradeCategory(comp: QueryComparison): QueryGrade {
  const mc = comp.merchant.resultCount

  if (mc === 0) {
    return { letter: "F", score: 10, reason: "No category results" }
  }
  if (mc >= 10) {
    return { letter: scoreToGrade(85), score: 85, reason: "Good category coverage" }
  }
  if (mc >= 5) {
    return { letter: scoreToGrade(70), score: 70, reason: "Moderate category coverage" }
  }
  return gradeByResultCount(comp, "category query")
}

function gradeGift(comp: QueryComparison): QueryGrade {
  const mc = comp.merchant.resultCount
  const xc = comp.xtal.resultCount

  if (mc === 0 && xc > 0) {
    return { letter: "F", score: 5, reason: "No gift-appropriate results" }
  }
  if (mc === 0) {
    return { letter: "F", score: 10, reason: "Failed gift query" }
  }
  if (mc >= 5) {
    return { letter: scoreToGrade(75), score: 75, reason: "Gift-relevant results" }
  }
  return gradeByResultCount(comp, "gift query")
}

// ── Generic result-count grading fallback ────────────────────

function gradeByResultCount(
  comp: QueryComparison,
  label: string,
): QueryGrade {
  const resultScore = scoreResultCount(
    comp.merchant.resultCount,
    comp.xtal.resultCount,
  )
  const timeScore = scoreResponseTime(comp.merchant.responseTime)

  // Weighted: 75% results, 25% speed
  const score = Math.round(resultScore * 0.75 + timeScore * 0.25)

  return {
    letter: scoreToGrade(score),
    score,
    reason: `${comp.merchant.resultCount} results for ${label}`,
  }
}

// ── Main grading function ────────────────────────────────────

const CATEGORY_GRADERS: Record<
  string,
  (comp: QueryComparison) => QueryGrade
> = {
  typo: gradeTypo,
  natural_language: gradeNaturalLanguage,
  budget: gradeBudget,
  use_case: gradeUseCase,
  synonym: gradeSynonym,
  long_tail: gradeLongTail,
  category: gradeCategory,
  gift: gradeGift,
}

export function gradeQuery(comp: QueryComparison): QueryGrade {
  const grader = CATEGORY_GRADERS[comp.category]
  if (grader) {
    return grader(comp)
  }
  // Fallback for unknown categories
  return gradeByResultCount(comp, comp.category)
}

// ── Aggregate scoring ────────────────────────────────────────

export interface DimensionSummary {
  avgScore: number
  grade: string
  queryCount: number
}

export function computeTeardownScore(
  comparisons: QueryComparison[],
): {
  overallScore: number
  overallGrade: string
  dimensionScores: Record<string, DimensionSummary>
} {
  const byCategory: Record<string, { total: number; count: number }> = {}

  for (const comp of comparisons) {
    const grade = gradeQuery(comp)
    const cat = comp.category
    if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 }
    byCategory[cat].total += grade.score
    byCategory[cat].count += 1
  }

  const dimensionScores: Record<string, DimensionSummary> = {}
  let totalScore = 0
  let totalWeight = 0

  for (const cat of Object.keys(byCategory)) {
    const avg = byCategory[cat].total / byCategory[cat].count
    dimensionScores[cat] = {
      avgScore: Math.round(avg),
      grade: scoreToGrade(avg),
      queryCount: byCategory[cat].count,
    }
    totalScore += avg * byCategory[cat].count
    totalWeight += byCategory[cat].count
  }

  const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0

  return {
    overallScore,
    overallGrade: scoreToGrade(overallScore),
    dimensionScores,
  }
}
