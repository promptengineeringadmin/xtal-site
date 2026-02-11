"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import type { GraderRunLog, Grade } from "@/lib/grader/types"
import PipelineStepCard, { TabView } from "./PipelineStepCard"

const STEP_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#14b8a6", "#22c55e"]

const GRADE_COLORS: Record<Grade, string> = {
  A: "bg-green-100 text-green-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-orange-100 text-orange-700",
  F: "bg-red-100 text-red-700",
}

function PreBlock({ text }: { text: string }) {
  return (
    <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-700">
      {text}
    </pre>
  )
}

function JsonBlock({ data }: { data: unknown }) {
  return <PreBlock text={JSON.stringify(data, null, 2)} />
}

export default function GraderRunDetail({ id }: { id: string }) {
  const [run, setRun] = useState<GraderRunLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRun() {
      try {
        const res = await fetch(`/api/grader/admin/runs/${id}`)
        if (!res.ok) throw new Error(`Failed to fetch run: ${res.status}`)
        const data = await res.json()
        setRun(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load run")
      } finally {
        setLoading(false)
      }
    }
    fetchRun()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {error || "Run not found"}
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/admin/grader"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-xtal-navy transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to runs
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {run.storeName || run.storeUrl}
            </h2>
            <p className="text-sm text-slate-500">{run.storeUrl}</p>
          </div>
          <div className="text-right">
            {run.report && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black text-slate-900">{run.report.overallScore}</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${GRADE_COLORS[run.report.overallGrade]}`}>
                  {run.report.overallGrade}
                </span>
              </div>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              run.status === "complete" ? "bg-green-100 text-green-700"
                : run.status === "failed" ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {run.status}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-xs text-slate-400">
          <span>Platform: <strong className="text-slate-600 uppercase">{run.platform}</strong></span>
          <span>Source: <strong className="text-slate-600">{run.source}</strong></span>
          <span>Started: <strong className="text-slate-600">{new Date(run.startedAt).toLocaleString()}</strong></span>
          {run.completedAt && (
            <span>Completed: <strong className="text-slate-600">{new Date(run.completedAt).toLocaleString()}</strong></span>
          )}
          {run.emailCaptured && (
            <span>Email: <strong className="text-green-600">{run.emailAddress || "captured"}</strong></span>
          )}
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-3">
        {/* Step 1: Platform Detection & Analysis */}
        {run.steps.analyze && (
          <PipelineStepCard
            title="Store Analysis & Query Generation"
            stepNumber={1}
            color={STEP_COLORS[0]}
            duration={run.steps.analyze.duration}
            error={run.steps.analyze.error}
          >
            <TabView
              tabs={[
                {
                  label: "Input",
                  content: (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">URL</p>
                        <p className="text-sm text-slate-700">{run.steps.analyze.input.url}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Product Samples</p>
                        <ul className="text-sm text-slate-700 list-disc list-inside">
                          {run.steps.analyze.input.productSamples.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Prompt</p>
                        <PreBlock text={run.steps.analyze.promptUsed} />
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Output",
                  content: <PreBlock text={run.steps.analyze.rawResponse} />,
                },
                {
                  label: "Parsed",
                  content: run.steps.analyze.parsed ? (
                    <JsonBlock data={run.steps.analyze.parsed} />
                  ) : (
                    <p className="text-sm text-red-600">Failed to parse</p>
                  ),
                },
              ]}
            />
          </PipelineStepCard>
        )}

        {/* Step 2: Search Queries */}
        {run.steps.search && (
          <PipelineStepCard
            title="Search Query Execution"
            stepNumber={2}
            color={STEP_COLORS[1]}
            duration={run.steps.search.totalDuration}
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                {run.steps.search.queries.length} queries executed
              </p>
              {run.steps.search.queries.map((q, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">
                      &ldquo;{q.query}&rdquo;
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{q.resultCount} results</span>
                      <span>{q.responseTime}ms</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                      {q.category}
                    </span>
                  </div>
                  {q.topResults.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      {q.topResults.slice(0, 3).map((r, j) => (
                        <div key={j} className="truncate">
                          {typeof r === "string" ? r : r.title}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.error && (
                    <p className="mt-1 text-xs text-red-600">{q.error}</p>
                  )}
                </div>
              ))}
            </div>
          </PipelineStepCard>
        )}

        {/* Step 3: Evaluation */}
        {run.steps.evaluate && (
          <PipelineStepCard
            title="AI Evaluation & Scoring"
            stepNumber={3}
            color={STEP_COLORS[2]}
            duration={run.steps.evaluate.duration}
            error={run.steps.evaluate.error}
          >
            <TabView
              tabs={[
                {
                  label: "Input",
                  content: (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Store Info</p>
                        <JsonBlock data={run.steps.evaluate.input.storeInfo} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Prompt</p>
                        <PreBlock text={run.steps.evaluate.promptUsed} />
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Output",
                  content: <PreBlock text={run.steps.evaluate.rawResponse} />,
                },
                {
                  label: "Parsed",
                  content: run.steps.evaluate.parsed ? (
                    <JsonBlock data={run.steps.evaluate.parsed} />
                  ) : (
                    <p className="text-sm text-red-600">Failed to parse</p>
                  ),
                },
              ]}
            />
          </PipelineStepCard>
        )}

        {/* Step 4: Final Report */}
        {run.report && (
          <PipelineStepCard
            title="Final Report"
            stepNumber={4}
            color={STEP_COLORS[3]}
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Summary</p>
                <p className="text-sm text-slate-700">{run.report.summary}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Dimensions</p>
                <div className="grid grid-cols-2 gap-2">
                  {run.report.dimensions.map((d) => (
                    <div
                      key={d.key}
                      className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs text-slate-700">{d.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{d.score}</span>
                        <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${GRADE_COLORS[d.grade]}`}>
                          {d.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Revenue Impact</p>
                <p className="text-sm text-slate-700">
                  ~${run.report.revenueImpact.monthlyLostRevenue.toLocaleString()}/mo lost
                  ({run.report.revenueImpact.improvementPotential} improvement potential)
                </p>
              </div>

              <div className="flex gap-3">
                <a
                  href={`/grade/${run.report.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View public report &rarr;
                </a>
              </div>
            </div>
          </PipelineStepCard>
        )}
      </div>
    </div>
  )
}
