"use client"

import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  loading?: boolean
  compact?: boolean
}

export default function StatCard({ label, value, icon: Icon, loading, compact }: StatCardProps) {
  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            {loading ? (
              <div className="h-6 w-16 bg-slate-100 rounded animate-pulse mt-0.5" />
            ) : (
              <p className="text-lg font-bold text-slate-900 mt-0.5 truncate">
                {value}
              </p>
            )}
          </div>
          <div className="w-8 h-8 bg-xtal-navy/10 rounded-lg flex items-center justify-center shrink-0 ml-2">
            <Icon className="w-4 h-4 text-xtal-navy" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 mt-1 truncate">
              {value}
            </p>
          )}
        </div>
        <div className="w-10 h-10 bg-xtal-navy/10 rounded-xl flex items-center justify-center shrink-0 ml-3">
          <Icon className="w-5 h-5 text-xtal-navy" />
        </div>
      </div>
    </div>
  )
}
