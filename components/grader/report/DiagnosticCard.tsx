import type { DimensionScore, Grade } from "@/lib/grader/types"

interface DiagnosticCardProps {
  dimension: DimensionScore
}

const SCORE_COLORS: Record<Grade, string> = {
  A: "text-green-500",
  B: "text-blue-500",
  C: "text-slate-600",
  D: "text-amber-500",
  F: "text-red-500",
}

const BAR_COLORS: Record<Grade, string> = {
  A: "bg-green-500",
  B: "bg-blue-500",
  C: "bg-slate-400",
  D: "bg-amber-500",
  F: "bg-red-500",
}

const BORDER_COLORS: Record<Grade, string> = {
  A: "border-green-100",
  B: "border-blue-100",
  C: "border-slate-200",
  D: "border-amber-100",
  F: "border-red-100",
}

export default function DiagnosticCard({ dimension }: DiagnosticCardProps) {
  const scoreColor = SCORE_COLORS[dimension.grade]
  const barColor = BAR_COLORS[dimension.grade]
  const borderColor = BORDER_COLORS[dimension.grade]

  return (
    <div
      className={`rounded-xl border bg-white p-6 shadow-sm print:break-inside-avoid ${borderColor}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {dimension.label}
        </h3>
        <span className={`text-xl font-bold ${scoreColor}`}>
          {dimension.score}
        </span>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${barColor}`}
          style={{ width: `${dimension.score}%` }}
        />
      </div>

      <p className="line-clamp-2 text-xs text-slate-600">
        {dimension.explanation}
      </p>
    </div>
  )
}
