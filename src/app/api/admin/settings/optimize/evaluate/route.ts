import { NextResponse } from "next/server"
import {
  evaluateQueryConfigs,
  aggregateScores,
  generateReasoning,
} from "@/lib/admin/optimizer-scoring"
import type { OptimizerConfig, TestQuery } from "@/lib/xtal-types"
import type { SearchTaskResult } from "@/lib/admin/optimizer"

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { persona, queries, configs, searchResults, storeType } = body as {
      persona: { name: string; context: string }
      queries: TestQuery[]
      configs: OptimizerConfig[]
      searchResults: SearchTaskResult[]
      storeType: string
    }

    // Group searchResults by query
    const resultsByQuery: Record<string, SearchTaskResult[]> = {}
    for (const r of searchResults) {
      if (!resultsByQuery[r.query]) resultsByQuery[r.query] = []
      resultsByQuery[r.query].push(r)
    }

    // Evaluate each query sequentially (avoid rate limits)
    const evaluations = []

    for (const q of queries) {
      const queryResults = resultsByQuery[q.query] || []
      const configsWithResults = configs.map((c) => ({
        index: c.index,
        label: c.label,
        results: queryResults
          .filter((r) => r.configIndex === c.index)
          .flatMap((r) => r.results),
      }))

      const evaluation = await evaluateQueryConfigs({
        persona,
        query: q.query,
        queryType: q.type,
        configs: configsWithResults,
        storeType,
      })

      evaluations.push(evaluation)
    }

    // Aggregate scores
    const aggregation = aggregateScores(evaluations, configs.length)

    // Generate reasoning
    const reasoning = await generateReasoning({
      aggregation,
      configs,
      storeType,
      persona,
      queriesTestedCount: queries.length,
    })

    return NextResponse.json({ aggregation, reasoning })
  } catch (error) {
    console.error("Evaluation error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Evaluation failed",
      },
      { status: 500 },
    )
  }
}
