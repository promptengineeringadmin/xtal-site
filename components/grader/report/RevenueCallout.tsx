"use client"

import type { RevenueImpact } from "@/lib/grader/types"
import { computeRpvLoss } from "@/lib/grader/scoring"

interface RevenueCalloutProps {
  impact: RevenueImpact
  overallScore: number
  storeName: string
}

export default function RevenueCallout({
  impact,
  overallScore,
  storeName,
}: RevenueCalloutProps) {
  const rpv = computeRpvLoss(overallScore)
  const formattedMonthlyLoss = new Intl.NumberFormat("en-US").format(
    Math.round(impact.monthlyLostRevenue)
  )

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-slate-200 p-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#0F172A]">
            Search Revenue Efficiency
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            We analyzed the conversion drop-off when users encounter{" "}
            <span className="font-bold text-red-500">Zero Result</span> pages
            compared to successful searches.
          </p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-24 bg-slate-100" />
        <div className="md:hidden w-full h-px bg-slate-100" />

        {/* Right Side */}
        <div className="flex-shrink-0 text-center md:text-right">
          <div className="text-5xl font-bold text-red-500">
            -${rpv.toFixed(2)}
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">
            Lost Revenue Per Visit (RPV)
          </div>
          <div className="mt-3 inline-block text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
            Total Est. Monthly Impact: ~${formattedMonthlyLoss}
          </div>
        </div>
      </div>
    </div>
  )
}
