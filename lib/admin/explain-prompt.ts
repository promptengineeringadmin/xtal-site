import { Redis } from "@upstash/redis"

// ─── Redis client (lazy init) ───────────────────────────────

let redis: Redis | null = null
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
      token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
    })
  }
  return redis
}

// ─── Default prompt (mirrors backend hardcoded default) ─────

export const DEFAULT_EXPLAIN_SYSTEM_PROMPT = `You explain why a specific product appeared in a shopper's search results.
You receive the search query, the product record, and a relevance score.

RULES:
- Write exactly 1-2 sentences.
- Start from the search term, not from the product. The search query is the subject.
- Name the specific attributes — shape, material, use case, typical buyer — that connect this product to the search intent.
- If the relevance score is below 0.6, be direct about what's different between the search and this product, then explain why it was still included (adjacent category, common co-purchase, shared use case, etc).
- Never use marketing language. No "perfect for", "great choice", "versatile", "elevate your space".
- Never summarize the product. The shopper can already see the title and image.
- Respond with only the explanation text. No preamble, no labels, no quotes.`

// ─── History entry type ─────────────────────────────────────

interface ExplainPromptHistoryEntry {
  content: string
  timestamp: string
}

// ─── Keys ───────────────────────────────────────────────────

const KEY_CURRENT = "explain:prompt:system"
const KEY_HISTORY = "explain:prompt:history:system"
const MAX_HISTORY = 50

// ─── Get prompt (Redis override or default) ─────────────────

export async function getExplainPrompt(): Promise<string> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(KEY_CURRENT)
    if (stored) return stored
  } catch {
    // Redis unavailable, fall back to default
  }
  return DEFAULT_EXPLAIN_SYSTEM_PROMPT
}

// ─── Save prompt ────────────────────────────────────────────

export async function saveExplainPrompt(content: string): Promise<void> {
  const kv = getRedis()
  const timestamp = new Date().toISOString()

  // Save current version
  await kv.set(KEY_CURRENT, content)

  // Push history entry
  const entry: ExplainPromptHistoryEntry = { content, timestamp }
  await kv.lpush(KEY_HISTORY, JSON.stringify(entry))

  // Keep only last N versions
  await kv.ltrim(KEY_HISTORY, 0, MAX_HISTORY - 1)
}

// ─── Get prompt history ─────────────────────────────────────

export async function getExplainPromptHistory(): Promise<
  ExplainPromptHistoryEntry[]
> {
  const kv = getRedis()
  const entries = await kv.lrange<string>(KEY_HISTORY, 0, MAX_HISTORY - 1)
  return entries.map((e) => (typeof e === "string" ? JSON.parse(e) : e))
}
