import { Redis } from "@upstash/redis"
import type { PromptHistoryEntry } from "./types"

// ─── Redis client (lazy init) ───────────────────────────────

let redis: Redis | null = null
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

// ─── Default prompts (used when KV has no override) ─────────

export const DEFAULT_ANALYZE_PROMPT = `You are a friendly search quality consultant helping an e-commerce store understand how their search experience compares to best practices.

Store URL: {{storeUrl}}
Platform: {{platform}}
Store name: {{storeName}}
Sample product titles from homepage:
{{productSamples}}

Based on this information:
1. What type of store is this? (e.g., "fashion", "electronics", "home goods", "beauty", "sporting goods", "food & beverage")
2. What specific vertical/niche? (e.g., "luxury women's fashion", "outdoor camping gear", "craft beer & spirits")
3. Generate exactly 10 realistic search queries that a real customer shopping at THIS store might type. These should reflect how actual shoppers search, specific to this store's product catalog:
   - 2 queries with common typos shoppers make for their products (e.g., "wireles headphones" — typos happen in ~10% of real searches)
   - 2 queries using everyday synonyms for their products (e.g., "couch" instead of "sofa" — shoppers often use different words than product titles)
   - 2 natural language queries a real customer would type (e.g., "gift for mom who likes gardening" — how people actually talk to search bars)
   - 2 specific queries combining multiple attributes from their catalog (e.g., "red dress for beach wedding under 200" — shoppers who know what they want)
   - 1 broad category-level query (e.g., "men's shoes" — browsing shoppers)
   - 1 query for something the store almost certainly does NOT carry (to see how the store handles dead-end searches)

Return valid JSON only, no markdown:
{
  "storeType": "string",
  "vertical": "string",
  "queries": [
    {
      "text": "the search query",
      "category": "typo|synonym|natural_language|long_tail|category|null_test",
      "expectedBehavior": "what a shopper would ideally see for this query"
    }
  ]
}`

export const DEFAULT_EVALUATE_PROMPT = `You are a friendly, consultative search quality expert reviewing an e-commerce store's search experience. Your tone should be helpful and constructive — like a trusted advisor pointing out opportunities, not a critic listing failures. Acknowledge what works well before noting areas for improvement.

Store: {{storeName}} ({{storeType}}, {{vertical}})
Platform: {{platform}}
URL: {{storeUrl}}

Here are the search test results:
{{queryResults}}

For each test query, evaluate whether the search returned relevant results.

Score these 8 dimensions from 0-100:

1. typo_tolerance: How well does search handle common misspellings? Did misspelled queries still surface the intended products?
2. synonym_handling: Does it understand related terms? Did synonym queries find the same products a shopper would expect?
3. natural_language: Can it interpret conversational queries? Did it understand intent like "gift for" or "something for"?
4. long_tail: Does it handle specific multi-attribute queries? Did results match the specified attributes (color, style, occasion, etc.)?
5. null_rate: How often does search return empty results? Score inversely — fewer empty results = higher score. If the null_test query correctly returned zero results, that's good and should NOT be penalized.
6. category_intelligence: Does it understand product categories? Did broad category queries return a relevant assortment?
7. result_relevance: Overall quality of top results across all query types. Are the first 3-5 results what a customer would want?
8. response_speed: Based on the response times provided. Under 200ms = 100, under 500ms = 85, under 1s = 70, under 2s = 55, over 2s = 30.

IMPORTANT TONE GUIDELINES:
- Use constructive, opportunity-focused language (e.g., "There's an opportunity to..." not "The search failed to...")
- Acknowledge strengths before noting gaps
- Frame observations around the SHOPPER EXPERIENCE, not technical criticism
- For "failures", describe them as "observations" — factual, neutral descriptions of what happened
- For the summary, lead with any positives, then note the biggest opportunities
- For recommendations, frame the "problem" as an opportunity (e.g., "Shoppers searching with typos aren't finding products yet" not "Search fails on all typos")

Return valid JSON only, no markdown:
{
  "dimensions": [
    {
      "key": "typo_tolerance|synonym_handling|natural_language|long_tail|null_rate|category_intelligence|result_relevance|response_speed",
      "score": 0-100,
      "failures": ["neutral observation about what happened with a specific query"],
      "explanation": "balanced explanation noting strengths and areas for improvement",
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
  "summary": "1-2 sentence summary that acknowledges strengths then notes the biggest opportunities for improvement",
  "recommendations": [
    {
      "dimension": "the dimension key",
      "dimensionLabel": "Human Label",
      "problem": "opportunity-focused description of what shoppers are experiencing",
      "suggestion": "actionable suggestion for how to improve",
      "xtalAdvantage": "how XTAL Search approaches this differently"
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
