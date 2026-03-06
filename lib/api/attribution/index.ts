/**
 * Pluggable attribution adapter registry.
 * Klaviyo is the first adapter; add GA4 or others here.
 */

import type { AttributionSummary } from "./klaviyo"
export type { AttributionSummary, AttributedOrder } from "./klaviyo"

export type AttributionProvider = "klaviyo" | "ga4"

export interface AttributionAdapter {
  provider: AttributionProvider
  getAttribution(
    apiKey: string,
    metricId: string,
    startDate: string,
    endDate: string,
  ): Promise<AttributionSummary>
}

import { getKlaviyoAttribution } from "./klaviyo"

const adapters: Record<string, AttributionAdapter> = {
  klaviyo: {
    provider: "klaviyo",
    getAttribution: getKlaviyoAttribution,
  },
}

export function getAttributionAdapter(provider: AttributionProvider): AttributionAdapter | null {
  return adapters[provider] || null
}
