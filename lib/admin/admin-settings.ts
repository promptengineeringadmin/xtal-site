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

// ─── Keys ───────────────────────────────────────────────────

const KEY_QUERY_ENHANCEMENT = "admin:settings:query_enhancement"
const KEY_MERCH_RERANK = "admin:settings:merch_rerank_strength"
const KEY_BM25_WEIGHT = "admin:settings:bm25_weight"
const KEY_KEYWORD_RERANK = "admin:settings:keyword_rerank_strength"

// ─── Query Enhancement ─────────────────────────────────────

export async function getQueryEnhancement(): Promise<boolean> {
  try {
    const kv = getRedis()
    const stored = await kv.get<boolean>(KEY_QUERY_ENHANCEMENT)
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return true // default: enabled
}

export async function saveQueryEnhancement(
  enabled: boolean
): Promise<void> {
  const kv = getRedis()
  await kv.set(KEY_QUERY_ENHANCEMENT, enabled)
}

// ─── Merch Re-rank Strength ────────────────────────────────

export async function getMerchRerankStrength(): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(KEY_MERCH_RERANK)
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 0.25 // default
}

export async function saveMerchRerankStrength(
  strength: number
): Promise<void> {
  const kv = getRedis()
  await kv.set(KEY_MERCH_RERANK, strength)
}

// ─── BM25 Weight ─────────────────────────────────────────

export async function getBm25Weight(): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(KEY_BM25_WEIGHT)
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 1.0 // default
}

export async function saveBm25Weight(weight: number): Promise<void> {
  const kv = getRedis()
  await kv.set(KEY_BM25_WEIGHT, weight)
}

// ─── Keyword Re-rank Strength ────────────────────────────

export async function getKeywordRerankStrength(): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(KEY_KEYWORD_RERANK)
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 0.3 // default
}

export async function saveKeywordRerankStrength(
  strength: number
): Promise<void> {
  const kv = getRedis()
  await kv.set(KEY_KEYWORD_RERANK, strength)
}
