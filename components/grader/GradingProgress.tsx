"use client"

import { Sparkles } from "lucide-react"

export type GradingStep =
  | "detecting"
  | "generating"
  | "searching"
  | "evaluating"
  | "saving"
  | "complete"

interface GradingProgressProps {
  step: GradingStep
  queryProgress?: { current: number; total: number; query: string }
  storeName?: string
  platform?: string
}

const STEPS: { key: GradingStep; label: string }[] = [
  { key: "detecting", label: "Detecting platform" },
  { key: "generating", label: "Generating test queries" },
  { key: "searching", label: "Running search tests" },
  { key: "evaluating", label: "Scoring results" },
  { key: "saving", label: "Building report" },
]

export default function GradingProgress({
  step,
  queryProgress,
  storeName,
  platform,
}: GradingProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="w-full max-w-xl mx-auto py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-600 text-xs font-bold tracking-widest uppercase mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
          Analyzing
        </div>
        <h2 className="text-2xl font-bold text-xtal-navy">
          {storeName ? `Grading ${storeName}` : "Analyzing your store..."}
        </h2>
        {platform && (
          <p className="text-sm text-slate-400 mt-1 capitalize">
            Platform: {platform}
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((s, i) => {
          const isComplete = i < currentIndex || step === "complete"
          const isCurrent = i === currentIndex && step !== "complete"
          const isPending = i > currentIndex

          return (
            <div
              key={s.key}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 ${
                isComplete
                  ? "bg-green-50 border border-green-200"
                  : isCurrent
                    ? "bg-white border border-xtal-navy/20 shadow-sm"
                    : "bg-slate-50 border border-slate-100"
              }`}
            >
              {/* Status indicator */}
              <div className="shrink-0">
                {isComplete ? (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-xtal-navy flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isComplete
                      ? "text-green-700"
                      : isCurrent
                        ? "text-xtal-navy"
                        : "text-slate-400"
                  }`}
                >
                  {s.label}
                  {isCurrent && s.key === "searching" && queryProgress && (
                    <span className="ml-2 text-slate-400">
                      ({queryProgress.current + 1}/{queryProgress.total})
                    </span>
                  )}
                </p>
                {isCurrent && s.key === "searching" && queryProgress && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    &ldquo;{queryProgress.query}&rdquo;
                  </p>
                )}
              </div>

              {/* Loading indicator for current step */}
              {isCurrent && (
                <div className="shrink-0">
                  <div className="w-5 h-5 border-2 border-xtal-navy/20 border-t-xtal-navy rounded-full animate-spin" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
