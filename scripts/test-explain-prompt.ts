#!/usr/bin/env npx tsx
/**
 * Offline evaluation script for explain prompt variants.
 *
 * Fetches products from the search API, calls Anthropic directly with each
 * prompt variant, and prints a side-by-side comparison.
 *
 * Usage:
 *   npx tsx scripts/test-explain-prompt.ts --collection bestbuy
 *   npx tsx scripts/test-explain-prompt.ts --collection bestbuy --queries "laptop for college" "noise cancelling headphones"
 *   npx tsx scripts/test-explain-prompt.ts --base-url https://xtal-site.vercel.app --collection bestbuy
 */

import Anthropic from "@anthropic-ai/sdk"
import { createHash } from "crypto"

// ─── Default prompt pool (copied to keep script self-contained) ──────

interface PromptVariant {
  id: string
  name: string
  content: string
}

const PROMPTS: PromptVariant[] = [
  {
    id: "adorama",
    name: "Adorama conversational",
    content: `You are a knowledgeable salesperson at a premium electronics retailer, guiding customers to the right product for their needs.

A customer just described what they're looking for. You picked up this product. Explain WHY it's worth their attention — speak directly to them, face-to-face.

REQUIREMENTS:
- 2-3 concise sentences, conversational and natural
- Focus on how this product serves their specific needs or goals — infer what they're actually trying to accomplish
- If the product is a strong fit, be enthusiastic about the specific reason why
- If it's a partial fit, be honest — frame it as "worth considering if…"
- If the product is generic (gift card, basic accessory), talk about the person or the occasion, not the product
- Use "you" and "your" to speak directly to them
- DO NOT repeat or rephrase what they searched for
- DO NOT list product specs or features. Allude to what makes it good
- DO NOT suggest other products or alternatives
- NEVER reference search engines, algorithms, queries, or how the product was found
- Vary your tone and structure
- Output only your response to the customer`,
  },
  {
    id: "honest-friend",
    name: "Honest friend",
    content: `You're helping a friend shop. They told you what they want. You're looking at this product together.

Give them your honest, no-BS take in one sentence. Be real — if it's exactly what they need, say so plainly. If it's a stretch, say that too. Talk the way you'd actually talk to a friend in a store. No salesperson energy, no marketing speak, no feature lists.

Never reference search engines, algorithms, or queries. Just react to the product like a person.

One sentence, max 20 words. Output only the sentence.`,
  },
  {
    id: "scene-setter",
    name: "Scene-setter",
    content: `You work in retail. A customer described what they're looking for. You picked up this product.

In one sentence, paint the specific MOMENT where this product makes their life better. Not a feature, not a spec — the actual moment. The quiet kitchen after loading the dishwasher. The focus you get when noise cancelling kicks in on the train. The first week of college when your laptop actually keeps up.

One sentence, max 20 words. Be vivid and specific. No jargon, no marketing speak, no feature lists, no algorithm references.

Output only the sentence.`,
  },
  {
    id: "sales-floor",
    name: "Sales floor direct",
    content: `You are working the sales floor. A customer just described what they need. You grabbed this product.

Figure out what the customer is actually trying to DO, then pitch this product in one sentence. Pick ONE angle — one hook, one reason. Not a feature list.

Scale your confidence to the actual fit. Strong match: be direct. Partial fit: frame as a suggestion. Loose fit: give an honest use case.

If the product is generic (gift card, basic accessory), talk about the person or the occasion.

Talk like a human. Casual, warm, no jargon. NEVER reference the search engine or algorithm.

BANNED: "search intent", "query", "matches", "aligns with", "based on", "despite", "surfaced", "tagged", "collection", "relevant", "perfect for", "great choice", "versatile", "elevate", "must-have", "ideal", "delivers", "offers"

One sentence, max 20 words. Output only the sentence.`,
  },
]

// ─── CLI args ────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  let baseUrl = "https://xtal-site.vercel.app"
  let collection = "bestbuy"
  const queries: string[] = []
  let topN = 3

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--base-url":
        baseUrl = args[++i]
        break
      case "--collection":
        collection = args[++i]
        break
      case "--queries":
        while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
          queries.push(args[++i])
        }
        break
      case "--top":
        topN = parseInt(args[++i], 10)
        break
      case "--help":
        console.log(`Usage: npx tsx scripts/test-explain-prompt.ts [options]

Options:
  --base-url <url>      Search API base URL (default: https://xtal-site.vercel.app)
  --collection <name>   Collection to search (default: bestbuy)
  --queries <q1> <q2>   Custom queries (default: built-in set of 5)
  --top <n>             Top N results per query (default: 3)
  --help                Show this help`)
        process.exit(0)
    }
  }

  if (queries.length === 0) {
    queries.push(
      "laptop for college student",
      "gift for someone who loves cooking",
      "noise cancelling headphones for commuting",
      "budget home security camera",
      "portable speaker for beach trips"
    )
  }

  return { baseUrl, collection, queries, topN }
}

// ─── Search API ──────────────────────────────────────────────────────

interface SearchProduct {
  id: string
  title: string
  vendor: string
  product_type: string
  body_html: string
  tags: string[]
  price: number | number[]
}

async function searchProducts(
  baseUrl: string,
  collection: string,
  query: string,
  limit: number
): Promise<SearchProduct[]> {
  const res = await fetch(`${baseUrl}/api/xtal/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, collection, limit }),
  })
  if (!res.ok) {
    throw new Error(`Search failed (${res.status}): ${await res.text()}`)
  }
  const data = await res.json()
  return (data.results || []).slice(0, limit)
}

// ─── Anthropic call ──────────────────────────────────────────────────

async function generateExplanation(
  client: Anthropic,
  systemPrompt: string,
  query: string,
  product: SearchProduct
): Promise<string> {
  const userMessage = `Customer query: "${query}"

Product: ${product.title}
${product.vendor ? `Brand: ${product.vendor}` : ""}
${product.product_type ? `Type: ${product.product_type}` : ""}
${product.body_html ? `Description: ${product.body_html.slice(0, 500)}` : ""}`

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  const block = response.content[0]
  return block.type === "text" ? block.text : "(no text)"
}

// ─── Formatting ──────────────────────────────────────────────────────

function promptHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 8)
}

function separator(char = "─", len = 80) {
  return char.repeat(len)
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    if (line.length + word.length + 1 > width && line.length > 0) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const { baseUrl, collection, queries, topN } = parseArgs()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required")
    process.exit(1)
  }

  const client = new Anthropic({ apiKey: apiKey.trim() })

  console.log(`\n${separator("═")}`)
  console.log(`  Explain Prompt Comparison`)
  console.log(`  Collection: ${collection} | Top ${topN} per query`)
  console.log(`  Prompts: ${PROMPTS.map((p) => p.name).join(", ")}`)
  console.log(`${separator("═")}\n`)

  let totalCalls = 0

  for (const query of queries) {
    console.log(`\n${separator()}`)
    console.log(`  QUERY: "${query}"`)
    console.log(`${separator()}\n`)

    let products: SearchProduct[]
    try {
      products = await searchProducts(baseUrl, collection, query, topN)
    } catch (err) {
      console.error(`  Search failed: ${err}`)
      continue
    }

    if (products.length === 0) {
      console.log("  No results.\n")
      continue
    }

    for (const product of products) {
      const price = Array.isArray(product.price)
        ? `$${product.price[0]}`
        : `$${product.price}`
      console.log(`  Product: ${product.title}`)
      console.log(`  Brand: ${product.vendor || "—"} | Price: ${price}`)
      console.log()

      for (const prompt of PROMPTS) {
        const hash = promptHash(prompt.content)
        try {
          const explanation = await generateExplanation(
            client,
            prompt.content,
            query,
            product
          )
          totalCalls++

          const lines = wrap(explanation, 70)
          console.log(`    [${prompt.name}] (${hash})`)
          for (const line of lines) {
            console.log(`      ${line}`)
          }
          console.log()
        } catch (err) {
          console.error(`    [${prompt.name}] ERROR: ${err}`)
        }
      }
      console.log(`  ${separator("·", 60)}`)
    }
  }

  console.log(`\n${separator("═")}`)
  console.log(`  Done. ${totalCalls} API calls made.`)
  console.log(`${separator("═")}\n`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
