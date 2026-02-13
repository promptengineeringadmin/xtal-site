import type { MetricEvent, SearchEventData } from "./types"

export interface CorrelatedActivity {
  searchEvent: MetricEvent
  aspectEvent?: MetricEvent
  timestamp: string
}

export interface CorrelatedResult {
  /** Search events paired with their aspect_generation events */
  searchActivities: CorrelatedActivity[]
  /** Non-search events (product_fetch, prompt updates, orphan aspects) */
  otherEvents: MetricEvent[]
}

interface AspectEventData {
  query: string
  aspects_generated: string[]
}

/**
 * Correlate aspect_generation events with their parent search_request events.
 * Match by query text (case-insensitive) + timestamp within 5 seconds.
 * Consumed aspect events are removed from the timeline.
 */
export function correlateEvents(events: MetricEvent[]): CorrelatedResult {
  const searchActivities: CorrelatedActivity[] = []
  const otherEvents: MetricEvent[] = []
  const consumedAspectIndices = new Set<number>()

  // Index aspect events for fast lookup
  const aspectEvents: { event: MetricEvent; index: number; query: string; ts: number }[] = []
  events.forEach((e, i) => {
    if (e.event_type === "aspect_generation") {
      const data = e.event_data as unknown as AspectEventData
      aspectEvents.push({
        event: e,
        index: i,
        query: (data.query ?? "").toLowerCase(),
        ts: new Date(e.timestamp).getTime(),
      })
    }
  })

  // For each search_request, find the closest matching aspect_generation
  events.forEach((event) => {
    if (event.event_type === "search_request") {
      const searchData = event.event_data as SearchEventData
      const searchQuery = (searchData.user_query ?? "").toLowerCase()
      const searchTs = new Date(event.timestamp).getTime()

      let bestMatch: (typeof aspectEvents)[number] | null = null
      let bestDelta = Infinity

      for (const aspect of aspectEvents) {
        if (consumedAspectIndices.has(aspect.index)) continue
        if (aspect.query !== searchQuery) continue
        const delta = Math.abs(searchTs - aspect.ts)
        if (delta <= 5000 && delta < bestDelta) {
          bestMatch = aspect
          bestDelta = delta
        }
      }

      if (bestMatch) {
        consumedAspectIndices.add(bestMatch.index)
      }

      searchActivities.push({
        searchEvent: event,
        aspectEvent: bestMatch?.event,
        timestamp: event.timestamp,
      })
    }
  })

  // Collect non-search, non-consumed events
  events.forEach((event, i) => {
    if (event.event_type === "search_request") return
    if (event.event_type === "aspect_generation" && consumedAspectIndices.has(i)) return
    otherEvents.push(event)
  })

  return { searchActivities, otherEvents }
}

/**
 * Merge search activities and other events into a single chronological list.
 * Returns items tagged with their type for rendering.
 */
export type TimelineItem =
  | { kind: "search"; activity: CorrelatedActivity }
  | { kind: "event"; event: MetricEvent }

export function buildTimeline(result: CorrelatedResult): TimelineItem[] {
  const items: TimelineItem[] = []

  for (const activity of result.searchActivities) {
    items.push({ kind: "search", activity })
  }
  for (const event of result.otherEvents) {
    items.push({ kind: "event", event })
  }

  // Sort newest first
  items.sort((a, b) => {
    const tsA = a.kind === "search" ? a.activity.timestamp : a.event.timestamp
    const tsB = b.kind === "search" ? b.activity.timestamp : b.event.timestamp
    return new Date(tsB).getTime() - new Date(tsA).getTime()
  })

  return items
}
