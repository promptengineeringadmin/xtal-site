#!/usr/bin/env npx tsx
/**
 * Test refined prompt against the same product set used in iteration.
 * Compares the synthesized winner against the top 3 from iteration.
 */

import Anthropic from "@anthropic-ai/sdk"

const SEARCH_BASE = "https://xtalsearch.com"
const COLLECTION = "bestbuy"
const MODEL = "claude-sonnet-4-6"

const TEST_QUERIES = [
  "gift for a teenage gamer",
  "laptop for college",
  "noise cancelling headphones",
  "home office setup",
  "budget 4K TV under $500",
]

// ─── Synthesized prompt: combines winning KV traits ────────────────

const REFINED_PROMPT = `You are a seasoned retail associate with years of experience matching customers to the right product. You've seen every use case and know how to cut through the noise.

Your goal is to explain why this product connects to what the customer is actually trying to accomplish — the kind of practical, honest insight only experience provides.

REQUIREMENTS:
- Talk like a knowledgeable person having a real conversation — not a search engine, not a marketing deck
- Root every explanation in what the customer is trying to DO, not what the product IS
- Use "you" and "your" naturally throughout
- 2-3 concise sentences — experienced pros don't ramble
- Calibrate your confidence to the actual fit:
  - Strong match → confirm it directly, explain why it clicks
  - Decent match → acknowledge what works and what to consider
  - Loose match → be honest that it's a stretch, explain who it WOULD work for
- When there's a good price, frame it as a practical win — not a spec
- DO NOT echo or rephrase the customer's search query
- DO NOT list specs or walk through features — allude to value, don't recite it
- DO NOT suggest other products or alternatives
- Use background info as silent expertise — never quote it directly`

// ─── Top 3 from iteration (for comparison) ─────────────────────────

const COMPARISON_PROMPTS = [
  {
    id: "iteration-#8",
    name: "Seasoned floor associate (iteration winner)",
    content: `You are a seasoned floor associate with years of experience matching customers to the right product.

Your goal is to deliver a quick, confident recommendation explanation rooted in the customer's actual needs — the kind of insight only experience provides.

CRITICAL REQUIREMENTS:
- Talk to them like a pro who's seen every use case
- Root the explanation in outcomes and real use, not specs
- Use "you" and "your" naturally
- 2-3 sentences — seasoned pros don't ramble
- Be direct about quality of fit; veterans don't oversell weak matches
- When there's a deal, frame it as experience telling you it's the right time to buy
- DO NOT echo their query
- DO NOT walk through the spec sheet
- DO NOT point toward other products
- Use background info as silent expertise — never quote it`,
  },
  {
    id: "iteration-#12",
    name: "Practical advisor (iteration #2)",
    content: `You are a practical, down-to-earth advisor who helps customers cut through the noise and find what actually works.

Your goal is to explain why this product is a practical fit for what the customer is after — simply, honestly, and without the fluff.

CRITICAL REQUIREMENTS:
- Talk to them like a sensible person helping another sensible person
- Keep the focus on real-world usefulness, not marketing language
- Use "you" and "your" naturally
- 2-3 grounded sentences
- Say it plainly: solid match = say it, questionable match = flag it honestly
- Good deal? Mention it as a practical win
- DO NOT restate what they searched for
- DO NOT list specs or technical details
- DO NOT point elsewhere
- Background info is your private briefing — never quote it aloud`,
  },
]

// ─── Types & helpers ────────────────────────────────────────────────

interface Product {
  id: string; title: string; vendor: string; product_type: string
  description?: string; enhanced_description?: string; body_html?: string
  tags?: string[]; price: number | number[]
}

function buildUserPrompt(query: string, product: Product, score: number): string {
  const price = Array.isArray(product.price) ? product.price[0] : product.price
  const matchQuality = score >= 0.85 ? "Strong Match" : score >= 0.6 ? "Decent Match" : "Loose Match"
  const desc = product.enhanced_description || product.body_html || product.description || ""
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

const SCORING_SYSTEM = `You are an expert evaluator of retail product explanations. Score each dimension 1-5 (1=terrible, 5=excellent). Be STRICT.

Return ONLY valid JSON:
{
  "intent_bridge": <1-5>,
  "natural_voice": <1-5>,
  "honesty_calibration": <1-5>,
  "query_independence": <1-5>,
  "spec_avoidance": <1-5>,
  "emotional_hook": <1-5>,
  "conciseness": <1-5>,
  "customer_aha": <1-5>,
  "trait_notes": "<brief note>"
}`

async function searchProducts(query: string, limit: number) {
  const res = await fetch(`${SEARCH_BASE}/api/xtal/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, collection: COLLECTION, limit }),
  })
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  const data = await res.json()
  return { products: (data.results || []).slice(0, limit) as Product[], scores: data.relevance_scores || {} }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { console.error("ANTHROPIC_API_KEY required"); process.exit(1) }
  const client = new Anthropic({ apiKey: apiKey.trim() })

  // Fetch products
  console.log("\nFetching test products...\n")
  const testCases: { query: string; product: Product; score: number }[] = []
  for (const query of TEST_QUERIES) {
    const { products, scores } = await searchProducts(query, 2)
    for (const product of products) {
      testCases.push({ query, product, score: scores[product.id] ?? 0.5 })
    }
  }

  const allPrompts = [
    { id: "REFINED", name: "Synthesized winner", content: REFINED_PROMPT },
    ...COMPARISON_PROMPTS,
  ]

  for (const prompt of allPrompts) {
    console.log(`\n${"═".repeat(70)}`)
    console.log(`  ${prompt.name} (${prompt.id})`)
    console.log(`${"═".repeat(70)}`)

    let totalScore = 0
    let count = 0
    const dimTotals: Record<string, number> = {}

    for (const { query, product, score } of testCases) {
      const userPrompt = buildUserPrompt(query, product, score)
      const price = Array.isArray(product.price) ? product.price[0] : product.price

      // Generate
      const genResp = await client.messages.create({
        model: MODEL, max_tokens: 200,
        system: prompt.content,
        messages: [{ role: "user", content: userPrompt }],
      })
      const explanation = genResp.content[0].type === "text" ? genResp.content[0].text : ""

      // Score
      const scoreResp = await client.messages.create({
        model: MODEL, max_tokens: 400,
        system: SCORING_SYSTEM,
        messages: [{ role: "user", content: `SEARCH QUERY: "${query}"\nPRODUCT: "${product.title}"\nEXPLANATION: "${explanation}"\n\nScore this. Return ONLY JSON.` }],
      })
      const raw = scoreResp.content[0].type === "text" ? scoreResp.content[0].text : "{}"
      const jsonMatch = raw.match(/\{[\s\S]*\}/)

      let scores: Record<string, number> = {}
      let traitNotes = ""
      try {
        const parsed = JSON.parse(jsonMatch?.[0] || "{}")
        traitNotes = parsed.trait_notes || ""
        delete parsed.trait_notes
        scores = parsed
      } catch { /* skip */ }

      const total = Object.values(scores).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
      totalScore += total
      count++
      for (const [k, v] of Object.entries(scores)) {
        dimTotals[k] = (dimTotals[k] || 0) + v
      }

      console.log(`\n  "${query}" → ${product.title} ($${price})`)
      console.log(`  Score: ${total}/40`)
      console.log(`  ${explanation}`)
      if (traitNotes) console.log(`  Notes: ${traitNotes}`)
    }

    const avg = totalScore / count
    console.log(`\n  ── AVERAGE: ${avg.toFixed(1)}/40 ──`)
    for (const [dim, total] of Object.entries(dimTotals)) {
      const dimAvg = total / count
      const bar = "█".repeat(Math.round(dimAvg)) + "░".repeat(5 - Math.round(dimAvg))
      console.log(`    ${dim.padEnd(22)} ${bar} ${dimAvg.toFixed(2)}`)
    }
  }
}

main().catch(err => { console.error("Fatal:", err); process.exit(1) })
