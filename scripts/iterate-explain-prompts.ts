#!/usr/bin/env npx tsx
/**
 * Explain prompt iteration & structured evaluation.
 *
 * 1. Fetches real products from our Qdrant bestbuy collection via XTAL search API
 * 2. Generates 50 system prompt variants via Sonnet
 * 3. Tests each variant against diverse query/product pairs
 * 4. Scores each explanation with structured rubric (JSON)
 * 5. Ranks prompts, extracts winning KV traits
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
 *   npx tsx scripts/iterate-explain-prompts.ts
 */

import Anthropic from "@anthropic-ai/sdk"

// ─── Config ────────────────────────────────────────────────────────

const SEARCH_BASE = "https://xtalsearch.com"
const COLLECTION = "bestbuy"
const MODEL = "claude-sonnet-4-6"
const NUM_VARIANTS = 50
const TOP_N_PRODUCTS = 2 // per query for initial screen

// Diverse queries that exercise different match types
const TEST_QUERIES = [
  "gift for a teenage gamer",        // intent-based, indirect matches
  "laptop for college",              // need-based, direct matches
  "noise cancelling headphones",     // feature-based, direct matches
  "home office setup",               // broad intent, mixed matches
  "budget 4K TV under $500",         // price+feature constraint
]

// ─── Types ─────────────────────────────────────────────────────────

interface Product {
  id: string
  title: string
  vendor: string
  product_type: string
  description?: string
  enhanced_description?: string
  body_html?: string
  tags?: string[]
  price: number | number[]
}

interface ScoredExplanation {
  prompt_id: number
  query: string
  product_title: string
  product_vendor: string
  product_price: string
  explanation: string
  scores: {
    intent_bridge: number
    natural_voice: number
    honesty_calibration: number
    query_independence: number
    spec_avoidance: number
    emotional_hook: number
    conciseness: number
    customer_aha: number
  }
  total: number
  trait_notes: string
}

interface PromptResult {
  prompt_id: number
  system_prompt: string
  avg_total: number
  avg_scores: Record<string, number>
  explanations: ScoredExplanation[]
}

// ─── Adorama-style user prompt template ────────────────────────────

function buildUserPrompt(query: string, product: Product, score: number): string {
  const price = Array.isArray(product.price) ? product.price[0] : product.price
  const matchQuality = score >= 0.85 ? "Strong Match" : score >= 0.6 ? "Decent Match" : "Loose Match"
  const desc = product.enhanced_description || product.body_html || product.description || ""
  // Strip HTML tags
  const cleanDesc = desc.replace(/<[^>]+>/g, "").slice(0, 400)

  return `Help this customer understand why this product is worth their attention:

Product: ${product.title}
Brand: ${product.vendor || "Unknown"}
Customer's Search: "${query}"
Price: $${price}
IMPORTANT: This product has been identified as a "${matchQuality}" for their search (relevance: ${(score * 100).toFixed(0)}%).
Background Info (DO NOT quote directly): ${cleanDesc || "No description available."}

Explain in 2-3 concise sentences why this product connects to what they're looking for. Focus on the connection between their search intent and what makes this product relevant for their needs.`
}

// ─── Scoring rubric prompt ─────────────────────────────────────────

const SCORING_SYSTEM = `You are an expert evaluator of retail product explanations. You will score an explanation that was generated to help a customer understand why a product appeared in their search results.

Score each dimension 1-5 (1=terrible, 5=excellent). Be STRICT — a 3 is average, 5 is exceptional.

Return ONLY valid JSON matching this schema:
{
  "intent_bridge": <1-5: How well does it connect the SEARCH INTENT to the PRODUCT? Does it explain the "why" rather than just describing the product?>,
  "natural_voice": <1-5: Does it sound like a real person talking face-to-face? Not robotic, not marketing copy, not a search engine>,
  "honesty_calibration": <1-5: Is confidence calibrated to actual fit? Strong match = enthusiastic. Weak match = honest framing. NOT overselling>,
  "query_independence": <1-5: Does it avoid echoing/rephrasing the search query? Does it avoid saying "your search for X"?>,
  "spec_avoidance": <1-5: Does it avoid listing specs/features? Does it allude to value rather than reciting a feature sheet?>,
  "emotional_hook": <1-5: Does it create a moment of connection — an "oh yeah" feeling? Does it paint a picture or scenario?>,
  "conciseness": <1-5: Right length — enough substance but not bloated? 2-3 sentences, no filler>,
  "customer_aha": <1-5: Would a customer reading this think "oh, THAT'S why this showed up — that actually makes sense"?>,
  "trait_notes": "<brief note on the 1-2 strongest and weakest qualities>"
}`

function buildScoringUserPrompt(query: string, productTitle: string, explanation: string): string {
  return `SEARCH QUERY: "${query}"
PRODUCT: "${productTitle}"
EXPLANATION TO SCORE: "${explanation}"

Score this explanation. Return ONLY the JSON object.`
}

// ─── API calls ─────────────────────────────────────────────────────

async function searchProducts(query: string, limit: number): Promise<{ products: Product[], scores: Record<string, number> }> {
  const res = await fetch(`${SEARCH_BASE}/api/xtal/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, collection: COLLECTION, limit }),
  })
  if (!res.ok) throw new Error(`Search failed (${res.status}): ${await res.text()}`)
  const data = await res.json()
  return {
    products: (data.results || []).slice(0, limit),
    scores: data.relevance_scores || {},
  }
}

async function callSonnet(client: Anthropic, system: string, user: string, maxTokens = 300): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  })
  const block = response.content[0]
  return block.type === "text" ? block.text : "(no text)"
}

// ─── Generate prompt variants ──────────────────────────────────────

async function generatePromptVariants(client: Anthropic): Promise<string[]> {
  console.log("Generating 50 system prompt variants via Sonnet...")

  const generatorPrompt = `You are designing system prompts for a retail product explanation feature. When a customer searches and a product appears, this LLM explains WHY that product is relevant.

Here is the REFERENCE prompt that produced great results on an Adorama electronics demo:

"""
You are a knowledgeable and helpful retail salesperson, guiding customers to their ideal product.

Your goal is to explain WHY this specific product is an excellent choice for their needs, based on their search query. Speak directly to the customer in a conversational, professional tone.

CRITICAL REQUIREMENTS:
- Write as if you're speaking face-to-face with a customer in the store
- Be genuinely helpful about finding the right product
- Focus on how this product solves their specific needs or goals
- Use "you" and "your" to speak directly to them
- Keep it conversational and natural (2-3 concise sentences)
- If it's a strong match, emphasize why it's such a precise fit
- If it's a loose match, be honest — frame it as "worth considering if..."
- If there's a sale price, mention the great value/savings naturally
- DO NOT directly repeat or rephrase the user's search query
- DO NOT list features from the description. Allude to their value
- DO NOT suggest other products or actions
- Use the background info only as context — never quote it directly
"""

Generate exactly 50 DIFFERENT system prompt variants. Each should:
1. Follow the same Adorama structural pattern (persona → goal → requirements)
2. Vary the ANGLE: salesperson, product expert, shopping buddy, gear nerd, lifestyle advisor, etc.
3. Vary the EMPHASIS: some focus on emotional connection, some on practical fit, some on value, some on use-case scenarios
4. Vary the VOICE: some warmer, some more direct, some more playful, some more authoritative
5. All must require 2-3 sentences, direct address ("you"/"your"), and honesty about fit quality
6. All must ban: query echoing, spec listing, product suggestions, quoting descriptions
7. Keep each prompt 80-150 words (concise but complete)

Format: Output each prompt separated by "---PROMPT---" on its own line. No numbering, no commentary, just the raw prompts.`

  const result = await callSonnet(client, "You are a prompt engineering expert.", generatorPrompt, 16000)
  const variants = result.split("---PROMPT---").map(p => p.trim()).filter(p => p.length > 50)
  console.log(`  Generated ${variants.length} variants`)
  return variants
}

// ─── Score an explanation ──────────────────────────────────────────

async function scoreExplanation(
  client: Anthropic,
  query: string,
  productTitle: string,
  explanation: string
): Promise<{ scores: ScoredExplanation["scores"], trait_notes: string }> {
  const raw = await callSonnet(client, SCORING_SYSTEM, buildScoringUserPrompt(query, productTitle, explanation), 400)

  // Extract JSON from response
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error("  Failed to parse scoring JSON:", raw.slice(0, 200))
    return {
      scores: { intent_bridge: 1, natural_voice: 1, honesty_calibration: 1, query_independence: 1, spec_avoidance: 1, emotional_hook: 1, conciseness: 1, customer_aha: 1 },
      trait_notes: "PARSE_FAILURE",
    }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    const { trait_notes, ...scores } = parsed
    return { scores, trait_notes: trait_notes || "" }
  } catch {
    console.error("  JSON parse error:", jsonMatch[0].slice(0, 200))
    return {
      scores: { intent_bridge: 1, natural_voice: 1, honesty_calibration: 1, query_independence: 1, spec_avoidance: 1, emotional_hook: 1, conciseness: 1, customer_aha: 1 },
      trait_notes: "PARSE_FAILURE",
    }
  }
}

// ─── Rate limiter ──────────────────────────────────────────────────

function createRateLimiter(maxConcurrent: number) {
  let active = 0
  const queue: (() => void)[] = []

  return async function <T>(fn: () => Promise<T>): Promise<T> {
    while (active >= maxConcurrent) {
      await new Promise<void>(resolve => queue.push(resolve))
    }
    active++
    try {
      return await fn()
    } finally {
      active--
      if (queue.length > 0) queue.shift()!()
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY required")
    process.exit(1)
  }

  const client = new Anthropic({ apiKey: apiKey.trim() })
  const limiter = createRateLimiter(5) // 5 concurrent API calls

  // Phase 1: Fetch test products
  console.log("\n═══════════════════════════════════════════════════════════════")
  console.log("  Phase 1: Fetching test products from bestbuy Qdrant collection")
  console.log("═══════════════════════════════════════════════════════════════\n")

  const testCases: { query: string; product: Product; score: number }[] = []

  for (const query of TEST_QUERIES) {
    try {
      const { products, scores } = await searchProducts(query, TOP_N_PRODUCTS)
      for (const product of products) {
        const score = scores[product.id] ?? 0.5
        testCases.push({ query, product, score })
        const price = Array.isArray(product.price) ? product.price[0] : product.price
        console.log(`  "${query}" → ${product.title} ($${price}, score: ${(score * 100).toFixed(0)}%)`)
      }
    } catch (err) {
      console.error(`  Search failed for "${query}": ${err}`)
    }
  }

  console.log(`\n  Total test cases: ${testCases.length}\n`)

  // Phase 2: Generate prompt variants
  console.log("═══════════════════════════════════════════════════════════════")
  console.log("  Phase 2: Generating 50 prompt variants")
  console.log("═══════════════════════════════════════════════════════════════\n")

  const variants = await generatePromptVariants(client)
  if (variants.length < 10) {
    console.error("Too few variants generated. Aborting.")
    process.exit(1)
  }

  // Phase 3: Test each variant against all test cases
  console.log("\n═══════════════════════════════════════════════════════════════")
  console.log(`  Phase 3: Testing ${variants.length} prompts × ${testCases.length} cases`)
  console.log(`  (${variants.length * testCases.length} explanation calls + scoring)`)
  console.log("═══════════════════════════════════════════════════════════════\n")

  const allResults: PromptResult[] = []

  for (let i = 0; i < variants.length; i++) {
    const systemPrompt = variants[i]
    const explanations: ScoredExplanation[] = []

    console.log(`  Prompt ${i + 1}/${variants.length}...`)

    // Generate and score explanations in parallel (rate-limited)
    const tasks = testCases.map(({ query, product, score }) =>
      limiter(async () => {
        // Generate explanation
        const userPrompt = buildUserPrompt(query, product, score)
        const explanation = await callSonnet(client, systemPrompt, userPrompt, 200)

        // Score it
        const { scores, trait_notes } = await scoreExplanation(client, query, product.title, explanation)
        const total = Object.values(scores).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)

        return {
          prompt_id: i,
          query,
          product_title: product.title,
          product_vendor: product.vendor || "Unknown",
          product_price: `$${Array.isArray(product.price) ? product.price[0] : product.price}`,
          explanation,
          scores,
          total,
          trait_notes,
        } satisfies ScoredExplanation
      })
    )

    const results = await Promise.all(tasks)
    explanations.push(...results)

    const avgTotal = explanations.reduce((s, e) => s + e.total, 0) / explanations.length

    // Compute per-dimension averages
    const avgScores: Record<string, number> = {}
    const dims = Object.keys(explanations[0].scores)
    for (const dim of dims) {
      avgScores[dim] = explanations.reduce((s, e) => s + (e.scores as any)[dim], 0) / explanations.length
    }

    allResults.push({
      prompt_id: i,
      system_prompt: systemPrompt,
      avg_total: avgTotal,
      avg_scores: avgScores,
      explanations,
    })

    console.log(`    avg score: ${avgTotal.toFixed(1)}/40 | best dim: ${Object.entries(avgScores).sort((a, b) => b[1] - a[1])[0][0]} (${Object.entries(avgScores).sort((a, b) => b[1] - a[1])[0][1].toFixed(1)})`)
  }

  // Phase 4: Rank and output
  console.log("\n═══════════════════════════════════════════════════════════════")
  console.log("  Phase 4: Results — Top 10 Prompts")
  console.log("═══════════════════════════════════════════════════════════════\n")

  allResults.sort((a, b) => b.avg_total - a.avg_total)

  const top10 = allResults.slice(0, 10)

  for (const result of top10) {
    console.log(`\n  ── Prompt #${result.prompt_id + 1} ── avg: ${result.avg_total.toFixed(1)}/40 ──`)
    console.log(`  Dimension scores:`)
    for (const [dim, score] of Object.entries(result.avg_scores)) {
      const bar = "█".repeat(Math.round(score)) + "░".repeat(5 - Math.round(score))
      console.log(`    ${dim.padEnd(22)} ${bar} ${score.toFixed(2)}`)
    }
    console.log(`\n  System prompt (first 200 chars):`)
    console.log(`    ${result.system_prompt.slice(0, 200).replace(/\n/g, "\n    ")}...`)
    console.log(`\n  Sample explanations:`)
    for (const ex of result.explanations.slice(0, 3)) {
      console.log(`    "${ex.query}" → ${ex.product_title}`)
      console.log(`      ${ex.explanation}`)
      console.log(`      [score: ${ex.total}/40] ${ex.trait_notes}`)
      console.log()
    }
  }

  // Phase 5: Extract winning trait KV pairs
  console.log("\n═══════════════════════════════════════════════════════════════")
  console.log("  Phase 5: Winning Trait Analysis")
  console.log("═══════════════════════════════════════════════════════════════\n")

  // Compare top 5 vs bottom 5 dimension averages
  const top5 = allResults.slice(0, 5)
  const bottom5 = allResults.slice(-5)

  const dims = Object.keys(top5[0].avg_scores)
  console.log("  Dimension         | Top 5 avg | Bottom 5 avg | Delta")
  console.log("  ──────────────────|───────────|──────────────|──────")
  for (const dim of dims) {
    const topAvg = top5.reduce((s, r) => s + r.avg_scores[dim], 0) / 5
    const botAvg = bottom5.reduce((s, r) => s + r.avg_scores[dim], 0) / 5
    const delta = topAvg - botAvg
    console.log(`  ${dim.padEnd(19)} | ${topAvg.toFixed(2).padStart(9)} | ${botAvg.toFixed(2).padStart(12)} | ${delta > 0 ? "+" : ""}${delta.toFixed(2)}`)
  }

  // Write full results to JSON for analysis
  const outputPath = "scripts/search-optimization/explain-iteration-results.json"
  const output = {
    timestamp: new Date().toISOString(),
    config: { model: MODEL, collection: COLLECTION, test_queries: TEST_QUERIES, num_variants: variants.length },
    rankings: allResults.map(r => ({
      rank: allResults.indexOf(r) + 1,
      prompt_id: r.prompt_id,
      avg_total: r.avg_total,
      avg_scores: r.avg_scores,
      system_prompt: r.system_prompt,
      explanations: r.explanations,
    })),
    trait_analysis: {
      top5_avg: Object.fromEntries(dims.map(d => [d, top5.reduce((s, r) => s + r.avg_scores[d], 0) / 5])),
      bottom5_avg: Object.fromEntries(dims.map(d => [d, bottom5.reduce((s, r) => s + r.avg_scores[d], 0) / 5])),
      delta: Object.fromEntries(dims.map(d => [d, (top5.reduce((s, r) => s + r.avg_scores[d], 0) / 5) - (bottom5.reduce((s, r) => s + r.avg_scores[d], 0) / 5)])),
    },
  }

  const fs = await import("fs")
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`\n  Full results written to ${outputPath}`)

  // Print top 5 full prompts for copy-paste
  console.log("\n═══════════════════════════════════════════════════════════════")
  console.log("  TOP 5 FULL PROMPTS")
  console.log("═══════════════════════════════════════════════════════════════")

  for (const result of top5) {
    console.log(`\n  ━━━ #${allResults.indexOf(result) + 1} (avg: ${result.avg_total.toFixed(1)}/40) ━━━`)
    console.log(result.system_prompt)
    console.log()
  }
}

main().catch(err => {
  console.error("Fatal:", err)
  process.exit(1)
})
