"use client"

import type { GraderReport } from "@/lib/grader/types"
import ReportHero from "./ReportHero"
import RevenueCallout from "./RevenueCallout"
import EvidenceTable from "./EvidenceTable"
import DiagnosticGrid from "./DiagnosticGrid"
import StrategyCards from "./StrategyCards"
import ReportActions from "./ReportActions"
import ReportFooter from "./ReportFooter"
import EmailGate from "../EmailGate"

interface ReportLayoutProps {
  report: GraderReport
  isTeaser?: boolean
  onUnlock?: () => void
  animate?: boolean
}

export default function ReportLayout({
  report,
  isTeaser = false,
  onUnlock,
  animate = false,
}: ReportLayoutProps) {
  return (
    <div className="text-slate-600 antialiased">
      {/* 1. Hero Header */}
      <ReportHero report={report} animate={animate} />

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20 space-y-16 pb-24">
        {/* 2. Revenue Impact */}
        <RevenueCallout
          impact={report.revenueImpact}
          overallScore={report.overallScore}
          storeName={report.storeName}
        />

        {/* 3. Evidence Table (the hook) */}
        <EvidenceTable
          report={report}
          maxRows={isTeaser ? 3 : undefined}
        />

        {/* Email Gate — shown after partial evidence in teaser mode */}
        {isTeaser && onUnlock && (
          <EmailGate
            reportId={report.id}
            storeName={report.storeName}
            score={report.overallScore}
            onUnlock={onUnlock}
          />
        )}

        {/* Below the gate — only shown when unlocked */}
        {!isTeaser && (
          <>
            {/* 4. Diagnostic Breakdown */}
            <DiagnosticGrid dimensions={report.dimensions} />

            {/* 5. Strategic Implementation */}
            {report.recommendations.length > 0 && (
              <StrategyCards recommendations={report.recommendations} />
            )}

            {/* 6. Actions */}
            <ReportActions
              reportId={report.id}
              storeName={report.storeName}
              score={report.overallScore}
            />
          </>
        )}

        {/* 7. Footer */}
        <ReportFooter
          storeName={report.storeName}
          createdAt={report.createdAt}
        />
      </div>
    </div>
  )
}
