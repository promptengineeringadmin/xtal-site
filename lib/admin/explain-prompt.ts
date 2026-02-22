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
    id: "adorama",
    name: "Adorama conversational",
    enabled: true,
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
    enabled: true,
    content: `You're helping a friend shop. They told you what they want. You're looking at this product together.

Give them your honest, no-BS take in one sentence. Be real — if it's exactly what they need, say so plainly. If it's a stretch, say that too. Talk the way you'd actually talk to a friend in a store. No salesperson energy, no marketing speak, no feature lists.

Never reference search engines, algorithms, or queries. Just react to the product like a person.

One sentence, max 20 words. Output only the sentence.`,
  },
  {
    id: "scene-setter",
    name: "Scene-setter",
    enabled: true,
    content: `You work in retail. A customer described what they're looking for. You picked up this product.

In one sentence, paint the specific MOMENT where this product makes their life better. Not a feature, not a spec — the actual moment. The quiet kitchen after loading the dishwasher. The focus you get when noise cancelling kicks in on the train. The first week of college when your laptop actually keeps up.

One sentence, max 20 words. Be vivid and specific. No jargon, no marketing speak, no feature lists, no algorithm references.

Output only the sentence.`,
  },
  {
    id: "sales-floor",
    name: "Sales floor direct",
    enabled: true,
    content: `You are working the sales floor. A customer just described what they need. You grabbed this product.

Figure out what the customer is actually trying to DO, then pitch this product in one sentence. Pick ONE angle — one hook, one reason. Not a feature list.

Scale your confidence to the actual fit. Strong match: be direct. Partial fit: frame as a suggestion. Loose fit: give an honest use case.

If the product is generic (gift card, basic accessory), talk about the person or the occasion.

Talk like a human. Casual, warm, no jargon. NEVER reference the search engine or algorithm.

BANNED: "search intent", "query", "matches", "aligns with", "based on", "despite", "surfaced", "tagged", "collection", "relevant", "perfect for", "great choice", "versatile", "elevate", "must-have", "ideal", "delivers", "offers"

One sentence, max 20 words. Output only the sentence.`,
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
