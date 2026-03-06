import { getProxyTimings, type ProxyTimingRecord } from "@/lib/admin/proxy-timing"
import { getBillingEventLog, trackBillableEvent, type BillableEvent } from "./billing-usage"
import { getActiveCustomers } from "./billing-customer"

/**
 * Reconcile proxy timing logs against billing logs for the last `windowMs`.
 * Any search-full proxy timing entry without a matching billing event
 * is backfilled into the billing log.
 *
 * Returns a summary of what was found and backfilled.
 */
export async function reconcileBilling(
  windowMs: number = 24 * 60 * 60 * 1000
): Promise<ReconciliationReport> {
  const now = Date.now()
  const startMs = now - windowMs

  const customers = await getActiveCustomers()
  const collections = customers.flatMap((c) => c.collections)

  const report: ReconciliationReport = { collections: [], totalBackfilled: 0 }

  for (const collection of collections) {
    const [timings, billingEvents] = await Promise.all([
      getProxyTimings(collection, startMs, now),
      getBillingEventLog(collection, startMs, now),
    ])

    // Only reconcile search-full routes (initial searches)
    const searchFullTimings = timings.filter((t) => t.route === "search-full")
    const searchBillingEvents = billingEvents.filter((e) => e.type === "search")

    const unmatched = findUnmatched(searchFullTimings, searchBillingEvents)

    // Backfill missing events
    for (const timing of unmatched) {
      await trackBillableEvent(collection, {
        type: "search",
        query: timing.query,
        status: 200,
        latency_ms: timing.backendMs,
        result_count: undefined,
      })
    }

    report.collections.push({
      collection,
      proxyTimingCount: searchFullTimings.length,
      billingEventCount: searchBillingEvents.length,
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
