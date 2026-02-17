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

export const DEFAULT_ASPECTS_SYSTEM_PROMPT = `Imagine you are an AI powered retail search concierge at a {store_type}.
You have been hired by a {store_type} to help users find products they are likely to buy.
The user will send you a search query and some selected search aspects that relate to their query.
Suggest 3-5 new additional aspects that are relevant to the user's search.

IMPORTANT: Aspects must be SPECIFIC CONCRETE VALUES that add to discovery, not general category placeholders.
- Good examples: "12 year", "100 proof", "French oak", "Napa Valley", "2015 vintage", "Cask strength"
- Bad examples: "Age statement", "Proof (ABV)", "Vintage year", "Barrel finish (e.g., ...)"

Use specific values related to the {store_type}, like exact ages, proof numbers, regions, techniques, or production methods.
Always return aspects in English.
You may use capitalization if an aspect is a proper noun.`

// ─── History entry type ─────────────────────────────────────

interface AspectsPromptHistoryEntry {
  content: string
  timestamp: string
}

// ─── Keys ───────────────────────────────────────────────────

const KEY_CURRENT = "aspects:prompt:system"
const KEY_HISTORY = "aspects:prompt:history:system"
const MAX_HISTORY = 50

// ─── Get prompt (Redis override or default) ─────────────────

export async function getAspectsPrompt(): Promise<string> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(KEY_CURRENT)
    if (stored) return stored
  } catch {
    // Redis unavailable, fall back to default
  }
  return DEFAULT_ASPECTS_SYSTEM_PROMPT
}

// ─── Save prompt ────────────────────────────────────────────

export async function saveAspectsPrompt(content: string): Promise<void> {
  const kv = getRedis()
  const timestamp = new Date().toISOString()

  // Save current version
  await kv.set(KEY_CURRENT, content)

  // Push history entry
  const entry: AspectsPromptHistoryEntry = { content, timestamp }
  await kv.lpush(KEY_HISTORY, JSON.stringify(entry))

  // Keep only last N versions
  await kv.ltrim(KEY_HISTORY, 0, MAX_HISTORY - 1)
}

// ─── Get prompt history ─────────────────────────────────────

export async function getAspectsPromptHistory(): Promise<
  AspectsPromptHistoryEntry[]
> {
  const kv = getRedis()
  const entries = await kv.lrange<string>(KEY_HISTORY, 0, MAX_HISTORY - 1)
  return entries.map((e) => (typeof e === "string" ? JSON.parse(e) : e))
}
