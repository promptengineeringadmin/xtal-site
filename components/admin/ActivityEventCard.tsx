"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { MetricEvent, EventType } from "@/lib/admin/types"
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/admin/types"

interface ActivityEventCardProps {
  event: MetricEvent
}

function summarizeEvent(event: MetricEvent): string {
  const data = event.event_data as Record<string, unknown>

  switch (event.event_type) {
    case "product_fetch":
      if (data.total_products) return `${data.total_products} products imported`
      if (data.product_count) return `${data.product_count} products fetched`
      return "Product data fetched"
    case "brand_prompt_updated":
      return data.brand_prompt
        ? `Updated (${String(data.brand_prompt).length} chars)`
        : "Brand prompt updated"
    case "marketing_prompt_updated":
      return data.marketing_prompt
        ? `Updated (${String(data.marketing_prompt).length} chars)`
        : "Marketing prompt updated"
    case "aspect_generation": {
      const aspects = data.aspects_generated as string[] | undefined
      return aspects
        ? `${aspects.length} aspects for "${data.query}"`
        : `Aspects for "${data.query}"`
    }
    default:
      return event.event_type
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "string") {
    return value.length > 200 ? value.slice(0, 200) + "\u2026" : value
  }
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object") return JSON.stringify(value, null, 2)
  return String(value)
}

export default function ActivityEventCard({ event }: ActivityEventCardProps) {
  const [expanded, setExpanded] = useState(false)
  const data = event.event_data as Record<string, unknown>

  const ts = new Date(event.timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const badgeColor =
    EVENT_TYPE_COLORS[event.event_type as EventType] ??
    "bg-slate-100 text-slate-600"
  const label =
    EVENT_TYPE_LABELS[event.event_type as EventType] ?? event.event_type

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
          {ts}
        </span>
        <span
          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${badgeColor}`}
        >
          {label}
        </span>
        <span className="text-sm text-slate-600 truncate flex-1 min-w-0">
          {summarizeEvent(event)}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100">
          <dl className="mt-3 space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex gap-3">
                <dt className="text-xs font-medium text-slate-400 shrink-0 w-36 pt-0.5">
                  {key}
                </dt>
                <dd className="text-xs text-slate-700 break-words min-w-0">
                  {typeof value === "object" && !Array.isArray(value) && value !== null ? (
                    <pre className="bg-slate-50 rounded px-2 py-1 font-mono text-[11px] overflow-x-auto border border-slate-100">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    formatValue(value)
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
