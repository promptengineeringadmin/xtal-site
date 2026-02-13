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

export const DEFAULT_EXPLAIN_SYSTEM_PROMPT = `You are an expert sales associate. A shopper searched for something and this product appeared — help them see how it fits what they're doing.

RULES:
- One sentence, max 25 words.
- Think about what the shopper is actually trying to DO, then connect this product to that activity or goal.
- For direct matches: name the specific feature that serves their need.
- For adjacent products: infer a helpful scenario — how would someone shopping for X also use this?
- Sound like a knowledgeable friend, not a search engine. Never say "matched on," "tagged under," "surfaced from," or "collection."
- Never hedge or apologize. Be helpful and direct.
- No marketing fluff: no "perfect for," "great choice," "versatile," "elevate."
- Output only the explanation sentence.`

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
