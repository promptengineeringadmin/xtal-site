"use client"

import { useState } from "react"
import { Play, Loader2, CheckCircle, XCircle } from "lucide-react"

interface BatchResult {
  url: string
  status: "pending" | "running" | "complete" | "failed"
  score?: number
  grade?: string
  error?: string
}

export default function BatchGraderForm() {
  const [urls, setUrls] = useState("")
  const [results, setResults] = useState<BatchResult[]>([])
  const [running, setRunning] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean)

    if (urlList.length === 0) return

    setRunning(true)
    const batchResults: BatchResult[] = urlList.map((url) => ({
      url,
      status: "pending",
    }))
    setResults([...batchResults])

    for (let i = 0; i < batchResults.length; i++) {
      batchResults[i].status = "running"
      setResults([...batchResults])

      try {
        // Step 1: Analyze
        const analyzeRes = await fetch("/api/grader/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-grader-source": "batch" },
          body: JSON.stringify({ url: batchResults[i].url }),
        })
        if (!analyzeRes.ok) throw new Error("Analyze failed")
        const analyzeData = await analyzeRes.json()

        // Step 2: Search
        const searchRes = await fetch("/api/grader/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: analyzeData.runId,
            storeUrl: batchResults[i].url,
            platform: analyzeData.platform,
            searchUrl: analyzeData.searchUrl,
            queries: analyzeData.queries,
          }),
        })
        if (!searchRes.ok) throw new Error("Search failed")
        const searchData = await searchRes.json()

        // Step 3: Evaluate
        const evalRes = await fetch("/api/grader/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: analyzeData.runId,
            storeUrl: batchResults[i].url,
            storeName: analyzeData.storeName,
            storeType: analyzeData.storeType,
            vertical: analyzeData.vertical,
            platform: analyzeData.platform,
            queryResults: searchData.queryResults,
          }),
        })
        if (!evalRes.ok) throw new Error("Evaluate failed")
        const evalData = await evalRes.json()

        // Step 4: Save
        const saveRes = await fetch("/api/grader/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: analyzeData.runId, ...evalData }),
        })
        if (!saveRes.ok) throw new Error("Save failed")
        const saveData = await saveRes.json()

        batchResults[i].status = "complete"
        batchResults[i].score = saveData.report.overallScore
        batchResults[i].grade = saveData.report.overallGrade
      } catch (err) {
        batchResults[i].status = "failed"
        batchResults[i].error = err instanceof Error ? err.message : "Failed"
      }

      setResults([...batchResults])
    }

    setRunning(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Batch Grade</h3>

      <form onSubmit={handleSubmit}>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="Enter one URL per line..."
          rows={5}
          disabled={running}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-xtal-navy outline-none resize-y disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={running || !urls.trim()}
          className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-xtal-navy text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Batch
            </>
          )}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-sm"
            >
              {r.status === "complete" ? (
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              ) : r.status === "failed" ? (
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
              ) : r.status === "running" ? (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
              )}

              <span className="flex-1 font-mono text-slate-700 truncate">{r.url}</span>

              {r.score !== undefined && (
                <span className="font-bold text-slate-900">
                  {r.score} ({r.grade})
                </span>
              )}

              {r.error && (
                <span className="text-xs text-red-600">{r.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
