import type { DimensionScore } from "@/lib/grader/types"
import DiagnosticCard from "./DiagnosticCard"

interface DiagnosticGridProps {
  dimensions: DimensionScore[]
}

export default function DiagnosticGrid({ dimensions }: DiagnosticGridProps) {
  return (
    <section className="print:break-before">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#0F172A]">
          Diagnostic Breakdown
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Based on the tests above, here is how you scored across 8 key dimensions.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {dimensions.map((d) => (
          <DiagnosticCard key={d.key} dimension={d} />
        ))}
      </div>
    </section>
  )
}
