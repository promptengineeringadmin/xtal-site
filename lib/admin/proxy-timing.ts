import { Redis } from "@upstash/redis"

// ─── Redis client (lazy init, same pattern as admin-settings.ts) ───

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

// ─── Types ──────────────────────────────────────────────────────────

export interface ProxyTimingRecord {
  query: string
  collection: string
  /** Epoch ms when the proxy request started */
  timestamp: number
  route: "search" | "search-full"
  /** Time spent fetching config from Redis (ms). 0 for the simple search route. */
  redisMs: number
  /** Time spent calling backend (ms) */
  backendMs: number
  /** Total proxy wall-clock time (ms) */
  totalMs: number
  aspectsFailed?: boolean
}

// ─── Constants ──────────────────────────────────────────────────────

const KEY_PREFIX = "proxy:timing:"
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function timingKey(collection: string): string {
  return `${KEY_PREFIX}${collection}`
}

// ─── Write (fire-and-forget) ────────────────────────────────────────

/**
 * Log a proxy timing record to Redis. Caller should NOT await this.
 */
export function logProxyTiming(record: ProxyTimingRecord): Promise<void> {
  const kv = getRedis()
  const key = timingKey(record.collection)
  const member = JSON.stringify(record)
  const score = record.timestamp
  const cutoff = Date.now() - TTL_MS

  return kv
    .pipeline()
    .zadd(key, { score, member })
    .zremrangebyscore(key, 0, cutoff)
    .exec()
    .then(() => {})
    .catch(() => {})
}

// ─── Read ───────────────────────────────────────────────────────────

/**
 * Retrieve proxy timing records for a collection within a time window.
 */
export async function getProxyTimings(
  collection: string,
  startMs: number,
  endMs: number,
): Promise<ProxyTimingRecord[]> {
  try {
    const kv = getRedis()
    const key = timingKey(collection)
    const raw = await kv.zrange(key, startMs, endMs, { byScore: true })
    return raw.map((item) =>
      typeof item === "string"
        ? (JSON.parse(item) as ProxyTimingRecord)
        : (item as ProxyTimingRecord),
    )
  } catch {
    return []
  }
}

// ─── Matcher ────────────────────────────────────────────────────────

/**
 * Find the best matching proxy timing record for a backend search event.
 * Matches by query (case-insensitive) within a timestamp window.
 * Mutates `consumed` set to track used indices and prevent double-matching.
 */
export function matchProxyTiming(
  timings: ProxyTimingRecord[],
  query: string,
  eventTimestampMs: number,
  consumed: Set<number>,
  windowMs = 5000,
): ProxyTimingRecord | null {
  const normalizedQuery = query.toLowerCase()
  let bestMatch: ProxyTimingRecord | null = null
  let bestIdx = -1
  let bestDelta = Infinity

  for (let i = 0; i < timings.length; i++) {
    if (consumed.has(i)) continue
    const t = timings[i]
    if (t.query !== normalizedQuery) continue
    const delta = Math.abs(eventTimestampMs - t.timestamp)
    if (delta <= windowMs && delta < bestDelta) {
      bestMatch = t
      bestIdx = i
      bestDelta = delta
    }
  }

  if (bestIdx >= 0) consumed.add(bestIdx)
  return bestMatch
}
