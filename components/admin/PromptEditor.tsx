"use client"

import { useState, useEffect } from "react"
import { Save, RotateCcw, Clock } from "lucide-react"

interface HistoryEntry {
  content: string
  timestamp: string
}

interface PromptEditorProps {
  title: string
  prompt: string
  defaultPrompt: string
  onSave: (newPrompt: string) => Promise<void>
  saving?: boolean
  placeholder?: string
  history?: HistoryEntry[]
  onHistoryRestore?: (content: string) => void
}

export default function PromptEditor({
  title,
  prompt,
  defaultPrompt,
  onSave,
  saving = false,
  placeholder,
  history,
  onHistoryRestore,
}: PromptEditorProps) {
  const [value, setValue] = useState(prompt)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Sync local state when the prompt prop changes externally
  useEffect(() => {
    setValue(prompt)
  }, [prompt])

  // Clear feedback after a delay
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  const isDirty = value !== prompt
  const canSave = isDirty && !saving

  const handleSave = async () => {
    try {
      await onSave(value)
      setFeedback({ type: "success", message: "Saved successfully" })
    } catch {
      setFeedback({ type: "error", message: "Failed to save" })
    }
  }

  const handleRestore = () => {
    if (!confirmRestore) {
      setConfirmRestore(true)
      return
    }
    setValue(defaultPrompt)
    setConfirmRestore(false)
  }

  const handleRestoreBlur = () => {
    setTimeout(() => setConfirmRestore(false), 200)
  }

  const handleHistoryRestore = (entry: HistoryEntry) => {
    setValue(entry.content)
    setShowHistory(false)
    if (onHistoryRestore) onHistoryRestore(entry.content)
  }

  const hasHistory = history && history.length > 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <div className="flex items-center gap-2">
          {feedback && (
            <span
              className={`text-xs font-medium ${
                feedback.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {feedback.message}
            </span>
          )}
          {hasHistory && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showHistory
                  ? "bg-xtal-navy text-white border-xtal-navy"
                  : "border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              History
            </button>
          )}
        </div>
      </div>

      {/* History panel */}
      {showHistory && hasHistory && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Version History
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history!.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-slate-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <p className="text-xs text-slate-400 truncate max-w-[500px]">
                    {entry.content.slice(0, 120)}
                    {entry.content.length > 120 ? "..." : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleHistoryRestore(entry)}
                  className="ml-3 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors shrink-0"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Textarea */}
      <div className="p-5">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={12}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-700 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-xtal-navy/20 focus:border-xtal-navy/40 transition-colors placeholder:text-slate-400 placeholder:font-sans placeholder:not-italic"
          spellCheck={false}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors bg-xtal-navy text-white hover:bg-xtal-navy/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving\u2026" : "Save"}
            </button>
            <button
              onClick={handleRestore}
              onBlur={handleRestoreBlur}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                confirmRestore
                  ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {confirmRestore ? "Are you sure?" : "Restore Default"}
            </button>
          </div>

          <span className="text-xs text-slate-400 tabular-nums">
            {value.length.toLocaleString()} chars
          </span>
        </div>
      </div>
    </div>
  )
}
