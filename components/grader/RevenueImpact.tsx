"use client"

import { TrendingDown } from "lucide-react"
import type { RevenueImpact as RevenueImpactType } from "@/lib/grader/types"

interface RevenueImpactProps {
  impact: RevenueImpactType
  overallScore: number
}

export default function RevenueImpact({ impact, overallScore }: RevenueImpactProps) {
  const isGood = overallScore >= 85

  return (
    <div className={`rounded-2xl p-8 shadow-xtal border ${isGood ? "bg-green-50 border-green-200" : "bg-white border-slate-100"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isGood ? "bg-green-100" : "bg-red-100"}`}>
          <TrendingDown className={`w-6 h-6 ${isGood ? "text-green-600" : "text-red-600"}`} />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-xtal-navy mb-1">
            Estimated Revenue Impact
          </h3>

          {isGood ? (
            <p className="text-sm text-green-700">
              Your search performs well. Minimal revenue leakage detected.
            </p>
          ) : (
            <>
              <p className="text-3xl font-black text-red-600 mb-1">
                ~${impact.monthlyLostRevenue.toLocaleString()}/mo
              </p>
              <p className="text-sm text-slate-500">
                Based on industry benchmarks, stores with a search score of{" "}
                {overallScore}/100 lose approximately {impact.improvementPotential}{" "}
                of search-driven revenue.{" "}
                <span className="font-medium text-slate-700">
                  That&apos;s ~${impact.annualLostRevenue.toLocaleString()} per year.
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
