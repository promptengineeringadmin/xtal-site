import { Redis } from "@upstash/redis"
import {
  DEFAULT_BRAND_PROMPT,
  DEFAULT_MARKETING_PROMPT,
} from "./prompt-defaults"

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

// ─── History entry type ─────────────────────────────────────

export interface PromptHistoryEntry {
  content: string
  timestamp: string
}

// ─── Keys ───────────────────────────────────────────────────

const MAX_HISTORY = 50

function brandKey(collection: string) {
  return `prompt:brand:${collection}`
}
function brandHistoryKey(collection: string) {
  return `prompt:brand:history:${collection}`
}
function marketingKey(collection: string) {
  return `prompt:marketing:${collection}`
}
function marketingHistoryKey(collection: string) {
  return `prompt:marketing:history:${collection}`
}

// ─── Brand Prompt ───────────────────────────────────────────

export async function getBrandPrompt(collection: string): Promise<string | null> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(brandKey(collection))
    if (stored) return stored
  } catch {
    // Redis unavailable
  }
  return null
}

export async function saveBrandPrompt(
  collection: string,
  content: string
): Promise<void> {
  const kv = getRedis()
  const timestamp = new Date().toISOString()

  await kv.set(brandKey(collection), content)

  const entry: PromptHistoryEntry = { content, timestamp }
  await kv.lpush(brandHistoryKey(collection), JSON.stringify(entry))
  await kv.ltrim(brandHistoryKey(collection), 0, MAX_HISTORY - 1)
}

export async function getBrandPromptHistory(
  collection: string
): Promise<PromptHistoryEntry[]> {
  const kv = getRedis()
  const entries = await kv.lrange<string>(brandHistoryKey(collection), 0, MAX_HISTORY - 1)
  return entries.map((e) => (typeof e === "string" ? JSON.parse(e) : e))
}

// ─── Marketing Prompt ───────────────────────────────────────

export async function getMarketingPrompt(collection: string): Promise<string | null> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(marketingKey(collection))
    if (stored) return stored
  } catch {
    // Redis unavailable
  }
  return null
}

export async function saveMarketingPrompt(
  collection: string,
  content: string
): Promise<void> {
  const kv = getRedis()
  const timestamp = new Date().toISOString()

  await kv.set(marketingKey(collection), content)

  const entry: PromptHistoryEntry = { content, timestamp }
  await kv.lpush(marketingHistoryKey(collection), JSON.stringify(entry))
  await kv.ltrim(marketingHistoryKey(collection), 0, MAX_HISTORY - 1)
}

export async function getMarketingPromptHistory(
  collection: string
): Promise<PromptHistoryEntry[]> {
  const kv = getRedis()
  const entries = await kv.lrange<string>(marketingHistoryKey(collection), 0, MAX_HISTORY - 1)
  return entries.map((e) => (typeof e === "string" ? JSON.parse(e) : e))
}

// ─── Defaults ───────────────────────────────────────────────

export { DEFAULT_BRAND_PROMPT, DEFAULT_MARKETING_PROMPT }
