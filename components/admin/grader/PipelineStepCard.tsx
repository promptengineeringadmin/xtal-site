"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Clock, AlertCircle, CheckCircle } from "lucide-react"

interface PipelineStepCardProps {
  title: string
  stepNumber: number
  color: string
  duration?: number
  error?: string
  children: React.ReactNode
}

const TAB_OPTIONS = ["Input", "Output", "Parsed"] as const
type Tab = (typeof TAB_OPTIONS)[number]

interface TabViewProps {
  tabs: { label: Tab; content: React.ReactNode }[]
}

export function TabView({ tabs }: TabViewProps) {
  const [active, setActive] = useState<Tab>(tabs[0]?.label || "Input")

  const activeTabs = tabs.filter((t) => t.content !== null)

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {activeTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActive(tab.label)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              active === tab.label
                ? "bg-xtal-navy text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 overflow-auto max-h-[400px]">
        {activeTabs.find((t) => t.label === active)?.content}
      </div>
    </div>
  )
}

export default function PipelineStepCard({
  title,
  stepNumber,
  color,
  duration,
  error,
  children,
}: PipelineStepCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 border-l-4 shadow-sm overflow-hidden animate-slideUp`}
      style={{ borderLeftColor: color }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {stepNumber}
        </span>

        <span className="flex-1 font-bold text-slate-900">{title}</span>

        {error ? (
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        ) : duration !== undefined ? (
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
        ) : null}

        {duration !== undefined && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {(duration / 1000).toFixed(1)}s
          </span>
        )}

        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
