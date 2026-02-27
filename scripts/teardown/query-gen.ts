import Anthropic from "@anthropic-ai/sdk"
import * as fs from "fs"
import * as path from "path"
import * as readline from "readline"
import type { TeardownQuery } from "./types"

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return client
}

/** Read first N product names from a JSONL catalog file */
async function sampleProducts(
  catalogPath: string,
  count: number,
): Promise<string[]> {
  const products: string[] = []
  const stream = fs.createReadStream(catalogPath, "utf-8")
  const rl = readline.createInterface({ input: stream })

  for await (const line of rl) {
    if (!line.trim()) continue
    try {
      const p = JSON.parse(line)
      if (p.name) products.push(p.name)
      if (products.length >= count) break
    } catch {
      // skip malformed lines
    }
  }

  rl.close()
  stream.destroy()
  return products
}

export async function generateQueries(
  merchantId: string,
  merchantName: string,
  catalogPath?: string,
): Promise<TeardownQuery[]> {
  // Try to sample products for context
  let productSamples: string[] = []
  const defaultCatalog = path.join(
    process.cwd(),
    "data",
    `${merchantId}-catalog.jsonl`,
  )
  const catPath = catalogPath || defaultCatalog

  if (fs.existsSync(catPath)) {
    productSamples = await sampleProducts(catPath, 30)
    console.log(`  Sampled ${productSamples.length} products from catalog`)
  } else {
    console.log(`  No catalog file found at ${catPath}, generating without product samples`)
  }

  const prompt = `You are generating realistic shopper search queries for a ${merchantName} search teardown.
${productSamples.length > 0 ? `\nHere are sample products from their catalog:\n${productSamples.map((p, i) => `${i + 1}. ${p}`).join("\n")}` : ""}

Generate exactly 20 diverse search queries that real shoppers would type into ${merchantName}'s search bar. The queries should span these categories:

- 4 natural_language: Conversational queries ("I need something for...", "what's a good...")
- 3 use_case: Specific use-case queries ("best laptop for college", "home theater setup")
- 3 budget: Price-conscious queries ("wireless headphones under $100", "cheap gaming monitor")
- 2 typo: Common misspellings ("wireles earbuds", "smasung galaxy")
- 2 synonym: Alternate terms ("TV" vs "television", "fridge" vs "refrigerator")
- 2 long_tail: Multi-attribute queries ("65 inch 4k oled tv with hdmi 2.1")
- 2 category: Broad category browsing ("gaming laptops", "kitchen appliances")
- 2 gift: Gift/occasion queries ("gift for teenage gamer", "work from home essentials")

Return a JSON array of objects with these fields:
- "text": the search query string
- "category": one of natural_language, typo, synonym, long_tail, category, use_case, budget, gift
- "intent": a brief description of what the shopper is looking for

Return ONLY the JSON array, no other text.`

  const anthropic = getClient()
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = message.content[0].type === "text" ? message.content[0].text : ""
  const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

  try {
    const queries: TeardownQuery[] = JSON.parse(jsonStr)
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error("Empty or invalid response")
    }
    return queries
  } catch (err) {
    console.error("Failed to parse query generation response:")
    console.error(raw.slice(0, 500))
    throw err
  }
}
