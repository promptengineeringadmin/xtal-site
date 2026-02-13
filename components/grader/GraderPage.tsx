"use client"

import { useState, useCallback } from "react"
import { trackEvent } from "@/lib/gtag"
import type { GraderReport, TestQuery, QueryResult, Platform } from "@/lib/grader/types"

import UrlInput from "./UrlInput"
import GradingProgress, { type GradingStep } from "./GradingProgress"
import ReportLayout from "./report/ReportLayout"

type PageState =
  | { step: "input" }
  | { step: "grading"; gradingStep: GradingStep; queryProgress?: { current: number; total: number; query: string }; storeName?: string; platform?: string }
  | { step: "teaser"; report: GraderReport }
  | { step: "unlocked"; report: GraderReport }
  | { step: "error"; message: string }

export default function GraderPage() {
  const [state, setState] = useState<PageState>({ step: "input" })

  const startGrading = useCallback(async (url: string) => {
    setState({
      step: "grading",
      gradingStep: "detecting",
    })

    trackEvent("grader_start", { url })

    try {
      // ── Step 1: Analyze ──────────────────────────────────
      setState((s) => s.step === "grading" ? { ...s, gradingStep: "detecting" } : s)

      const analyzeRes = await fetch("/api/grader/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => ({}))
        throw new Error(err.error || `Analysis failed (${analyzeRes.status})`)
      }

      const analyzeData = await analyzeRes.json() as {
        runId: string
        platform: Platform
        storeName: string
        storeType: string
        vertical: string
        searchUrl: string | null
        queries: TestQuery[]
        searchProvider?: string
      }

      setState({
        step: "grading",
        gradingStep: "searching",
        storeName: analyzeData.storeName,
        platform: analyzeData.platform,
        queryProgress: { current: 0, total: analyzeData.queries.length, query: analyzeData.queries[0]?.text || "" },
      })

      // ── Step 2: Search ───────────────────────────────────
      const searchRes = await fetch("/api/grader/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: analyzeData.runId,
          storeUrl: url,
          platform: analyzeData.platform,
          searchUrl: analyzeData.searchUrl,
          queries: analyzeData.queries,
        }),
      })

      if (!searchRes.ok) {
        const err = await searchRes.json().catch(() => ({}))
        throw new Error(err.error || `Search failed (${searchRes.status})`)
      }

      const searchData = await searchRes.json() as {
        queryResults: QueryResult[]
      }

      // ── Step 3: Evaluate ─────────────────────────────────
      setState((s) => s.step === "grading" ? { ...s, gradingStep: "evaluating" } : s)

      const evalRes = await fetch("/api/grader/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: analyzeData.runId,
          storeUrl: url,
          storeName: analyzeData.storeName,
          storeType: analyzeData.storeType,
          vertical: analyzeData.vertical,
          platform: analyzeData.platform,
          queryResults: searchData.queryResults,
          searchProvider: analyzeData.searchProvider,
        }),
      })

      if (!evalRes.ok) {
        const err = await evalRes.json().catch(() => ({}))
        throw new Error(err.error || `Evaluation failed (${evalRes.status})`)
      }

      const evalData = await evalRes.json()

      // ── Step 4: Save ─────────────────────────────────────
      setState((s) => s.step === "grading" ? { ...s, gradingStep: "saving" } : s)

      const saveRes = await fetch("/api/grader/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: analyzeData.runId,
          ...evalData,
          queriesTested: analyzeData.queries,
        }),
      })

      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}))
        throw new Error(err.error || `Save failed (${saveRes.status})`)
      }

      const saveData = await saveRes.json() as { report: GraderReport }

      trackEvent("grader_complete", {
        score: String(saveData.report.overallScore),
        grade: saveData.report.overallGrade,
        storeName: saveData.report.storeName,
      })

      // Show teaser (gated) view
      setState({ step: "teaser", report: saveData.report })

    } catch (error) {
      console.error("Grading failed:", error)
      setState({
        step: "error",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    }
  }, [])

  // ── Render based on state ──────────────────────────────────

  if (state.step === "input") {
    return (
      <div className="py-16 px-6">
        <UrlInput onSubmit={startGrading} />
      </div>
    )
  }

  if (state.step === "grading") {
    return (
      <div className="px-6">
        <GradingProgress
          step={state.gradingStep}
          queryProgress={state.queryProgress}
          storeName={state.storeName}
          platform={state.platform}
        />
      </div>
    )
  }

  if (state.step === "error") {
    return (
      <div className="py-16 px-6 max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-6">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Grading Failed</h3>
          <p className="text-sm text-red-600">{state.message}</p>
        </div>
        <button
          onClick={() => setState({ step: "input" })}
          className="px-6 py-3 bg-xtal-navy text-white font-bold rounded-xl hover:opacity-90 transition-all"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Teaser or unlocked report
  const report = state.report

  return (
    <div>
      <ReportLayout
        report={report}
        isTeaser={state.step === "teaser"}
        onUnlock={() => setState({ step: "unlocked", report })}
        animate={true}
      />

      {/* Grade another store */}
      <div className="text-center py-8 print:hidden">
        <button
          onClick={() => setState({ step: "input" })}
          className="px-6 py-3 text-sm font-medium text-slate-500 hover:text-[#0F172A] transition-colors"
        >
          Grade another store &rarr;
        </button>
      </div>
    </div>
  )
}
