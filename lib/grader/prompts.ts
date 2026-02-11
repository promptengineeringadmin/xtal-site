import { Redis } from "@upstash/redis"
import type { PromptHistoryEntry } from "./types"

// ─── Redis client (lazy init) ───────────────────────────────

let redis: Redis | null = null
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  }
  return redis
}

// ─── Default prompts (used when KV has no override) ─────────

export const DEFAULT_ANALYZE_PROMPT = `You are analyzing an e-commerce store for a search quality audit.

Store URL: {{storeUrl}}
Platform: {{platform}}
Store name: {{storeName}}
Sample product titles from homepage:
{{productSamples}}

Based on this information:
1. What type of store is this? (e.g., "fashion", "electronics", "home goods", "beauty", "sporting goods", "food & beverage")
2. What specific vertical/niche? (e.g., "luxury women's fashion", "outdoor camping gear", "craft beer & spirits")
3. Generate exactly 10 test search queries designed to stress-test the store's search capability. The queries should be specific to THIS store's product catalog:
   - 2 queries with intentional typos relevant to their products (e.g., "wireles headphones" for an electronics store)
   - 2 queries using synonyms for their products (e.g., "couch" instead of "sofa" for a furniture store)
   - 2 natural language queries a real customer would ask (e.g., "gift for mom who likes gardening" for a garden store)
   - 2 long-tail specific queries combining multiple attributes from their catalog (e.g., "red dress for beach wedding under 200")
   - 1 broad category-level query (e.g., "men's shoes")
   - 1 query for something the store almost certainly does NOT carry (to test the null/empty results experience)

Return valid JSON only, no markdown:
{
  "storeType": "string",
  "vertical": "string",
  "queries": [
    {
      "text": "the search query",
      "category": "typo|synonym|natural_language|long_tail|category|null_test",
      "expectedBehavior": "what good search results would look like for this query"
    }
  ]
}`

export const DEFAULT_EVALUATE_PROMPT = `You are a search quality expert evaluating an e-commerce store's search results.

Store: {{storeName}} ({{storeType}}, {{vertical}})
Platform: {{platform}}
URL: {{storeUrl}}

Here are the search test results:
{{queryResults}}

For each test query, evaluate whether the search returned relevant results.

Then score these 8 dimensions from 0-100:

1. typo_tolerance: How well does search handle misspellings? Did misspelled queries still return the intended products?
2. synonym_handling: Does it understand related terms? Did synonym queries return the same products as canonical terms would?
3. natural_language: Can it parse conversational queries? Did it understand intent like "gift for" or "something for"?
4. long_tail: Does it handle specific multi-attribute queries? Did results match ALL specified attributes (color, price, occasion, etc.)?
5. null_rate: How often does it return zero results? Score inversely — fewer zero-result queries = higher score. If the null_test query correctly returned zero results, that's fine and should NOT be penalized.
6. category_intelligence: Does it understand product categories? Did broad category queries return a relevant assortment?
7. result_relevance: Overall quality of top results across all query types. Are the first 3-5 results actually what a customer would want?
8. response_speed: Based on the response times provided. Under 200ms = 100, under 500ms = 85, under 1s = 70, under 2s = 55, over 2s = 30.

Also provide:
- For each dimension, list specific failures with the exact query that failed
- A 1-2 sentence explanation of each score
- For each dimension, a recommendation of what XTAL Search would do differently

Return valid JSON only, no markdown:
{
  "dimensions": [
    {
      "key": "typo_tolerance|synonym_handling|natural_language|long_tail|null_rate|category_intelligence|result_relevance|response_speed",
      "score": 0-100,
      "failures": ["specific failure description"],
      "explanation": "why this score",
      "testQueries": [
        {
          "query": "the query tested",
          "resultCount": number,
          "topResults": ["result title 1", "result title 2"],
          "verdict": "pass|partial|fail"
        }
      ]
    }
  ],
  "overallScore": 0-100,
  "summary": "1-2 sentence summary of biggest issues",
  "recommendations": [
    {
      "dimension": "the dimension key",
      "dimensionLabel": "Human Label",
      "problem": "what's wrong",
      "suggestion": "what to fix",
      "xtalAdvantage": "how XTAL handles this better"
    }
  ]
}`

// ─── Get prompt (KV override or default) ────────────────────

export async function getPrompt(key: "analyze" | "evaluate"): Promise<string> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(`grader:prompt:${key}`)
    if (stored) return stored
  } catch {
    // KV unavailable, fall back to default
  }
  return key === "analyze" ? DEFAULT_ANALYZE_PROMPT : DEFAULT_EVALUATE_PROMPT
}

// ─── Save prompt ────────────────────────────────────────────

export async function savePrompt(
  key: "analyze" | "evaluate",
  content: string
): Promise<void> {
  const kv = getRedis()
  const timestamp = new Date().toISOString()

  // Save current version
  await kv.set(`grader:prompt:${key}`, content)

  // Save history entry
  const historyEntry: PromptHistoryEntry = { key, content, timestamp }
  await kv.lpush(`grader:prompt:history:${key}`, JSON.stringify(historyEntry))

  // Keep only last 50 versions
  await kv.ltrim(`grader:prompt:history:${key}`, 0, 49)
}

// ─── Get prompt history ─────────────────────────────────────

export async function getPromptHistory(
  key: "analyze" | "evaluate"
): Promise<PromptHistoryEntry[]> {
  const kv = getRedis()
  const entries = await kv.lrange<string>(`grader:prompt:history:${key}`, 0, 49)
  return entries.map((e) => (typeof e === "string" ? JSON.parse(e) : e))
}

// ─── Fill prompt template ───────────────────────────────────

export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let filled = template
  for (const [key, value] of Object.entries(vars)) {
    filled = filled.replaceAll(`{{${key}}}`, value)
  }
  return filled
}
