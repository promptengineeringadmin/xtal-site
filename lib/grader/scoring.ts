import type { DimensionKey, DimensionScore, Grade, RevenueImpact } from "./types"

// ─── Dimension Weights ──────────────────────────────────────

export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  result_relevance: 0.20,
  null_rate: 0.15,
  typo_tolerance: 0.15,
  response_speed: 0.13,
  natural_language: 0.12, // A-grade gatekeeper: 0 on NLP caps score at ~79 → B
  category_intelligence: 0.10,
  long_tail: 0.08,
  synonym_handling: 0.07,
}

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  typo_tolerance: "Typo Tolerance",
  synonym_handling: "Synonym Handling",
  natural_language: "Natural Language",
  long_tail: "Long-tail Specificity",
  null_rate: "Null Result Rate",
  category_intelligence: "Category Intelligence",
  result_relevance: "Result Relevance",
  response_speed: "Response Speed",
}

// ─── Grading ────────────────────────────────────────────────

export function scoreToGrade(score: number): Grade {
  if (score >= 80) return "A"
  if (score >= 60) return "B"
  if (score >= 40) return "C"
  if (score >= 20) return "D"
  return "F"
}

export function computeOverallScore(dimensions: DimensionScore[]): number {
  const weighted = dimensions.reduce((sum, d) => {
    const weight = DIMENSION_WEIGHTS[d.key] ?? 0
    return sum + d.score * weight
  }, 0)
  return Math.round(weighted)
}

// ─── Response Speed Scoring ─────────────────────────────────

export function scoreResponseSpeed(avgMs: number): number {
  if (avgMs < 200) return 98
  if (avgMs < 350) return 88
  if (avgMs < 500) return 80
  if (avgMs < 750) return 72
  if (avgMs < 1000) return 65
  if (avgMs < 1500) return 55
  if (avgMs < 2000) return 45
  if (avgMs < 3000) return 30
  if (avgMs < 5000) return 15
  return 5
}

// ─── Revenue Impact ─────────────────────────────────────────
// Based on Econsultancy, Baymard Institute, and Algolia research:
// - 30% of visitors use site search (Econsultancy upper-bound, widely cited)
// - Searchers convert at 5.5% vs ~2.5% site avg (Forrester, Klevu: ~2x multiplier)
// - Searcher AOV is 12% higher than average (Econsultancy: 10-15% lift)
// - 80% of users bounce after zero results (Algolia, Econsultancy)

export function estimateRevenueImpact(
  overallScore: number,
  estimatedMonthlyVisitors = 10_000
): RevenueImpact {
  const searchUsageRate = 0.30
  const searchConversionRate = 0.055  // Forrester/Klevu consensus: ~2x site avg
  const avgOrderValue = 95            // $85 base + 12% searcher AOV lift

  let lostConversionPct: number
  if (overallScore < 20) lostConversionPct = 0.45       // F: broken search, ~half of search revenue lost
  else if (overallScore < 40) lostConversionPct = 0.27   // D: high null rate, no fuzzy matching
  else if (overallScore < 60) lostConversionPct = 0.16   // C: decent basics but gaps
  else if (overallScore < 80) lostConversionPct = 0.09   // B: good search, minor opportunities
  else lostConversionPct = 0.03                           // A: near-optimal, edge cases only

  const monthlySearchUsers = estimatedMonthlyVisitors * searchUsageRate
  const lostRevenue =
    monthlySearchUsers * searchConversionRate * lostConversionPct * avgOrderValue

  return {
    monthlyLostRevenue: Math.round(lostRevenue),
    annualLostRevenue: Math.round(lostRevenue * 12),
    improvementPotential: `${Math.round(lostConversionPct * 100)}%`,
  }
}

// ─── Cost Per Failed Search ─────────────────────────────────
// Each zero-result search that causes a bounce = lost conversion opportunity.
// Formula: searcherCVR × AOV × noResultsBounceRate
// Sources: Forrester (5.5% CVR), Econsultancy (+12% AOV), Algolia (80% bounce)

export function computeCostPerFailedSearch(aov = 100): number {
  const searchConversionRate = 0.055
  const noResultsBounceRate = 0.80
  return searchConversionRate * aov * noResultsBounceRate
}

// Legacy RPV export (used by report components)
export function computeRpvLoss(overallScore: number): number {
  return computeCostPerFailedSearch()
}
