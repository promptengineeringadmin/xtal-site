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

// ─── Keys (scoped by collection) ─────────────────────────────

function queryEnhancementKey(collection: string) {
  return `admin:settings:${collection}:query_enhancement`
}
function merchRerankKey(collection: string) {
  return `admin:settings:${collection}:merch_rerank_strength`
}
function bm25WeightKey(collection: string) {
  return `admin:settings:${collection}:bm25_weight`
}
function keywordRerankKey(collection: string) {
  return `admin:settings:${collection}:keyword_rerank_strength`
}

// ─── Query Enhancement ─────────────────────────────────────

export async function getQueryEnhancement(collection: string): Promise<boolean> {
  try {
    const kv = getRedis()
    const stored = await kv.get<boolean>(queryEnhancementKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return true // default: enabled
}

export async function saveQueryEnhancement(
  collection: string,
  enabled: boolean
): Promise<void> {
  const kv = getRedis()
  await kv.set(queryEnhancementKey(collection), enabled)
}

// ─── Merch Re-rank Strength ────────────────────────────────

export async function getMerchRerankStrength(collection: string): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(merchRerankKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 0.25 // default
}

export async function saveMerchRerankStrength(
  collection: string,
  strength: number
): Promise<void> {
  const kv = getRedis()
  await kv.set(merchRerankKey(collection), strength)
}

// ─── BM25 Weight ─────────────────────────────────────────

export async function getBm25Weight(collection: string): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(bm25WeightKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 1.0 // default
}

export async function saveBm25Weight(collection: string, weight: number): Promise<void> {
  const kv = getRedis()
  await kv.set(bm25WeightKey(collection), weight)
}

// ─── Keyword Re-rank Strength ────────────────────────────

export async function getKeywordRerankStrength(collection: string): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(keywordRerankKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 0.3 // default
}

export async function saveKeywordRerankStrength(
  collection: string,
  strength: number
): Promise<void> {
  const kv = getRedis()
  await kv.set(keywordRerankKey(collection), strength)
}
