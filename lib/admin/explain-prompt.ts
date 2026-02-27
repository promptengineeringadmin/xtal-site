import { Redis } from "@upstash/redis"
import { createHash } from "crypto"

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

// ─── Types ──────────────────────────────────────────────────

export interface ExplainPromptEntry {
  id: string
  name: string
  content: string
  enabled: boolean
}

interface ExplainPromptHistoryEntry {
  content: string
  timestamp: string
}

// ─── Default prompt pool ────────────────────────────────────

export const DEFAULT_EXPLAIN_PROMPTS: ExplainPromptEntry[] = [
  {
    id: "seasoned-pro",
    name: "Seasoned pro",
    enabled: true,
    content: `You are a seasoned retail associate with years of experience matching customers to the right product. You've seen every use case and know how to cut through the noise.

Your goal is to explain why this product connects to what the customer is actually trying to accomplish — the kind of practical, honest insight only experience provides.

REQUIREMENTS:
- Talk like a knowledgeable person having a real conversation — not a search engine, not a marketing deck
- Root every explanation in what the customer is trying to DO, not what the product IS
- Use "you" and "your" naturally throughout
- 2-3 concise sentences — experienced pros don't ramble
- Use your own judgment about how well this product fits — the product title and the customer's search terms are usually the strongest signal
- If the connection between title and search is obvious, be confident regardless of the relevance score
- Only hedge if YOU genuinely can't see a strong connection
- When there's a good price, frame it as a practical win — not a spec
- DO NOT echo or rephrase the customer's search query
- DO NOT list specs or walk through features — allude to value, don't recite it
- DO NOT suggest other products or alternatives
- Use background info as silent expertise — never quote it directly`,
  },
  {
    id: "practical-advisor",
    name: "Practical advisor",
    enabled: true,
    content: `You are a practical, down-to-earth advisor who helps customers cut through the noise and find what actually works.

Your goal is to explain why this product is a practical fit for what the customer is after — simply, honestly, and without the fluff.

REQUIREMENTS:
- Talk to them like a sensible person helping another sensible person
- Keep the focus on real-world usefulness, not marketing language
- Use "you" and "your" naturally
- 2-3 grounded sentences
- Judge the fit yourself — if the product title obviously connects to what they searched for, say so with confidence
- Only hedge if you genuinely can't see a strong connection
- Good deal? Mention it as a practical win
- DO NOT restate what they searched for
- DO NOT list specs or technical details
- DO NOT point elsewhere
- Background info is your private briefing — never quote it aloud`,
  },
]

// Keep old default for backward compat checks
export const DEFAULT_EXPLAIN_SYSTEM_PROMPT = DEFAULT_EXPLAIN_PROMPTS[0].content

// ─── Keys ───────────────────────────────────────────────────

const KEY_POOL = "explain:prompts:pool"
const KEY_CURRENT = "explain:prompt:system" // legacy single-prompt key
const KEY_HISTORY = "explain:prompt:history:system"
const MAX_HISTORY = 50

// ─── Prompt hash ────────────────────────────────────────────

export function computePromptHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 8)
}

// ─── Get prompt pool ────────────────────────────────────────

export async function getExplainPromptPool(): Promise<ExplainPromptEntry[]> {
  try {
    const kv = getRedis()
    const stored = await kv.get<ExplainPromptEntry[]>(KEY_POOL)
    if (stored && Array.isArray(stored) && stored.length > 0) return stored

    // Migrate from legacy single-prompt key if it exists
    const legacy = await kv.get<string>(KEY_CURRENT)
    if (legacy && typeof legacy === "string") {
      const pool: ExplainPromptEntry[] = [
        { id: "legacy", name: "Custom prompt", content: legacy, enabled: true },
        ...DEFAULT_EXPLAIN_PROMPTS.slice(1),
      ]
      await kv.set(KEY_POOL, JSON.stringify(pool))
      return pool
    }
  } catch {
    // Redis unavailable
  }
  return DEFAULT_EXPLAIN_PROMPTS
}

// ─── Save prompt pool ───────────────────────────────────────

export async function saveExplainPromptPool(
  pool: ExplainPromptEntry[]
): Promise<void> {
  const kv = getRedis()
  await kv.set(KEY_POOL, JSON.stringify(pool))
}

// ─── Get random prompt from pool ────────────────────────────

export async function getRandomExplainPrompt(): Promise<{
  content: string
  prompt_hash: string
}> {
  const pool = await getExplainPromptPool()
  const enabled = pool.filter((p) => p.enabled)
  if (enabled.length === 0) {
    // Fallback: use first default
    const content = DEFAULT_EXPLAIN_PROMPTS[0].content
    return { content, prompt_hash: computePromptHash(content) }
  }
  const pick = enabled[Math.floor(Math.random() * enabled.length)]
  return { content: pick.content, prompt_hash: computePromptHash(pick.content) }
}

// ─── Legacy single-prompt API (backward compat) ─────────────

export async function getExplainPrompt(): Promise<string> {
  const pool = await getExplainPromptPool()
  const first = pool.find((p) => p.enabled) ?? pool[0]
  return first?.content ?? DEFAULT_EXPLAIN_SYSTEM_PROMPT
}

export async function saveExplainPrompt(content: string): Promise<void> {
  const kv = getRedis()
  const timestamp = new Date().toISOString()

  // Save as legacy key for backward compat
  await kv.set(KEY_CURRENT, content)

  // Push history entry
  const entry: ExplainPromptHistoryEntry = { content, timestamp }
  await kv.lpush(KEY_HISTORY, JSON.stringify(entry))
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
