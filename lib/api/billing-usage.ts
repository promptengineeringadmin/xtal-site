import { Redis } from "@upstash/redis"
import { getCustomer } from "./billing-customer"

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

const LOG_PREFIX = "billing:log:"
const LOG_TTL_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

export type BillableEventType = "search" | "aspect_click" | "explain" | "product_click" | "add_to_cart" | "filter"

function logKey(collection: string): string {
  return `${LOG_PREFIX}${collection}`
}

// ─── Event shape ────────────────────────────────────────────────────

export interface BillableEvent {
  type: BillableEventType
  query: string
  status: number
  latency_ms: number
  timestamp: number
  product_id?: string
  product_title?: string
  result_count?: number
  facet_filters?: Record<string, string[]>
  price_range?: { min?: number; max?: number }
}

// ─── Track (background via waitUntil) ───────────────────────────────

/**
 * Log a billable event to the sorted set.
 * Callers wrap this in waitUntil() to guarantee completion.
 */
export async function trackBillableEvent(
  collection: string,
  event: Omit<BillableEvent, "timestamp">,
  overrideTimestamp?: number
): Promise<void> {
  // Gate: skip if billing hasn't started yet for this customer
  try {
    const customer = await getCustomer(collection)
    if (customer?.billing_start) {
      const startDate = new Date(customer.billing_start)
      if (new Date() < startDate) return
    }
  } catch {
    // Redis lookup failed — proceed with tracking to avoid silent data loss
  }

  const kv = getRedis()
  const now = overrideTimestamp || Date.now()
  const cutoff = Date.now() - LOG_TTL_MS

  const logEntry: BillableEvent = { ...event, timestamp: now }

  return kv
    .pipeline()
    .zadd(logKey(collection), {
      score: now,
      member: JSON.stringify(logEntry),
    })
    .zremrangebyscore(logKey(collection), 0, cutoff)
    .exec()
    .then(() => {})
    .catch((err) => console.error("[billing] Write error:", collection, event.type, err))
}

// ─── Read: monthly counts by event type ─────────────────────────────

export interface BillingUsageSummary {
  search: number
  aspect_click: number
  explain: number
  product_click: number
  add_to_cart: number
  filter: number
}

/**
 * Get the request counts for a collection in a given month, broken down by type.
 * Counts are derived from the event log, respecting billing_start datetime.
 */
export async function getBillingUsage(
  collection: string,
  month?: string
): Promise<BillingUsageSummary> {
  try {
    const m = month || currentYearMonth()
    const [year, mon] = m.split("-").map(Number)

    // Month boundaries
    let startMs = new Date(year, mon - 1, 1).getTime()
    const endMs = new Date(year, mon, 0, 23, 59, 59, 999).getTime()

    // Respect billing_start: don't count events before it
    const customer = await getCustomer(collection)
    if (customer?.billing_start) {
      const billingStartMs = new Date(customer.billing_start).getTime()
      if (billingStartMs > endMs) {
        // Billing hasn't started in this month yet
        return { search: 0, aspect_click: 0, explain: 0, product_click: 0, add_to_cart: 0, filter: 0 }
      }
      if (billingStartMs > startMs) {
        startMs = billingStartMs
      }
    }

    const events = await getBillingEventLog(collection, startMs, endMs)

    const summary: BillingUsageSummary = { search: 0, aspect_click: 0, explain: 0, product_click: 0, add_to_cart: 0, filter: 0 }
    for (const e of events) {
      if (e.type in summary) {
        summary[e.type]++
      }
    }
    return summary
  } catch {
    return { search: 0, aspect_click: 0, explain: 0, product_click: 0, add_to_cart: 0, filter: 0 }
  }
}

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
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
