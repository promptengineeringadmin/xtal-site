"use client"

import { useState } from "react"
import type { MetricEvent, EventType } from "@/lib/admin/types"
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/admin/types"

interface EventsTableProps {
  events: MetricEvent[]
  loading?: boolean
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3">
        <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
      </td>
    </tr>
  )
}

export default function EventsTable({ events, loading }: EventsTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const toggleRow = (index: number) => {
    setExpandedRow((prev) => (prev === index ? null : index))
  }

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const summarizeData = (data: Record<string, unknown>) => {
    const json = JSON.stringify(data)
    return json.length > 80 ? json.slice(0, 80) + "\u2026" : json
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Data
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : events.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event, index) => (
                <tr
                  key={index}
                  className="group border-b border-slate-100 last:border-b-0"
                >
                  <td colSpan={3} className="p-0">
                    {/* Clickable summary row */}
                    <button
                      onClick={() => toggleRow(index)}
                      className="w-full flex items-center text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap w-48 shrink-0">
                        {formatTimestamp(event.timestamp)}
                      </span>
                      <span className="px-4 py-3 w-32 shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            EVENT_TYPE_COLORS[event.event_type as EventType] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {EVENT_TYPE_LABELS[event.event_type as EventType] ??
                            event.event_type}
                        </span>
                      </span>
                      <span className="px-4 py-3 flex-1 min-w-0 text-xs text-slate-500 font-mono truncate">
                        {summarizeData(
                          event.event_data as Record<string, unknown>
                        )}
                      </span>
                    </button>

                    {/* Expanded detail */}
                    {expandedRow === index && (
                      <div className="px-4 pb-4 pt-0">
                        <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-4 overflow-x-auto font-mono leading-relaxed border border-slate-100">
                          <code>
                            {JSON.stringify(event.event_data, null, 2)}
                          </code>
                        </pre>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
