import { getProxyTimings, type ProxyTimingRecord } from "@/lib/admin/proxy-timing"
import { getBillingEventLog, trackBillableEvent, type BillableEvent, type BillableEventType } from "./billing-usage"
import { getActiveCustomers, getCustomer } from "./billing-customer"

/**
 * Reconcile proxy timing logs against billing logs for the last `windowMs`.
 * Covers both search-full (initial searches) and search (aspect clicks, filters) routes.
 * Backfills missing billable events (search + aspect_click) — skips filter events.
 *
 * Only reconciles events after each customer's billing_start date.
 */
export async function reconcileBilling(
  windowMs: number = 24 * 60 * 60 * 1000
): Promise<ReconciliationReport> {
  const now = Date.now()
  const windowStart = now - windowMs

  const customers = await getActiveCustomers()
  const collections = customers.flatMap((c) => c.collections)

  const report: ReconciliationReport = { collections: [], totalBackfilled: 0 }

  for (const collection of collections) {
    // Respect billing_start: never reconcile events before billing began
    const customer = await getCustomer(collection)
    const billingStartMs = customer?.billing_start
      ? new Date(customer.billing_start).getTime()
      : 0
    const startMs = Math.max(windowStart, billingStartMs)

    const [timings, billingEvents] = await Promise.all([
      getProxyTimings(collection, startMs, now),
      getBillingEventLog(collection, startMs, now),
    ])

    // Include both routes, exclude filter events from search route
    const reconcilableTimings = timings
      .filter((t) => t.timestamp >= billingStartMs)
      .filter((t) => {
        if (t.route === "search-full") return true // always initial searches
        if (t.route === "search") {
          // With eventType enrichment: skip filters
          if (t.eventType === "filter") return false
          // search or aspect_click or undefined (legacy) — reconcile
          return true
        }
        return false
      })

    // Match against ALL billable event types (search, aspect_click, etc.)
    const billableEvents = billingEvents.filter(
      (e) => e.type === "search" || e.type === "aspect_click"
    )

    const unmatched = findUnmatched(reconcilableTimings, billableEvents)

    // Backfill missing events with original timestamps
    for (const timing of unmatched) {
      // Use enriched eventType if available, otherwise default to "search"
      const type: BillableEventType =
        timing.eventType === "aspect_click" ? "aspect_click" : "search"

      await trackBillableEvent(collection, {
        type,
        query: timing.query,
        status: 200,
        latency_ms: timing.backendMs,
        result_count: undefined,
      }, timing.timestamp)
    }

    report.collections.push({
      collection,
      proxyTimingCount: reconcilableTimings.length,
      billingEventCount: billableEvents.length,
      backfilled: unmatched.length,
    })
    report.totalBackfilled += unmatched.length
  }

  return report
}

export interface ReconciliationReport {
  collections: {
    collection: string
    proxyTimingCount: number
    billingEventCount: number
    backfilled: number
  }[]
  totalBackfilled: number
}

/**
 * Find proxy timing entries that have no matching billing event.
 * Matching: same query (case-insensitive) within 5s timestamp window.
 */
function findUnmatched(
  timings: ProxyTimingRecord[],
  billingEvents: BillableEvent[]
): ProxyTimingRecord[] {
  const WINDOW_MS = 5000
  const consumed = new Set<number>()
  const unmatched: ProxyTimingRecord[] = []

  for (const timing of timings) {
    const query = timing.query.toLowerCase()
    let matched = false

    for (let i = 0; i < billingEvents.length; i++) {
      if (consumed.has(i)) continue
      const event = billingEvents[i]
      if (event.query.toLowerCase() !== query) continue
      if (Math.abs(event.timestamp - timing.timestamp) > WINDOW_MS) continue
      consumed.add(i)
      matched = true
      break
    }

    if (!matched) {
      unmatched.push(timing)
    }
  }

  return unmatched
}
