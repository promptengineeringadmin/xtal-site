import { describe, it, expect } from "vitest"
import {
  scoreToGrade,
  computeOverallScore,
  scoreResponseSpeed,
  estimateRevenueImpact,
  DIMENSION_WEIGHTS,
  DIMENSION_LABELS,
} from "../../lib/grader/scoring"
import type { DimensionScore, DimensionKey, Grade } from "../../lib/grader/types"

// ─── Helper to build a DimensionScore ───────────────────────

function makeDimension(
  key: DimensionKey,
  score: number,
  overrides?: Partial<DimensionScore>
): DimensionScore {
  return {
    key,
    label: DIMENSION_LABELS[key],
    score,
    grade: scoreToGrade(score),
    weight: DIMENSION_WEIGHTS[key],
    failures: [],
    explanation: `Test explanation for ${key}`,
    testQueries: [],
    ...overrides,
  }
}

// ─── scoreToGrade() ─────────────────────────────────────────

describe("scoreToGrade", () => {
  it("returns A for score >= 90", () => {
    expect(scoreToGrade(90)).toBe("A")
    expect(scoreToGrade(95)).toBe("A")
    expect(scoreToGrade(100)).toBe("A")
  })

  it("returns B for score 80-89", () => {
    expect(scoreToGrade(80)).toBe("B")
    expect(scoreToGrade(85)).toBe("B")
    expect(scoreToGrade(89)).toBe("B")
  })

  it("returns C for score 70-79", () => {
    expect(scoreToGrade(70)).toBe("C")
    expect(scoreToGrade(75)).toBe("C")
    expect(scoreToGrade(79)).toBe("C")
  })

  it("returns D for score 60-69", () => {
    expect(scoreToGrade(60)).toBe("D")
    expect(scoreToGrade(65)).toBe("D")
    expect(scoreToGrade(69)).toBe("D")
  })

  it("returns F for score < 60", () => {
    expect(scoreToGrade(59)).toBe("F")
    expect(scoreToGrade(30)).toBe("F")
    expect(scoreToGrade(0)).toBe("F")
  })

  it("handles exact boundary values", () => {
    expect(scoreToGrade(90)).toBe("A")
    expect(scoreToGrade(89)).toBe("B")
    expect(scoreToGrade(80)).toBe("B")
    expect(scoreToGrade(79)).toBe("C")
    expect(scoreToGrade(70)).toBe("C")
    expect(scoreToGrade(69)).toBe("D")
    expect(scoreToGrade(60)).toBe("D")
    expect(scoreToGrade(59)).toBe("F")
  })
})

// ─── computeOverallScore() ──────────────────────────────────

describe("computeOverallScore", () => {
  it("computes weighted average of all dimensions", () => {
    // All dimensions at 100 should yield 100
    const dimensions = Object.keys(DIMENSION_WEIGHTS).map((key) =>
      makeDimension(key as DimensionKey, 100)
    )
    expect(computeOverallScore(dimensions)).toBe(100)
  })

  it("returns 0 when all dimensions score 0", () => {
    const dimensions = Object.keys(DIMENSION_WEIGHTS).map((key) =>
      makeDimension(key as DimensionKey, 0)
    )
    expect(computeOverallScore(dimensions)).toBe(0)
  })

  it("handles uniform score of 50 across all dimensions", () => {
    const dimensions = Object.keys(DIMENSION_WEIGHTS).map((key) =>
      makeDimension(key as DimensionKey, 50)
    )
    expect(computeOverallScore(dimensions)).toBe(50)
  })

  it("rounds to nearest integer", () => {
    // Set up a case that would produce a non-integer
    // typo_tolerance (0.15) = 73, everything else = 80
    const dimensions = Object.keys(DIMENSION_WEIGHTS).map((key) =>
      makeDimension(key as DimensionKey, key === "typo_tolerance" ? 73 : 80)
    )
    // Expected: 73 * 0.15 + 80 * 0.85 = 10.95 + 68 = 78.95 -> 79
    const result = computeOverallScore(dimensions)
    expect(result).toBe(Math.round(result))
  })

  it("correctly weights high-weight vs low-weight dimensions", () => {
    // High-weight dimensions (0.15 each) score 100, low-weight (0.10) score 0
    const dimensions = Object.keys(DIMENSION_WEIGHTS).map((key) => {
      const k = key as DimensionKey
      const score = DIMENSION_WEIGHTS[k] >= 0.15 ? 100 : 0
      return makeDimension(k, score)
    })
    // 4 dimensions at 0.15 = 0.60 total weight, scoring 100
    // 4 dimensions at 0.10 = 0.40 total weight, scoring 0
    expect(computeOverallScore(dimensions)).toBe(60)
  })

  it("handles empty dimensions array", () => {
    expect(computeOverallScore([])).toBe(0)
  })

  it("handles partial dimensions (not all keys present)", () => {
    const dimensions = [makeDimension("typo_tolerance", 80)]
    // 80 * 0.15 = 12
    expect(computeOverallScore(dimensions)).toBe(12)
  })

  it("weights sum to 1.0", () => {
    const totalWeight = Object.values(DIMENSION_WEIGHTS).reduce(
      (sum, w) => sum + w,
      0
    )
    expect(totalWeight).toBeCloseTo(1.0, 5)
  })
})

// ─── DIMENSION_WEIGHTS constants ────────────────────────────

describe("DIMENSION_WEIGHTS", () => {
  it("has all 8 dimension keys", () => {
    const expectedKeys: DimensionKey[] = [
      "typo_tolerance",
      "synonym_handling",
      "natural_language",
      "long_tail",
      "null_rate",
      "category_intelligence",
      "result_relevance",
      "response_speed",
    ]
    expect(Object.keys(DIMENSION_WEIGHTS).sort()).toEqual(expectedKeys.sort())
  })

  it("has weights that sum to 1.0", () => {
    const total = Object.values(DIMENSION_WEIGHTS).reduce((s, w) => s + w, 0)
    expect(total).toBeCloseTo(1.0)
  })

  it("has no negative weights", () => {
    for (const w of Object.values(DIMENSION_WEIGHTS)) {
      expect(w).toBeGreaterThan(0)
    }
  })
})

// ─── DIMENSION_LABELS constants ─────────────────────────────

describe("DIMENSION_LABELS", () => {
  it("has a label for every dimension key", () => {
    for (const key of Object.keys(DIMENSION_WEIGHTS)) {
      expect(DIMENSION_LABELS[key as DimensionKey]).toBeDefined()
      expect(typeof DIMENSION_LABELS[key as DimensionKey]).toBe("string")
      expect(DIMENSION_LABELS[key as DimensionKey].length).toBeGreaterThan(0)
    }
  })
})

// ─── scoreResponseSpeed() ───────────────────────────────────

describe("scoreResponseSpeed", () => {
  it("returns 100 for < 200ms", () => {
    expect(scoreResponseSpeed(0)).toBe(100)
    expect(scoreResponseSpeed(50)).toBe(100)
    expect(scoreResponseSpeed(199)).toBe(100)
  })

  it("returns 85 for 200-499ms", () => {
    expect(scoreResponseSpeed(200)).toBe(85)
    expect(scoreResponseSpeed(350)).toBe(85)
    expect(scoreResponseSpeed(499)).toBe(85)
  })

  it("returns 70 for 500-999ms", () => {
    expect(scoreResponseSpeed(500)).toBe(70)
    expect(scoreResponseSpeed(750)).toBe(70)
    expect(scoreResponseSpeed(999)).toBe(70)
  })

  it("returns 55 for 1000-1999ms", () => {
    expect(scoreResponseSpeed(1000)).toBe(55)
    expect(scoreResponseSpeed(1500)).toBe(55)
    expect(scoreResponseSpeed(1999)).toBe(55)
  })

  it("returns 30 for 2000-4999ms", () => {
    expect(scoreResponseSpeed(2000)).toBe(30)
    expect(scoreResponseSpeed(3000)).toBe(30)
    expect(scoreResponseSpeed(4999)).toBe(30)
  })

  it("returns 10 for >= 5000ms", () => {
    expect(scoreResponseSpeed(5000)).toBe(10)
    expect(scoreResponseSpeed(10000)).toBe(10)
    expect(scoreResponseSpeed(60000)).toBe(10)
  })

  it("handles exact boundary values correctly", () => {
    expect(scoreResponseSpeed(199)).toBe(100)
    expect(scoreResponseSpeed(200)).toBe(85)
    expect(scoreResponseSpeed(499)).toBe(85)
    expect(scoreResponseSpeed(500)).toBe(70)
    expect(scoreResponseSpeed(999)).toBe(70)
    expect(scoreResponseSpeed(1000)).toBe(55)
    expect(scoreResponseSpeed(1999)).toBe(55)
    expect(scoreResponseSpeed(2000)).toBe(30)
    expect(scoreResponseSpeed(4999)).toBe(30)
    expect(scoreResponseSpeed(5000)).toBe(10)
  })
})

// ─── estimateRevenueImpact() ────────────────────────────────

describe("estimateRevenueImpact", () => {
  it("returns correct structure with all fields", () => {
    const result = estimateRevenueImpact(50)
    expect(result).toHaveProperty("monthlyLostRevenue")
    expect(result).toHaveProperty("annualLostRevenue")
    expect(result).toHaveProperty("improvementPotential")
    expect(typeof result.monthlyLostRevenue).toBe("number")
    expect(typeof result.annualLostRevenue).toBe("number")
    expect(typeof result.improvementPotential).toBe("string")
  })

  it("annual = monthly * 12", () => {
    const result = estimateRevenueImpact(50)
    expect(result.annualLostRevenue).toBe(result.monthlyLostRevenue * 12)
  })

  it("uses 30% lost conversion for score < 50", () => {
    const result = estimateRevenueImpact(40)
    // 10000 * 0.30 * 0.04 * 0.30 * 85 = 3060
    expect(result.monthlyLostRevenue).toBe(3060)
    expect(result.improvementPotential).toBe("30%")
  })

  it("uses 15% lost conversion for score 50-69", () => {
    const result = estimateRevenueImpact(60)
    // 10000 * 0.30 * 0.04 * 0.15 * 85 = 1530
    expect(result.monthlyLostRevenue).toBe(1530)
    expect(result.improvementPotential).toBe("15%")
  })

  it("uses 5% lost conversion for score 70-84", () => {
    const result = estimateRevenueImpact(75)
    // 10000 * 0.30 * 0.04 * 0.05 * 85 = 510
    expect(result.monthlyLostRevenue).toBe(510)
    expect(result.improvementPotential).toBe("5%")
  })

  it("uses 1% lost conversion for score >= 85", () => {
    const result = estimateRevenueImpact(90)
    // 10000 * 0.30 * 0.04 * 0.01 * 85 = 102
    expect(result.monthlyLostRevenue).toBe(102)
    expect(result.improvementPotential).toBe("1%")
  })

  it("accepts custom monthly visitors", () => {
    const result = estimateRevenueImpact(40, 50_000)
    // 50000 * 0.30 * 0.04 * 0.30 * 85 = 15300
    expect(result.monthlyLostRevenue).toBe(15300)
  })

  it("defaults to 10,000 monthly visitors", () => {
    const defaultResult = estimateRevenueImpact(40)
    const explicitResult = estimateRevenueImpact(40, 10_000)
    expect(defaultResult.monthlyLostRevenue).toBe(
      explicitResult.monthlyLostRevenue
    )
  })

  it("returns integer values (rounded)", () => {
    const result = estimateRevenueImpact(50, 777)
    expect(Number.isInteger(result.monthlyLostRevenue)).toBe(true)
    expect(Number.isInteger(result.annualLostRevenue)).toBe(true)
  })

  it("returns 0 impact for 0 visitors", () => {
    const result = estimateRevenueImpact(40, 0)
    expect(result.monthlyLostRevenue).toBe(0)
    expect(result.annualLostRevenue).toBe(0)
  })

  it("boundary: score 49 uses 30% bracket", () => {
    const result = estimateRevenueImpact(49)
    expect(result.improvementPotential).toBe("30%")
  })

  it("boundary: score 50 uses 15% bracket", () => {
    const result = estimateRevenueImpact(50)
    expect(result.improvementPotential).toBe("15%")
  })

  it("boundary: score 69 uses 15% bracket", () => {
    const result = estimateRevenueImpact(69)
    expect(result.improvementPotential).toBe("15%")
  })

  it("boundary: score 70 uses 5% bracket", () => {
    const result = estimateRevenueImpact(70)
    expect(result.improvementPotential).toBe("5%")
  })

  it("boundary: score 84 uses 5% bracket", () => {
    const result = estimateRevenueImpact(84)
    expect(result.improvementPotential).toBe("5%")
  })

  it("boundary: score 85 uses 1% bracket", () => {
    const result = estimateRevenueImpact(85)
    expect(result.improvementPotential).toBe("1%")
  })

  it("higher score = lower lost revenue", () => {
    const lowScore = estimateRevenueImpact(30)
    const midScore = estimateRevenueImpact(65)
    const highScore = estimateRevenueImpact(90)
    expect(lowScore.monthlyLostRevenue).toBeGreaterThan(
      midScore.monthlyLostRevenue
    )
    expect(midScore.monthlyLostRevenue).toBeGreaterThan(
      highScore.monthlyLostRevenue
    )
  })
})
