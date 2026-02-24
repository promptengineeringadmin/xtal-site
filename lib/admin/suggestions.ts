import Anthropic from "@anthropic-ai/sdk"

// ─── Candidate query pool ───────────────────────────────────
// Diverse natural-language queries spanning common shopping intents.
// Generic enough to potentially match many catalog types.

const CANDIDATES = [
  // Gifts & occasions
  "cozy gift for someone who is always cold",
  "last minute birthday gift for her",
  "housewarming gift ideas",
  "gifts for a coffee lover",
  "self care gift basket ideas",
  "gift for dad who has everything",
  "anniversary gift for my partner",
  "stocking stuffers for teens",
  // Situational / occasion
  "hosting a dinner party this weekend",
  "setting up a home cocktail bar",
  "outdoor movie night setup",
  "getting ready for a beach vacation",
  "preparing for a camping trip",
  "first apartment essentials",
  // Home & lifestyle
  "make my bathroom feel like a spa",
  "something cute for my desk at work",
  "cozy blanket for movie nights",
  "throw pillow to brighten up my couch",
  "organize my small kitchen",
  "upgrade my home office setup",
  // Fashion & accessories
  "dainty jewelry for everyday wear",
  "elegant necklace for prom",
  "trendy earrings for teens",
  "minimalist gold jewelry",
  "comfortable shoes for standing all day",
  "laptop bag for a woman",
  // Tech & electronics
  "wireless headphones for working out",
  "smart home starter kit",
  "budget gaming accessories",
  "best tablet for reading",
  // Seasonal
  "warm hat and gloves set",
  "summer beach essentials",
]

// ─── Types ──────────────────────────────────────────────────

export interface ScoredSuggestion {
  query: string
  score: number
  breakdown: {
    resultCount: number
    imageCoverage: number
    semanticRelevance: number
  }
}

interface SearchResult {
  id?: string
  title?: string
  image?: string | null
  price?: number | number[] | null
}

interface SearchResponse {
  results?: SearchResult[]
  total?: number
}

interface CandidateResult {
  query: string
  total: number
  titles: string[]
  resultCountScore: number
  imageCoverageScore: number
}

// ─── Claude client (lazy init) ──────────────────────────────

let anthropic: Anthropic | null = null
function getClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return anthropic
}

// ─── Test a single candidate query ──────────────────────────

async function testCandidate(
  query: string,
  collection: string,
  backendUrl: string
): Promise<CandidateResult | null> {
  try {
    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, collection, limit: 10 }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) return null
    const data: SearchResponse = await res.json()

    const results = data.results ?? []
    const total = data.total ?? results.length
    if (results.length === 0) return null

    // Result count score
    let resultCountScore: number
    if (total <= 3) resultCountScore = 40
    else if (total <= 9) resultCountScore = 80
    else resultCountScore = 100

    // Image coverage score
    const withImages = results.filter((r) => r.image).length
    const imageCoverageScore = Math.round((withImages / results.length) * 100)

    // Capture titles for Claude scoring
    const titles = results
      .map((r) => r.title)
      .filter(Boolean) as string[]

    return { query, total, titles, resultCountScore, imageCoverageScore }
  } catch {
    return null
  }
}

// ─── Claude semantic relevance scoring (batch) ──────────────

async function scoreSemanticBatch(
  candidates: { query: string; titles: string[] }[]
): Promise<Record<string, number>> {
  const client = getClient()
  const scores: Record<string, number> = {}

  const items = candidates
    .map(
      (c, i) =>
        `${i + 1}. Query: "${c.query}"\n   Results: ${c.titles.slice(0, 5).join(", ")}`
    )
    .join("\n\n")

  const prompt = `You are evaluating e-commerce search result quality. For each query below, rate how well the result titles match the shopper's intent on a scale of 0-100.

${items}

Return ONLY a JSON array of numbers (one score per query, in order). Example: [85, 42, 91]`

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    })

    const text =
      message.content[0].type === "text" ? message.content[0].text : "[]"
    const match = text.match(/\[[\d\s,]+\]/)
    if (match) {
      const parsed = JSON.parse(match[0]) as number[]
      candidates.forEach((c, i) => {
        scores[c.query] = parsed[i] ?? 0
      })
    }
  } catch (err) {
    console.error("Claude semantic scoring error:", err)
    candidates.forEach((c) => {
      scores[c.query] = 50
    })
  }

  return scores
}

// ─── Main generation function ───────────────────────────────

export async function generateSuggestions(
  collection: string
): Promise<ScoredSuggestion[]> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  if (!backendUrl) throw new Error("XTAL_BACKEND_URL not configured")

  // Phase 1: Test all candidates against the search API (batches of 10)
  const tested: CandidateResult[] = []

  for (let i = 0; i < CANDIDATES.length; i += 10) {
    const batch = CANDIDATES.slice(i, i + 10)
    const results = await Promise.all(
      batch.map((q) => testCandidate(q, collection, backendUrl))
    )
    for (const r of results) {
      if (r) tested.push(r)
    }
  }

  if (tested.length === 0) {
    return []
  }

  // Phase 2: Claude semantic scoring (batches of 5)
  const semanticScores: Record<string, number> = {}

  for (let i = 0; i < tested.length; i += 5) {
    const batch = tested.slice(i, i + 5).map((t) => ({
      query: t.query,
      titles: t.titles,
    }))
    const batchScores = await scoreSemanticBatch(batch)
    Object.assign(semanticScores, batchScores)
  }

  // Phase 3: Calculate weighted totals and rank
  const scored: ScoredSuggestion[] = tested.map((t) => {
    const semantic = semanticScores[t.query] ?? 50
    return {
      query: t.query,
      score: Math.round(
        t.resultCountScore * 0.3 +
        t.imageCoverageScore * 0.3 +
        semantic * 0.4
      ),
      breakdown: {
        resultCount: t.resultCountScore,
        imageCoverage: t.imageCoverageScore,
        semanticRelevance: semantic,
      },
    }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 5)
}
