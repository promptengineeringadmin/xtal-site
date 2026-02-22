import type { GraderReport } from "@/lib/grader/types"
import PrintHeader from "./PrintHeader"
import PrintRevenueImpact from "./PrintRevenueImpact"
import PrintEvidenceTable from "./PrintEvidenceTable"
import PrintDiagnostics from "./PrintDiagnostics"
import PrintRecommendations from "./PrintRecommendations"
import PrintFooter from "./PrintFooter"

export default function PrintReport({ report }: { report: GraderReport }) {
  return (
    <div className="max-w-[7.5in] mx-auto px-4 py-8 text-slate-900 bg-white">
      <PrintHeader report={report} />
      <PrintRevenueImpact report={report} />
      <PrintEvidenceTable report={report} />
      <PrintDiagnostics report={report} />
      <PrintRecommendations recommendations={report.recommendations} />
      <PrintFooter report={report} />
    </div>
  )
}
