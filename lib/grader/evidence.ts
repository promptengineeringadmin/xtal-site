import type { GraderReport, QueryCategory } from "./types"

export interface EvidenceRow {
  query: string
  category: QueryCategory
  categoryLabel: string
  expectedBehavior: string
  resultCount: number
  topResults: string[]
  verdict: "pass" | "partial" | "fail"
}

const CATEGORY_LABELS: Record<QueryCategory, string> = {
  typo: "Typo Test",
  synonym: "Synonym",
  natural_language: "Intent / NLP",
  long_tail: "Long-tail",
  category: "Category",
  null_test: "Null Test",
}

// Map dimension keys to their most likely query categories (fallback when queriesTested is missing)
const DIMENSION_CATEGORY_FALLBACK: Record<string, QueryCategory> = {
  typo_tolerance: "typo",
  synonym_handling: "synonym",
  natural_language: "natural_language",
  long_tail: "long_tail",
  null_rate: "null_test",
  category_intelligence: "category",
  result_relevance: "category",
  response_speed: "category",
}

// Define category order for sorting
const CATEGORY_ORDER: QueryCategory[] = [
  "typo",
  "synonym",
  "natural_language",
  "long_tail",
  "category",
  "null_test",
]

export function buildEvidenceRows(report: GraderReport): EvidenceRow[] {
  // Create a Map from queriesTested keyed by lowercase text
  const queriesTestedMap = new Map<string, { category: QueryCategory; expectedBehavior: string }>()

  if (report.queriesTested) {
    for (const testQuery of report.queriesTested) {
      queriesTestedMap.set(testQuery.text.toLowerCase(), {
        category: testQuery.category,
        expectedBehavior: testQuery.expectedBehavior,
      })
    }
  }

  // Map to deduplicate by lowercase query text
  const evidenceMap = new Map<string, EvidenceRow>()

  // Iterate all dimensions and their test queries
  for (const dimension of report.dimensions) {
    if (!dimension.testQueries) continue

    for (const testQuery of dimension.testQueries) {
      const queryLower = testQuery.query.toLowerCase()

      // Skip if we've already processed this query
      if (evidenceMap.has(queryLower)) continue

      // Look up category and expectedBehavior from queriesTested
      const testedInfo = queriesTestedMap.get(queryLower)

      let category: QueryCategory
      let expectedBehavior: string

      if (testedInfo) {
        category = testedInfo.category
        expectedBehavior = testedInfo.expectedBehavior
      } else {
        // Fallback to dimension-based category mapping
        category = DIMENSION_CATEGORY_FALLBACK[dimension.key] || "category"
        expectedBehavior = "Expected relevant results"
      }

      evidenceMap.set(queryLower, {
        query: testQuery.query,
        category,
        categoryLabel: CATEGORY_LABELS[category],
        expectedBehavior,
        resultCount: testQuery.resultCount,
        topResults: testQuery.topResults || [],
        verdict: testQuery.verdict,
      })
    }
  }

  // Convert to array and sort by category order
  const evidenceRows = Array.from(evidenceMap.values())

  evidenceRows.sort((a, b) => {
    const orderA = CATEGORY_ORDER.indexOf(a.category)
    const orderB = CATEGORY_ORDER.indexOf(b.category)
    return orderA - orderB
  })

  return evidenceRows
}
