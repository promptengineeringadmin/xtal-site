import type { GraderReport } from "@/lib/grader/types"
import { computeCostPerFailedSearch } from "@/lib/grader/scoring"

export default function PrintRevenueImpact({ report }: { report: GraderReport }) {
  const costPerFailed = computeCostPerFailedSearch()
  const { monthlyLostRevenue, annualLostRevenue, improvementPotential } = report.revenueImpact

  return (
    <div className="mb-8 break-inside-avoid">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Cost of Failed Search</h2>

      <div className="border border-slate-200 rounded-lg p-5">
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Cost Per Failed Search</div>
            <div className="text-2xl font-bold text-red-600">${costPerFailed.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Monthly Impact</div>
            <div className="text-2xl font-bold text-slate-900">~${monthlyLostRevenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Annual Impact</div>
            <div className="text-2xl font-bold text-slate-900">~${annualLostRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
          <strong>{improvementPotential}</strong> of search conversions estimated at risk.
          Based on industry benchmarks: 30% search usage rate, 5.5% searcher conversion rate, $95 avg order value, 80% bounce on zero results.
        </div>
      </div>
    </div>
  )
}
