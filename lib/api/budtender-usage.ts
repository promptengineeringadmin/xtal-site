import { Redis } from "@upstash/redis"

// ─── Redis client (lazy init, same pattern as proxy-timing.ts) ───

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

// ─── Constants ──────────────────────────────────────────────────────

const COUNTER_PREFIX = "budtender:usage:"
const LOG_PREFIX = "budtender:log:"
const LOG_TTL_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

function counterKey(client: string, yearMonth: string): string {
  return `${COUNTER_PREFIX}${client}:${yearMonth}`
}

function logKey(client: string): string {
  return `${LOG_PREFIX}${client}`
}

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

// ─── Track (fire-and-forget) ────────────────────────────────────────

export interface UsageLogEntry {
  endpoint: string
  status: number
  latency_ms: number
  timestamp: number
}

/**
 * Increment the monthly counter and log the request.
 * Caller should NOT await this — fire-and-forget.
 */
export function trackBudtenderUsage(
  client: string,
  entry: Omit<UsageLogEntry, "timestamp">
): Promise<void> {
  const kv = getRedis()
  const month = currentYearMonth()
  const now = Date.now()
  const cutoff = now - LOG_TTL_MS

  const logEntry: UsageLogEntry = { ...entry, timestamp: now }

  return kv
    .pipeline()
    .incr(counterKey(client, month))
    .zadd(logKey(client), { score: now, member: JSON.stringify(logEntry) })
    .zremrangebyscore(logKey(client), 0, cutoff)
    .exec()
    .then(() => {})
    .catch(() => {})
}

// ─── Read: monthly count ────────────────────────────────────────────

/**
 * Get the request count for a client in a given month (defaults to current).
 */
export async function getBudtenderUsage(
  client: string,
  month?: string
): Promise<number> {
  try {
    const kv = getRedis()
    const count = await kv.get<number>(counterKey(client, month || currentYearMonth()))
    return count ?? 0
  } catch {
    return 0
  }
}

// ─── Read: request log ──────────────────────────────────────────────

/**
 * Get detailed request log entries within a time window.
 */
export async function getBudtenderUsageHistory(
  client: string,
  startMs: number,
  endMs: number
): Promise<UsageLogEntry[]> {
  try {
    const kv = getRedis()
    const raw = await kv.zrange(logKey(client), startMs, endMs, { byScore: true })
    return raw.map((item) =>
      typeof item === "string"
        ? (JSON.parse(item) as UsageLogEntry)
        : (item as UsageLogEntry)
    )
  } catch {
    return []
  }
}

// ─── Read: monthly counts for multiple months ───────────────────────

/**
 * Get usage counts for a client across multiple months.
 */
export async function getBudtenderUsageMonths(
  client: string,
  numMonths: number = 3
): Promise<{ month: string; count: number }[]> {
  const results: { month: string; count: number }[] = []
  const now = new Date()

  for (let i = 0; i < numMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const count = await getBudtenderUsage(client, month)
    results.push({ month, count })
  }

  return results.reverse()
}
