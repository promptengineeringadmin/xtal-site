"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, RotateCcw, Loader2, CheckCircle, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import SubPageHeader from "@/components/admin/SubPageHeader"

interface PromptEntry {
  id: string
  name: string
  content: string
  enabled: boolean
  prompt_hash?: string
}

export default function ExplainPromptPage() {
  const [pool, setPool] = useState<PromptEntry[]>([])
  const [originalPool, setOriginalPool] = useState<PromptEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchPool = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/settings/explain-prompt")
      if (!res.ok) throw new Error("Failed to fetch prompts")
      const data = await res.json()
      const fetched = data.pool || []
      setPool(fetched)
      setOriginalPool(JSON.parse(JSON.stringify(fetched)))
    } catch {
      try {
        const fallback = await fetch("/api/admin/settings/explain-prompt?default=true")
        if (fallback.ok) {
          const data = await fallback.json()
          setPool(data.pool || [])
          setOriginalPool(JSON.parse(JSON.stringify(data.pool || [])))
          setError("Loaded defaults (storage unavailable)")
        } else {
          setError("Failed to load prompts")
        }
      } catch {
        setError("Failed to load prompts")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPool()
  }, [fetchPool])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/admin/settings/explain-prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool }),
      })
      if (!res.ok) throw new Error("Save failed")

      const data = await res.json()
      if (data.warning) {
        setError(data.warning)
        return
      }

      setOriginalPool(JSON.parse(JSON.stringify(pool)))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Failed to save prompts")
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreDefaults = async () => {
    try {
      const res = await fetch("/api/admin/settings/explain-prompt?default=true")
      if (!res.ok) throw new Error("Failed to fetch defaults")
      const data = await res.json()
      setPool(data.pool || [])
    } catch {
      setError("Failed to load defaults")
    }
  }

  const handleToggleEnabled = (id: string) => {
    setPool((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    )
  }

  const handleUpdateContent = (id: string, content: string) => {
    setPool((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content } : p))
    )
  }

  const handleUpdateName = (id: string, name: string) => {
    setPool((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    )
  }

  const handleRemove = (id: string) => {
    setPool((prev) => prev.filter((p) => p.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const handleAdd = () => {
    const newId = `custom-${Date.now()}`
    const newEntry: PromptEntry = {
      id: newId,
      name: "New prompt",
      content: "",
      enabled: true,
    }
    setPool((prev) => [...prev, newEntry])
    setExpandedId(newId)
  }

  const hasChanges = JSON.stringify(pool) !== JSON.stringify(originalPool)
  const enabledCount = pool.filter((p) => p.enabled).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div>
      <SubPageHeader
        backHref="/admin/settings"
        backLabel="Settings"
        title={"\u201CWhy This Result\u201D Prompt Pool"}
        description="A pool of system prompts for per-result explanations. One is randomly selected per explain call. User feedback is tagged with which prompt was used."
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
        <span>{pool.length} prompt{pool.length !== 1 ? "s" : ""} total</span>
        <span>{enabledCount} enabled</span>
        {enabledCount === 0 && (
          <span className="text-red-500 font-medium">
            No prompts enabled — backend default will be used
          </span>
        )}
      </div>

      {/* Prompt list */}
      <div className="space-y-3">
        {pool.map((entry) => (
          <div
            key={entry.id}
            className={`bg-white rounded-xl border shadow-sm transition-all ${
              entry.enabled
                ? "border-slate-200"
                : "border-slate-100 opacity-60"
            }`}
          >
            {/* Header row */}
            <div className="flex items-center gap-3 p-4">
              {/* Enable toggle */}
              <button
                onClick={() => handleToggleEnabled(entry.id)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
                  entry.enabled ? "bg-green-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    entry.enabled ? "left-5" : "left-0.5"
                  }`}
                />
              </button>

              {/* Name */}
              <input
                value={entry.name}
                onChange={(e) => handleUpdateName(entry.id, e.target.value)}
                className="flex-1 text-sm font-medium text-slate-800 bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-xtal-navy transition-colors px-1"
              />

              {/* Hash badge */}
              {entry.prompt_hash && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                  {entry.prompt_hash}
                </span>
              )}

              {/* Expand/collapse */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === entry.id ? null : entry.id)
                }
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {expandedId === entry.id ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {/* Delete */}
              <button
                onClick={() => handleRemove(entry.id)}
                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Expanded editor */}
            {expandedId === entry.id && (
              <div className="px-4 pb-4">
                <textarea
                  value={entry.content}
                  onChange={(e) =>
                    handleUpdateContent(entry.id, e.target.value)
                  }
                  rows={12}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-xtal-navy outline-none resize-y"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {entry.content.length.toLocaleString()} characters
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Prompt
          </button>
          <button
            onClick={handleRestoreDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Defaults
          </button>
        </div>

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
  )
}
