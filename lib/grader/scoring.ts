import type { DimensionKey, DimensionScore, Grade, RevenueImpact } from "./types"

// ─── Dimension Weights ──────────────────────────────────────

export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  typo_tolerance: 0.15,
  synonym_handling: 0.15,
  natural_language: 0.15,
  long_tail: 0.15,
  null_rate: 0.10,
  category_intelligence: 0.10,
  result_relevance: 0.10,
  response_speed: 0.10,
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
  if (score >= 85) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  if (score >= 40) return "D"
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
  if (avgMs < 200) return 100
  if (avgMs < 500) return 85
  if (avgMs < 1000) return 70
  if (avgMs < 2000) return 55
  if (avgMs < 5000) return 30
  return 10
}

// ─── Revenue Impact ─────────────────────────────────────────

export function estimateRevenueImpact(
  overallScore: number,
  estimatedMonthlyVisitors = 10_000
): RevenueImpact {
  const searchUsageRate = 0.30
  const searchConversionRate = 0.04
  const avgOrderValue = 85

  let lostConversionPct: number
  if (overallScore < 40) lostConversionPct = 0.30
  else if (overallScore < 55) lostConversionPct = 0.20
  else if (overallScore < 70) lostConversionPct = 0.10
  else if (overallScore < 85) lostConversionPct = 0.05
  else lostConversionPct = 0.01

  const monthlySearchUsers = estimatedMonthlyVisitors * searchUsageRate
  const lostRevenue =
    monthlySearchUsers * searchConversionRate * lostConversionPct * avgOrderValue

  return {
    monthlyLostRevenue: Math.round(lostRevenue),
    annualLostRevenue: Math.round(lostRevenue * 12),
    improvementPotential: `${Math.round(lostConversionPct * 100)}%`,
  }
}

// ─── Revenue Per Visit (RPV) Loss ───────────────────────────

export function computeRpvLoss(overallScore: number): number {
  const searchUsageRate = 0.30
  const searchConversionRate = 0.04
  const avgOrderValue = 85

  let lostConversionPct: number
  if (overallScore < 40) lostConversionPct = 0.30
  else if (overallScore < 55) lostConversionPct = 0.20
  else if (overallScore < 70) lostConversionPct = 0.10
  else if (overallScore < 85) lostConversionPct = 0.05
  else lostConversionPct = 0.01

  return searchUsageRate * searchConversionRate * lostConversionPct * avgOrderValue
}
