// Frontend-orchestrated optimizer — client-importable (no server-only deps)

import type {
  OptimizerConfig,
  TestQuery,
  QueryEvaluation,
  ProductResult,
  SampleComparison,
  SearchConfig,
  OptimizationResult,
} from "@/lib/xtal-types"

// ─── Internal types ─────────────────────────────────────────

export interface SearchTask {
  configIndex: number
  queryIndex: number
  config: OptimizerConfig
  query: string
}

export interface SearchTaskResult {
  configIndex: number
  queryIndex: number
  query: string
  configLabel: string
  results: ProductResult[]
  totalResults: number
}

export interface ScoringAggregation {
  config_scores: Record<number, number>
  per_query: QueryEvaluation[]
  winner_index: number
  runner_up_index: number
}

// ─── Config generation ──────────────────────────────────────

export interface CurrentConfig {
  query_enhancement_enabled: boolean
  merch_rerank_strength: number
  bm25_weight: number
  keyword_rerank_strength: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, value)) * 100) / 100
}

export function generateCandidateConfigs(current: CurrentConfig): OptimizerConfig[] {
  const configs: OptimizerConfig[] = []
  const seen = new Set<string>()

  function fingerprint(c: {
    query_enhancement_enabled: boolean
    bm25_weight: number
    keyword_rerank_strength: number
    merch_rerank_strength: number
  }): string {
    return `${c.query_enhancement_enabled}|${c.bm25_weight}|${c.keyword_rerank_strength}|${c.merch_rerank_strength}`
  }

  function add(label: string, overrides: Partial<CurrentConfig>) {
    const candidate = { ...current, ...overrides }
    candidate.bm25_weight = clamp(candidate.bm25_weight, 0.5, 5.0)
    candidate.keyword_rerank_strength = clamp(candidate.keyword_rerank_strength, 0, 1.0)
    candidate.merch_rerank_strength = clamp(candidate.merch_rerank_strength, 0, 0.5)

    const fp = fingerprint(candidate)
    if (seen.has(fp)) return
    seen.add(fp)

    configs.push({ index: configs.length, label, ...candidate })
  }

  // Baseline (current config)
  add("baseline", {})

  // Single-axis perturbations
  add("bm25+1.0", { bm25_weight: current.bm25_weight + 1.0 })
  add("bm25-1.0", { bm25_weight: current.bm25_weight - 1.0 })
  add("keyword+0.3", { keyword_rerank_strength: current.keyword_rerank_strength + 0.3 })
  add("keyword-0.3", { keyword_rerank_strength: current.keyword_rerank_strength - 0.3 })
  add("qe_toggled", { query_enhancement_enabled: !current.query_enhancement_enabled })

  // Diagonals
  add("strong_exact", {
    bm25_weight: clamp(current.bm25_weight + 1.5, 0.5, 5.0),
    keyword_rerank_strength: clamp(current.keyword_rerank_strength + 0.3, 0, 1.0),
  })
  add("pure_relevance", {
    bm25_weight: clamp(current.bm25_weight - 1.0, 0.5, 5.0),
    merch_rerank_strength: clamp(current.merch_rerank_strength - 0.15, 0, 0.5),
  })

  return configs
}

// ─── Search task construction ───────────────────────────────

export function buildSearchTasks(
  configs: OptimizerConfig[],
  queries: TestQuery[],
): SearchTask[] {
  const tasks: SearchTask[] = []
  for (const config of configs) {
    for (let qi = 0; qi < queries.length; qi++) {
      tasks.push({
        configIndex: config.index,
        queryIndex: qi,
        config,
        query: queries[qi].query,
      })
    }
  }
  return tasks
}

// ─── Search execution with bounded concurrency ──────────────

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
  signal: AbortSignal,
): Promise<void> {
  let index = 0
  async function worker() {
    while (index < items.length && !signal.aborted) {
      const i = index++
      if (i >= items.length) break
      await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()))
}

export async function executeSearches(
  tasks: SearchTask[],
  collection: string,
  concurrency: number,
  onProgress: (completed: number, total: number) => void,
  signal: AbortSignal,
): Promise<SearchTaskResult[]> {
  const results: SearchTaskResult[] = []
  let completed = 0

  await runWithConcurrency(
    tasks,
    concurrency,
    async (task) => {
      if (signal.aborted) return

      try {
        const res = await fetch("/api/xtal/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: task.query,
            collection,
            limit: 10,
            bm25_weight: task.config.bm25_weight,
            keyword_rerank_strength: task.config.keyword_rerank_strength,
            merch_rerank_strength: task.config.merch_rerank_strength,
            query_enhancement_enabled: task.config.query_enhancement_enabled,
          }),
          signal,
        })

        if (!res.ok) {
          results.push({
            configIndex: task.configIndex,
            queryIndex: task.queryIndex,
            query: task.query,
            configLabel: task.config.label,
            results: [],
            totalResults: 0,
          })
        } else {
          const data = await res.json()
          const searchResults: ProductResult[] = (data.results || [])
            .slice(0, 10)
            .map((r: Record<string, unknown>) => ({
              title: (r.title as string) || "",
              product_type: (r.product_type as string) || "",
              price: (r.price as number) || 0,
              vendor: (r.vendor as string) || "",
            }))

          results.push({
            configIndex: task.configIndex,
            queryIndex: task.queryIndex,
            query: task.query,
            configLabel: task.config.label,
            results: searchResults,
            totalResults: data.total || searchResults.length,
          })
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        results.push({
          configIndex: task.configIndex,
          queryIndex: task.queryIndex,
          query: task.query,
          configLabel: task.config.label,
          results: [],
          totalResults: 0,
        })
      }

      completed++
      onProgress(completed, tasks.length)
    },
    signal,
  )

  return results
}

// ─── Identical results check ────────────────────────────────

export function resultsAreIdentical(
  searchResults: SearchTaskResult[],
  configCount: number,
): boolean {
  if (configCount < 2) return true

  // Group by query, then check if all configs produced same titles
  const byQuery: Record<number, Map<number, string>> = {}
  for (const r of searchResults) {
    if (!byQuery[r.queryIndex]) byQuery[r.queryIndex] = new Map()
    byQuery[r.queryIndex].set(r.configIndex, r.results.map((p) => p.title).join("|"))
  }

  for (const queryMap of Object.values(byQuery)) {
    const fingerprints = new Set(queryMap.values())
    if (fingerprints.size > 1) return false
  }
  return true
}

// ─── Build final OptimizationResult ─────────────────────────

export function buildOptimizationResult(
  configs: OptimizerConfig[],
  queries: TestQuery[],
  searchResults: SearchTaskResult[],
  scoring: ScoringAggregation,
  persona: { name: string; context: string },
  reasoning: string,
  startTime: number,
): OptimizationResult {
  const baselineConfig = configs[0]
  const winnerConfig = configs[scoring.winner_index]

  function toSearchConfig(c: OptimizerConfig): SearchConfig {
    return {
      query_enhancement_enabled: c.query_enhancement_enabled,
      merch_rerank_strength: c.merch_rerank_strength,
      bm25_weight: c.bm25_weight,
      keyword_rerank_strength: c.keyword_rerank_strength,
      hypothesis: c.label,
    }
  }

  // Pick sample comparisons from queries where winner and baseline differ most
  const sample_comparisons: SampleComparison[] = scoring.per_query
    .filter((eq) => !eq.skipped)
    .sort((a, b) => {
      const winnerScoreA = a.scores.find((s) => s.config === scoring.winner_index)?.score || 0
      const baselineScoreA = a.scores.find((s) => s.config === 0)?.score || 0
      const winnerScoreB = b.scores.find((s) => s.config === scoring.winner_index)?.score || 0
      const baselineScoreB = b.scores.find((s) => s.config === 0)?.score || 0
      return Math.abs(winnerScoreB - baselineScoreB) - Math.abs(winnerScoreA - baselineScoreA)
    })
    .slice(0, 5)
    .map((eq) => {
      const baselineResults = searchResults.filter(
        (r) => r.configIndex === 0 && r.query === eq.query,
      )[0]?.results || []
      const winnerResults = searchResults.filter(
        (r) => r.configIndex === scoring.winner_index && r.query === eq.query,
      )[0]?.results || []

      return {
        query: eq.query,
        current_top_5: baselineResults.slice(0, 5).map((r) => r.title),
        recommended_top_5: winnerResults.slice(0, 5).map((r) => r.title),
        current_results: baselineResults,
        recommended_results: winnerResults,
      }
    })

  // Build per_query_rankings
  const per_query_rankings: Record<string, number[]> = {}
  for (const eq of scoring.per_query) {
    per_query_rankings[eq.query] = configs.map(
      (c) => eq.scores.find((s) => s.config === c.index)?.score || 0,
    )
  }

  return {
    current_config: toSearchConfig(baselineConfig),
    recommended_config: toSearchConfig(winnerConfig),
    all_configs: configs.map(toSearchConfig),
    sample_comparisons,
    reasoning,
    weirdest_results: null,
    per_query_rankings,
    test_queries: queries.map((q) => q.query),
    queries_tested: queries.length,
    configs_tested: configs.length,
    optimization_time: (Date.now() - startTime) / 1000,
    persona,
    query_evaluations: scoring.per_query,
  }
}
