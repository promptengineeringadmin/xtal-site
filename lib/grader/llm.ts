import Anthropic from "@anthropic-ai/sdk"
import { getPrompt, fillTemplate } from "./prompts"
import type {
  Platform,
  TestQuery,
  QueryResult,
  DimensionScore,
  Recommendation,
} from "./types"
import { DIMENSION_LABELS, DIMENSION_WEIGHTS, scoreToGrade } from "./scoring"

// ─── Anthropic client (lazy init) ───────────────────────────

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return client
}

const MODEL = "claude-opus-4-6"

// ─── Analyze Store ──────────────────────────────────────────

export interface AnalyzeResult {
  storeType: string
  vertical: string
  queries: TestQuery[]
  promptUsed: string
  rawResponse: string
}

export async function analyzeStore(opts: {
  storeUrl: string
  platform: Platform
  storeName: string
  productSamples: string[]
}): Promise<AnalyzeResult> {
  const template = await getPrompt("analyze")
  const prompt = fillTemplate(template, {
    storeUrl: opts.storeUrl,
    platform: opts.platform,
    storeName: opts.storeName,
    productSamples: opts.productSamples.map((p, i) => `${i + 1}. ${p}`).join("\n"),
  })

  const anthropic = getClient()
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  })

  const rawResponse =
    message.content[0].type === "text" ? message.content[0].text : ""

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonStr = rawResponse
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()

  const parsed = JSON.parse(jsonStr) as {
    storeType: string
    vertical: string
    queries: TestQuery[]
  }

  return {
    storeType: parsed.storeType,
    vertical: parsed.vertical,
    queries: parsed.queries,
    promptUsed: prompt,
    rawResponse,
  }
}

// ─── Evaluate Results ───────────────────────────────────────

export interface EvaluateResult {
  dimensions: DimensionScore[]
  overallScore: number
  summary: string
  recommendations: Recommendation[]
  promptUsed: string
  rawResponse: string
}

export async function evaluateResults(opts: {
  storeUrl: string
  storeName: string
  storeType: string
  vertical: string
  platform: Platform
  queryResults: QueryResult[]
}): Promise<EvaluateResult> {
  const template = await getPrompt("evaluate")

  // Format query results for the prompt
  const queryResultsStr = opts.queryResults
    .map(
      (qr, i) =>
        `Query ${i + 1} [${qr.category}]: "${qr.query}"
  Expected: ${qr.expectedBehavior}
  Results: ${qr.resultCount} found (${qr.responseTime}ms)
  Top results: ${qr.topResults.length > 0 ? qr.topResults.map((r) => r.title).join(", ") : "(none)"}${qr.error ? `\n  Error: ${qr.error}` : ""}`
    )
    .join("\n\n")

  const prompt = fillTemplate(template, {
    storeUrl: opts.storeUrl,
    storeName: opts.storeName,
    storeType: opts.storeType,
    vertical: opts.vertical,
    platform: opts.platform,
    queryResults: queryResultsStr,
  })

  const anthropic = getClient()
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  })

  const rawResponse =
    message.content[0].type === "text" ? message.content[0].text : ""

  const jsonStr = rawResponse
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()

  let parsed: {
    dimensions: Omit<DimensionScore, "label" | "grade" | "weight">[]
    overallScore: number
    summary: string
    recommendations: Recommendation[]
  }
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error(
      `Failed to parse evaluation response from Claude. The model may have returned truncated output. Response length: ${rawResponse.length} chars.`
    )
  }

  // Enrich dimensions with labels, grades, and weights
  const dimensions: DimensionScore[] = parsed.dimensions.map((d) => ({
    ...d,
    label: DIMENSION_LABELS[d.key] ?? d.key,
    grade: scoreToGrade(d.score),
    weight: DIMENSION_WEIGHTS[d.key] ?? 0,
  }))

  return {
    dimensions,
    overallScore: parsed.overallScore,
    summary: parsed.summary,
    recommendations: parsed.recommendations,
    promptUsed: prompt,
    rawResponse,
  }
}
