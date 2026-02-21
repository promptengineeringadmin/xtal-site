import type { GraderReport } from "@/lib/grader/types"

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-blue-500",
  C: "bg-amber-500",
  D: "bg-orange-500",
  F: "bg-red-500",
}

const SCORE_TEXT_COLORS: Record<string, string> = {
  A: "text-green-600",
  B: "text-blue-600",
  C: "text-amber-600",
  D: "text-orange-600",
  F: "text-red-600",
}

const SEARCH_PROVIDER_LABELS: Record<string, string> = {
  "shopify-native": "Shopify Native",
  algolia: "Algolia",
  searchspring: "SearchSpring",
  klevu: "Klevu",
  bloomreach: "Bloomreach",
  constructor: "Constructor.io",
  loop54: "Loop54",
  doofinder: "Doofinder",
  swiftype: "Swiftype",
  elasticsearch: "Elasticsearch",
  unknown: "Unknown",
}

export default function PrintHeader({ report }: { report: GraderReport }) {
  const date = new Date(report.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const providerLabel =
    SEARCH_PROVIDER_LABELS[report.searchProvider ?? "unknown"] ??
    report.searchProvider ??
    "Unknown"

  return (
    <div className="break-after-page">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">XTAL Search</div>
            <div className="text-xs text-slate-500">Site Search Audit</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-600">Prepared for <span className="font-semibold text-slate-900">{report.storeName}</span></div>
          <div className="text-xs text-slate-400">{date}</div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Search Health Report</h1>
      <p className="text-sm text-slate-500 mb-8">{report.storeUrl}</p>

      {/* Score + Grade */}
      <div className="flex items-center gap-6 mb-8">
        <div className="flex items-baseline gap-2">
          <span className={`text-6xl font-bold ${SCORE_TEXT_COLORS[report.overallGrade] || "text-slate-900"}`}>
            {report.overallScore}
          </span>
          <span className="text-xl text-slate-400">/100</span>
        </div>
        <div className={`${GRADE_COLORS[report.overallGrade] || "bg-slate-500"} text-white text-3xl font-bold w-16 h-16 rounded-xl flex items-center justify-center`} style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
          {report.overallGrade}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 rounded-lg p-5 mb-6" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <p className="text-sm text-slate-700 leading-relaxed">{report.summary}</p>
      </div>

      {/* Metadata pills */}
      <div className="flex gap-3 text-xs">
        <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
          {report.platform.charAt(0).toUpperCase() + report.platform.slice(1)}
        </span>
        <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
          {report.vertical}
        </span>
        <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
          Search: {providerLabel}
        </span>
      </div>
    </div>
  )
}
