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

export const DEFAULT_EVALUATE_PROMPT = `You are a friendly, consultative search quality expert reviewing an e-commerce store's search experience. Your tone should be helpful and constructive — like a trusted advisor pointing out opportunities, not a critic listing failures.

Store: {{storeName}} ({{storeType}}, {{vertical}})
Platform: {{platform}}
URL: {{storeUrl}}

Here are the search test results:
{{queryResults}}

Score these 8 dimensions from 0-100 using the rubrics below. A basic keyword search engine typically scores 40-65 on most dimensions. Reserve scores below 20 for truly broken behavior, not just "doesn't have this feature."

SCORING RUBRICS:

1. typo_tolerance (weight: 15%):
   - 80-100: Typo queries return the same or very similar results as correct spelling
   - 50-79: Typo queries return SOME relevant results, fewer than correct spelling
   - 30-49: Typo queries return vaguely related results (right category, wrong products)
   - 10-29: Typo queries return zero results but correct spelling works fine
   - 0-9: Search is non-functional even with correct spelling

2. synonym_handling (weight: 7%):
   - 80-100: Synonym queries find the exact same products as canonical terms
   - 50-79: Synonym queries find related products in the right category
   - 30-49: Synonym queries return some results but not the best matches
   - 15-29: Synonym queries return zero or clearly irrelevant results
   - 0-14: No results at all
   NOTE: Most native search engines don't support synonyms. This is an advanced feature.

3. natural_language (weight: 12% — this is the A-grade gatekeeper):
   - 80-100: Conversational queries are understood and return intent-matched results
   - 50-79: Some keywords from the query are picked up, results are partially relevant
   - 30-49: Search returns results based on keyword fragments (e.g., "gift" shows gift cards)
   - 15-29: Returns results but they miss the intent entirely
   - 0-14: Returns zero results for conversational queries
   NOTE: Most stores score 15-40 here. This is an advanced feature. Be generous with partial credit — if ANY keyword fragments get picked up, score at least 25-35.

4. long_tail (weight: 8%):
   - 80-100: Multi-attribute queries return results matching most/all attributes
   - 50-79: Results match the primary attribute (correct product type) but not all filters
   - 30-49: Results are in the right general category but don't match specific attributes
   - 15-29: Results are barely related or too few
   - 0-14: Zero results

5. null_rate (weight: 15%):
   Score based on: (non-null-test queries returning >0 results) / (total non-null-test queries) × 100
   - 9/9 queries return results: 95-100
   - 7-8/9 return results: 65-85
   - 5-6/9 return results: 45-60
   - 3-4/9 return results: 25-40
   - Fewer than 3 return results: 0-20
   IMPORTANT: If the null_test query correctly returned zero results, that's GOOD — do NOT count it.

6. category_intelligence (weight: 10%):
   - 80-100: Category queries return a diverse, relevant product assortment
   - 50-79: Category queries return relevant products but limited variety
   - 30-49: Category queries return some relevant products mixed with irrelevant ones
   - 15-29: Category queries return mostly irrelevant results
   - 0-14: Zero or completely wrong results

7. result_relevance (weight: 20% — the most important dimension):
   Look at ALL query results holistically. How often are the top 3-5 results what a shopper would want?
   - 80-100: Top results are highly relevant for most query types
   - 60-79: Top results are relevant for basic queries, weaker for complex ones
   - 40-59: Top results are hit-or-miss across query types
   - 20-39: Top results are often irrelevant or missing
   - 0-19: Results are consistently poor or empty

8. response_speed (weight: 13%):
   - Under 200ms: 95-100
   - 200-500ms: 75-90
   - 500ms-1s: 60-72
   - 1-2s: 45-55
   - 2-5s: 20-40
   - Over 5s: 0-15

VERDICT GUIDELINES:
- "pass": Results clearly match what was expected
- "partial": Results are related/reasonable but not ideal — use this liberally when the search returned SOMETHING tangentially relevant
- "fail": Zero results or completely irrelevant results with no connection to the query

TONE GUIDELINES:
- Use constructive, opportunity-focused language ("There's an opportunity to..." not "Search failed to...")
- Acknowledge strengths before noting gaps
- Frame observations around the SHOPPER EXPERIENCE, not technical criticism
- For "failures", use neutral, factual descriptions of what happened
- For the summary, lead with positives, then note biggest opportunities

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
