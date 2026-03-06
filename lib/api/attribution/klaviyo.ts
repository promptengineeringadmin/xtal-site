/**
 * Klaviyo transaction attribution adapter.
 * Queries Placed Order events and filters for XTAL-attributed orders via UTM params.
 */

export interface AttributedOrder {
  order_id: string
  order_value: number
  order_date: string
  product_id?: string
  query?: string
  profile_id?: string
}

export interface AttributionSummary {
  total_orders: number
  total_revenue: number
  orders: AttributedOrder[]
}

const KLAVIYO_API_BASE = "https://a.klaviyo.com/api"

function getUtmField(props: Record<string, unknown>, field: string): string | undefined {
  // Klaviyo stores UTM data in different locations depending on integration
  const attribution = props["$attribution"] as Record<string, unknown> | undefined
  const camelField = field.charAt(0).toUpperCase() + field.slice(1).replace(/_([a-z])/g, (_, c) => ` ${c.toUpperCase()}`)
  return (
    (attribution?.[field] as string) ||
    (props[`UTM ${camelField}`] as string) ||
    (props[field] as string) ||
    undefined
  )
}

export async function getKlaviyoAttribution(
  apiKey: string,
  metricId: string,
  startDate: string,
  endDate: string,
): Promise<AttributionSummary> {
  const filter = [
    `equals(metric_id,"${metricId}")`,
    `greater-or-equal(datetime,${startDate}T00:00:00+00:00)`,
    `less-than(datetime,${endDate}T23:59:59+00:00)`,
  ].join(",")

  const orders: AttributedOrder[] = []
  let cursor: string | null = null

  do {
    const url = new URL(`${KLAVIYO_API_BASE}/events/`)
    url.searchParams.set("filter", filter)
    url.searchParams.set("sort", "-datetime")
    if (cursor) url.searchParams.set("page[cursor]", cursor)

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: "2024-10-15",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      console.error(`Klaviyo API error: ${res.status} ${await res.text().catch(() => "")}`)
      break
    }

    const json = await res.json()
    const events = json.data || []

    for (const event of events) {
      const props = (event.attributes?.event_properties || {}) as Record<string, unknown>

      const utmSource = getUtmField(props, "utm_source")
      if (utmSource !== "xtal") continue

      orders.push({
        order_id: event.id,
        order_value: (props["$value"] as number) || (props["Value"] as number) || 0,
        order_date: event.attributes?.datetime,
        product_id: getUtmField(props, "utm_content"),
        query: getUtmField(props, "utm_term"),
        profile_id: event.relationships?.profile?.data?.id,
      })
    }

    // Pagination
    const nextLink = json.links?.next as string | undefined
    if (nextLink) {
      const match = nextLink.match(/page%5Bcursor%5D=([^&]+)|page\[cursor\]=([^&]+)/)
      cursor = match ? (match[1] || match[2]) : null
    } else {
      cursor = null
    }
  } while (cursor)

  return {
    total_orders: orders.length,
    total_revenue: orders.reduce((sum, o) => sum + o.order_value, 0),
    orders,
  }
}
