"use client"

import { useState, useEffect } from "react"
import { Save, RotateCcw } from "lucide-react"

interface PromptEditorProps {
  title: string
  prompt: string
  defaultPrompt: string
  onSave: (newPrompt: string) => Promise<void>
  saving?: boolean
  placeholder?: string
}

export default function PromptEditor({
  title,
  prompt,
  defaultPrompt,
  onSave,
  saving = false,
  placeholder,
}: PromptEditorProps) {
  const [value, setValue] = useState(prompt)
  const [confirmRestore, setConfirmRestore] = useState(false)
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
    // Reset confirm state if user clicks away
    setTimeout(() => setConfirmRestore(false), 200)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {feedback && (
          <span
            className={`text-xs font-medium ${
              feedback.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {feedback.message}
          </span>
        )}
      </div>

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
