import { Redis } from "@upstash/redis"

// ─── Redis client (lazy init, same pattern as api-usage.ts) ────────

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

const COUNTER_PREFIX = "billing:usage:"
const LOG_PREFIX = "billing:log:"
const LOG_TTL_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

export type BillableEventType = "search" | "aspect_click" | "explain"

function counterKey(
  collection: string,
  yearMonth: string,
  eventType: BillableEventType
): string {
  return `${COUNTER_PREFIX}${collection}:${yearMonth}:${eventType}`
}

function logKey(collection: string): string {
  return `${LOG_PREFIX}${collection}`
}

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

// ─── Event shape ────────────────────────────────────────────────────

export interface BillableEvent {
  type: BillableEventType
  query: string
  status: number
  latency_ms: number
  timestamp: number
  product_id?: string
  result_count?: number
}

// ─── Track (fire-and-forget) ────────────────────────────────────────

/**
 * Increment the monthly counter for this event type and log the event.
 * Caller should NOT await this — fire-and-forget.
 */
export function trackBillableEvent(
  collection: string,
  event: Omit<BillableEvent, "timestamp">
): Promise<void> {
  const kv = getRedis()
  const month = currentYearMonth()
  const now = Date.now()
  const cutoff = now - LOG_TTL_MS

  const logEntry: BillableEvent = { ...event, timestamp: now }

  return kv
    .pipeline()
    .incr(counterKey(collection, month, event.type))
    .zadd(logKey(collection), {
      score: now,
      member: JSON.stringify(logEntry),
    })
    .zremrangebyscore(logKey(collection), 0, cutoff)
    .exec()
    .then(() => {})
    .catch(() => {})
}

// ─── Read: monthly counts by event type ─────────────────────────────

export interface BillingUsageSummary {
  search: number
  aspect_click: number
  explain: number
}

/**
 * Get the request counts for a collection in a given month, broken down by type.
 */
export async function getBillingUsage(
  collection: string,
  month?: string
): Promise<BillingUsageSummary> {
  try {
    const kv = getRedis()
    const m = month || currentYearMonth()
    const [search, aspect_click, explain] = await Promise.all([
      kv.get<number>(counterKey(collection, m, "search")),
      kv.get<number>(counterKey(collection, m, "aspect_click")),
      kv.get<number>(counterKey(collection, m, "explain")),
    ])
    return {
      search: search ?? 0,
      aspect_click: aspect_click ?? 0,
      explain: explain ?? 0,
    }
  } catch {
    return { search: 0, aspect_click: 0, explain: 0 }
  }
}

// ─── Read: multi-month breakdown ────────────────────────────────────

/**
 * Get usage counts for a collection across multiple months.
 */
export async function getBillingUsageMonths(
  collection: string,
  numMonths: number = 6
): Promise<{ month: string; usage: BillingUsageSummary }[]> {
  const results: { month: string; usage: BillingUsageSummary }[] = []
  const now = new Date()

  for (let i = 0; i < numMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const usage = await getBillingUsage(collection, month)
    results.push({ month, usage })
  }

  return results.reverse()
}

// ─── Read: detailed event log ───────────────────────────────────────

/**
 * Get detailed billable event log entries within a time window.
 */
export async function getBillingEventLog(
  collection: string,
  startMs: number,
  endMs: number
): Promise<BillableEvent[]> {
  try {
    const kv = getRedis()
    const raw = await kv.zrange(logKey(collection), startMs, endMs, {
      byScore: true,
    })
    return raw.map((item) =>
      typeof item === "string"
        ? (JSON.parse(item) as BillableEvent)
        : (item as BillableEvent)
    )
  } catch {
    return []
  }
}
