"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { DailyVolume } from "@/lib/admin/types"

interface VolumeChartProps {
  data: DailyVolume[]
  loading?: boolean
}

export default function VolumeChart({ data, loading }: VolumeChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Daily Search Volume</h3>
        <div className="h-[280px] bg-slate-50 rounded animate-pulse" />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Daily Search Volume</h3>
        <div className="h-[280px] flex items-center justify-center text-sm text-slate-400">
          No data for this period
        </div>
      </div>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Daily Search Volume</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "13px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          />
          <Area
            type="monotone"
            dataKey="searches"
            stroke="#1B2D5B"
            fill="#1B2D5B"
            fillOpacity={0.12}
            strokeWidth={2}
            name="Searches"
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.08}
            strokeWidth={2}
            name="Clicks"
          />
          <Area
            type="monotone"
            dataKey="add_to_carts"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.08}
            strokeWidth={2}
            name="Add to Cart"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
