"use client"

import type { RevenueImpact } from "@/lib/grader/types"
import { computeCostPerFailedSearch } from "@/lib/grader/scoring"

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
  const costPerFailed = computeCostPerFailedSearch(100)
  const formattedMonthlyLoss = new Intl.NumberFormat("en-US").format(
    Math.round(impact.monthlyLostRevenue)
  )

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-slate-200 p-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#0F172A]">
            Cost of Failed Search
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            When a search returns zero results,{" "}
            <span className="font-bold text-red-500">80% of shoppers leave</span>.
            Each failed search is a lost conversion opportunity worth{" "}
            <span className="font-semibold text-[#0F172A]">${costPerFailed.toFixed(2)}</span>{" "}
            in expected revenue.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Based on $100 AOV &middot; 5.5% searcher CVR &middot; 80% bounce on zero results
          </p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-24 bg-slate-100" />
        <div className="md:hidden w-full h-px bg-slate-100" />

        {/* Right Side */}
        <div className="flex-shrink-0 text-center md:text-right">
          <div className="text-5xl font-bold text-red-500">
            -${costPerFailed.toFixed(2)}
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">
            Per Failed Search
          </div>
          <div className="mt-3 inline-block text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
            {impact.improvementPotential} of search conversions at risk &middot; ~${formattedMonthlyLoss}/mo est. impact
          </div>
        </div>
      </div>
    </div>
  )
}
