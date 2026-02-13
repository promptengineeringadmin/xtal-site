"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, RotateCcw, Loader2, Clock, CheckCircle } from "lucide-react"

interface HistoryEntry {
  content: string
  timestamp: string
}

export default function ExplainPromptPage() {
  const [content, setContent] = useState("")
  const [original, setOriginal] = useState("")
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const fetchPrompt = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        "/api/admin/settings/explain-prompt?includeHistory=true"
      )
      if (!res.ok) throw new Error("Failed to fetch prompt")
      const data = await res.json()
      setContent(data.content)
      setOriginal(data.content)
      setHistory(data.history || [])
    } catch {
      // Main fetch failed — try loading just the default prompt
      try {
        const fallback = await fetch(
          "/api/admin/settings/explain-prompt?default=true"
        )
        if (fallback.ok) {
          const data = await fallback.json()
          setContent(data.content)
          setOriginal(data.content)
          setError("Loaded default prompt (storage unavailable)")
        } else {
          setError("Failed to load prompt")
        }
      } catch {
        setError("Failed to load prompt")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrompt()
  }, [fetchPrompt])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/admin/settings/explain-prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Save failed")

      const data = await res.json()

      if (data.warning) {
        setError(data.warning)
        return
      }

      setOriginal(content)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      // Refresh history
      fetchPrompt()
    } catch {
      setError("Failed to save prompt")
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = (entry: HistoryEntry) => {
    setContent(entry.content)
    setShowHistory(false)
  }

  const handleRestoreDefaults = async () => {
    try {
      const res = await fetch(
        "/api/admin/settings/explain-prompt?default=true"
      )
      if (!res.ok) throw new Error("Failed to fetch defaults")
      const data = await res.json()
      setContent(data.content)
    } catch {
      setError("Failed to load defaults")
    }
  }

  const hasChanges = content !== original

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          &ldquo;Why This Result&rdquo; Prompt
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          System prompt sent to the LLM when generating per-result explanations
          on the /try page. Controls tone, rules, and constraints.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">System Prompt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={handleRestoreDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Defaults
            </button>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-xtal-navy outline-none resize-y"
        />

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-400">
            {content.length.toLocaleString()} characters
          </span>

          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-xtal-navy text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
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
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">No history yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-slate-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <p className="text-xs text-slate-400 truncate max-w-[500px]">
                      {entry.content.slice(0, 120)}...
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(entry)}
                    className="ml-3 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors shrink-0"
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
