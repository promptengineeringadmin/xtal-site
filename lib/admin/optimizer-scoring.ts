// Server-only — Claude evaluation for optimizer scoring
// Follows lazy-init pattern from suggestions.ts:82-87

import Anthropic from "@anthropic-ai/sdk"
import type {
  OptimizerConfig,
  QueryEvaluation,
  ProductResult,
} from "@/lib/xtal-types"
import type { ScoringAggregation } from "@/lib/admin/optimizer"

// ─── Claude client (lazy init) ──────────────────────────────

let anthropic: Anthropic | null = null
function getClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return anthropic
}

const MODEL = "claude-sonnet-4-6"

// ─── Per-query evaluation ───────────────────────────────────

export async function evaluateQueryConfigs(input: {
  persona: { name: string; context: string }
  query: string
  queryType: string
  configs: { index: number; label: string; results: ProductResult[] }[]
  storeType: string
}): Promise<QueryEvaluation> {
  // Check if all configs return identical results — skip Claude call
  const fingerprints = input.configs.map((c) =>
    c.results.map((r) => r.title).join("|"),
  )
  if (new Set(fingerprints).size <= 1) {
    return {
      query: input.query,
      query_type: input.queryType,
      scores: input.configs.map((c) => ({ config: c.index, score: 5, rationale: "" })),
      notable: "All configurations returned identical results for this query.",
      skipped: true,
    }
  }

  const configDescriptions = input.configs
    .map((c) => {
      const header = `--- Config ${c.index} (${c.label}) ---`
      const count = `[${c.results.length} total results]`
      const items =
        c.results.length > 0
          ? c.results
              .slice(0, 5)
              .map(
                (r, i) =>
                  `${i + 1}. "${r.title}" | ${r.product_type} | $${r.price.toFixed(2)} | ${r.vendor}`,
              )
              .join("\n")
          : "(no results)"
      return `${header}\n${count}\n${items}`
    })
    .join("\n\n")

  const prompt = `You are ${input.persona.name}. ${input.persona.context}
You are shopping at a ${input.storeType}.

You searched for: "${input.query}" (query type: ${input.queryType})

Here are the top results from ${input.configs.length} different search configurations:

${configDescriptions}

Score each configuration 1-10 based on:
- Would you click the top 2-3 results?
- Are results the RIGHT TYPE of product?
- Are prices reasonable for the query intent?
- Would you find what you need, or leave the site?

Return ONLY a JSON object:
{
  "scores": [
    { "config": <config_index>, "score": <1-10>, "rationale": "<brief reason>" }
  ],
  "best_config": <config_index>,
  "worst_config": <config_index>,
  "notable": "<one sentence observation>"
}`

  const client = getClient()
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : "{}"
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const parsed = JSON.parse(jsonStr) as {
      scores: { config: number; score: number; rationale: string }[]
      notable?: string
    }

    return {
      query: input.query,
      query_type: input.queryType,
      scores: parsed.scores.map((s) => ({
        config: s.config,
        score: Math.max(1, Math.min(10, Math.round(s.score))),
        rationale: s.rationale || "",
      })),
      notable: parsed.notable || "",
      skipped: false,
    }
  } catch (err) {
    console.error("Claude evaluation error for query:", input.query, err)
    return {
      query: input.query,
      query_type: input.queryType,
      scores: input.configs.map((c) => ({
        config: c.index,
        score: 5,
        rationale: "Evaluation failed — equal scores assigned.",
      })),
      notable: "Evaluation failed for this query.",
      skipped: false,
    }
  }
}

// ─── Score aggregation ──────────────────────────────────────

const QUERY_TYPE_WEIGHTS: Record<string, number> = {
  keyword: 1.2,
  natural_language: 1.0,
  cluster: 1.0,
  problem_solving: 0.9,
  vibes: 0.8,
}

export function aggregateScores(
  evaluations: QueryEvaluation[],
  configCount: number,
): ScoringAggregation {
  const configTotals: Record<number, number> = {}
  const configWeightTotals: Record<number, number> = {}
  const lastPlaceCounts: Record<number, number> = {}
  const worstScores: Record<number, number> = {}

  for (let i = 0; i < configCount; i++) {
    configTotals[i] = 0
    configWeightTotals[i] = 0
    lastPlaceCounts[i] = 0
    worstScores[i] = 10
  }

  for (const ev of evaluations) {
    const weight = QUERY_TYPE_WEIGHTS[ev.query_type] || 1.0
    const minScore = Math.min(...ev.scores.map((s) => s.score))

    for (const s of ev.scores) {
      configTotals[s.config] = (configTotals[s.config] || 0) + s.score * weight
      configWeightTotals[s.config] = (configWeightTotals[s.config] || 0) + weight
      if (s.score === minScore) {
        lastPlaceCounts[s.config] = (lastPlaceCounts[s.config] || 0) + 1
      }
      if (s.score < (worstScores[s.config] ?? 10)) {
        worstScores[s.config] = s.score
      }
    }
  }

  const config_scores: Record<number, number> = {}
  for (let i = 0; i < configCount; i++) {
    config_scores[i] =
      configWeightTotals[i] > 0 ? configTotals[i] / configWeightTotals[i] : 0
  }

  // Sort: highest score, then fewer last-place finishes, then higher worst-case
  const ranked = Object.entries(config_scores)
    .map(([idx, score]) => ({ index: Number(idx), score }))
    .sort((a, b) => {
      if (Math.abs(a.score - b.score) > 0.01) return b.score - a.score
      const lpDiff = (lastPlaceCounts[a.index] || 0) - (lastPlaceCounts[b.index] || 0)
      if (lpDiff !== 0) return lpDiff
      return (worstScores[b.index] || 0) - (worstScores[a.index] || 0)
    })

  return {
    config_scores,
    per_query: evaluations,
    winner_index: ranked[0].index,
    runner_up_index: ranked.length > 1 ? ranked[1].index : ranked[0].index,
  }
}

// ─── Final reasoning generation ─────────────────────────────

export async function generateReasoning(input: {
  aggregation: ScoringAggregation
  configs: OptimizerConfig[]
  storeType: string
  persona: { name: string; context: string }
  queriesTestedCount: number
}): Promise<string> {
  const client = getClient()

  const winner = input.configs[input.aggregation.winner_index]
  const baseline = input.configs[0]

  const scoresSummary = input.configs
    .map(
      (c) =>
        `  ${c.label}: ${input.aggregation.config_scores[c.index]?.toFixed(2) || "N/A"}/10`,
    )
    .join("\n")

  // Find queries where winner and baseline diverged most
  const divergent = input.aggregation.per_query
    .filter((eq) => !eq.skipped)
    .map((eq) => {
      const winnerScore = eq.scores.find((s) => s.config === winner.index)?.score || 0
      const baselineScore = eq.scores.find((s) => s.config === 0)?.score || 0
      return { query: eq.query, diff: winnerScore - baselineScore, notable: eq.notable }
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3)

  const divergentStr =
    divergent.length > 0
      ? `\nNotable differences:\n${divergent.map((d) => `  "${d.query}": winner scored ${d.diff > 0 ? "+" : ""}${d.diff} vs baseline. ${d.notable}`).join("\n")}`
      : ""

  const prompt = `You are summarizing search optimization results for a ${input.storeType}.

Persona: ${input.persona.name} — ${input.persona.context}
Queries tested: ${input.queriesTestedCount}
Configs tested: ${input.configs.length}

Average scores (1-10):
${scoresSummary}

Winner: "${winner.label}" (bm25=${winner.bm25_weight}, keyword_rerank=${winner.keyword_rerank_strength}, merch_rerank=${winner.merch_rerank_strength}, query_enhancement=${winner.query_enhancement_enabled})
Baseline: "${baseline.label}" (bm25=${baseline.bm25_weight}, keyword_rerank=${baseline.keyword_rerank_strength}, merch_rerank=${baseline.merch_rerank_strength}, query_enhancement=${baseline.query_enhancement_enabled})
${divergentStr}

Write 2-3 plain-language sentences explaining why this config helps shoppers. No jargon. If the winner IS the baseline, say the current settings are well-tuned.`

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    })

    return message.content[0].type === "text"
      ? message.content[0].text.trim()
      : "Optimization complete."
  } catch (err) {
    console.error("Reasoning generation error:", err)
    return "Optimization complete. Review the per-query scores above for details."
  }
}
