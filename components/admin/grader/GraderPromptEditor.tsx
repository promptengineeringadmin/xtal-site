"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, RotateCcw, Loader2, Clock, CheckCircle } from "lucide-react"
import type { PromptHistoryEntry } from "@/lib/grader/types"

type PromptKey = "analyze" | "evaluate"

interface PromptState {
  content: string
  original: string
  saving: boolean
  saved: boolean
}

export default function GraderPromptEditor() {
  const [activeTab, setActiveTab] = useState<PromptKey>("analyze")
  const [prompts, setPrompts] = useState<Record<PromptKey, PromptState>>({
    analyze: { content: "", original: "", saving: false, saved: false },
    evaluate: { content: "", original: "", saving: false, saved: false },
  })
  const [history, setHistory] = useState<Record<PromptKey, PromptHistoryEntry[]>>({
    analyze: [],
    evaluate: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [analyzeRes, evaluateRes] = await Promise.all([
        fetch("/api/grader/admin/prompts?key=analyze&includeHistory=true"),
        fetch("/api/grader/admin/prompts?key=evaluate&includeHistory=true"),
      ])

      if (!analyzeRes.ok || !evaluateRes.ok) throw new Error("Failed to fetch prompts")

      const analyzeData = await analyzeRes.json()
      const evaluateData = await evaluateRes.json()

      setPrompts({
        analyze: { content: analyzeData.content, original: analyzeData.content, saving: false, saved: false },
        evaluate: { content: evaluateData.content, original: evaluateData.content, saving: false, saved: false },
      })

      setHistory({
        analyze: analyzeData.history || [],
        evaluate: evaluateData.history || [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prompts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const handleSave = async (key: PromptKey) => {
    setPrompts((prev) => ({
      ...prev,
      [key]: { ...prev[key], saving: true, saved: false },
    }))

    try {
      const res = await fetch("/api/grader/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, content: prompts[key].content }),
      })

      if (!res.ok) throw new Error("Save failed")

      setPrompts((prev) => ({
        ...prev,
        [key]: { ...prev[key], original: prev[key].content, saving: false, saved: true },
      }))

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setPrompts((prev) => ({
          ...prev,
          [key]: { ...prev[key], saved: false },
        }))
      }, 2000)

      // Refresh history
      fetchPrompts()
    } catch {
      setPrompts((prev) => ({
        ...prev,
        [key]: { ...prev[key], saving: false },
      }))
      setError("Failed to save prompt")
    }
  }

  const handleRestore = (key: PromptKey, content: string) => {
    setPrompts((prev) => ({
      ...prev,
      [key]: { ...prev[key], content },
    }))
    setShowHistory(false)
  }

  const handleRestoreDefaults = async (key: PromptKey) => {
    try {
      const res = await fetch(`/api/grader/admin/prompts?key=${key}&default=true`)
      if (!res.ok) throw new Error("Failed to fetch defaults")
      const data = await res.json()

      setPrompts((prev) => ({
        ...prev,
        [key]: { ...prev[key], content: data.content },
      }))
    } catch {
      setError("Failed to load defaults")
    }
  }

  const current = prompts[activeTab]
  const hasChanges = current.content !== current.original

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(["analyze", "evaluate"] as PromptKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              activeTab === key
                ? "bg-xtal-navy text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {key} Prompt
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 capitalize">{activeTab} Prompt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={() => handleRestoreDefaults(activeTab)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Defaults
            </button>
          </div>
        </div>

        <textarea
          value={current.content}
          onChange={(e) =>
            setPrompts((prev) => ({
              ...prev,
              [activeTab]: { ...prev[activeTab], content: e.target.value },
            }))
          }
          rows={20}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-xtal-navy outline-none resize-y"
        />

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-400">
            {current.content.length.toLocaleString()} characters
          </span>

          <button
            onClick={() => handleSave(activeTab)}
            disabled={!hasChanges || current.saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-xtal-navy text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {current.saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : current.saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h4 className="font-bold text-slate-900 mb-4">Version History</h4>
          {history[activeTab].length === 0 ? (
            <p className="text-sm text-slate-400">No history yet.</p>
          ) : (
            <div className="space-y-2">
              {history[activeTab].map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <p className="text-xs text-slate-400 truncate max-w-[400px]">
                      {entry.content.slice(0, 100)}...
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(activeTab, entry.content)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
