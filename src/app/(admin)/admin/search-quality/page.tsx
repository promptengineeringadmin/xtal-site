"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Loader2, Check } from "lucide-react"
import type { SearchQualityEntry } from "@/lib/search-quality/types"

function formatPrice(price: number | number[]): string {
  if (Array.isArray(price)) {
    const sorted = [...price].sort((a, b) => a - b)
    if (sorted.length === 0) return ""
    if (sorted.length === 1 || sorted[0] === sorted[sorted.length - 1]) {
      return `$${sorted[0].toFixed(2)}`
    }
    return `$${sorted[0].toFixed(2)}–$${sorted[sorted.length - 1].toFixed(2)}`
  }
  if (!price) return ""
  return `$${price.toFixed(2)}`
}

function NoteCell({ entry }: { entry: SearchQualityEntry }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(entry.note || "")
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/admin/search-quality/${entry.id}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: value }),
      })
      entry.note = value
      setEditing(false)
    } catch {
      // keep editing open on failure
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
          autoFocus
        />
        <button
          onClick={save}
          disabled={saving}
          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer text-left w-full min-h-[24px]"
    >
      {entry.note || "Add note…"}
    </button>
  )
}

export default function SearchQualityPage() {
  const [entries, setEntries] = useState<SearchQualityEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async (offset = 0) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/search-quality?limit=50&offset=${offset}`)
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const data = await res.json()
      if (offset === 0) {
        setEntries(data.entries || [])
      } else {
        setEntries((prev) => [...prev, ...(data.entries || [])])
      }
      setTotal(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Search Quality Log</h1>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {total} flagged result{total !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => fetchEntries(0)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Query</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Product</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Tags</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Score</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Collection</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 min-w-[160px]">Note</th>
              </tr>
            </thead>
            <tbody>
              {loading && entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No flagged results yet. Flag irrelevant products on the /try page to see them here.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors align-top">
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="font-medium text-slate-900 truncate">{entry.query}</div>
                      {entry.augmented_query && entry.augmented_query !== entry.query && (
                        <div className="text-xs text-slate-400 truncate mt-0.5" title={entry.augmented_query}>
                          → {entry.augmented_query}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="font-medium text-slate-800 truncate" title={entry.product_title}>
                        {entry.product_title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {entry.product_vendor}
                        {entry.product_price ? ` · ${formatPrice(entry.product_price)}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {(entry.product_tags || []).slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap"
                          >
                            {tag}
                          </span>
                        ))}
                        {(entry.product_tags || []).length > 5 && (
                          <span className="text-[10px] text-slate-400">
                            +{entry.product_tags.length - 5}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {entry.relevance_score != null ? entry.relevance_score.toFixed(3) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {entry.collection}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleDateString()}{" "}
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <NoteCell entry={entry} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {entries.length < total && (
        <div className="mt-4 text-center">
          <button
            onClick={() => fetchEntries(entries.length)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading…" : `Load more (${entries.length} of ${total})`}
          </button>
        </div>
      )}
    </div>
  )
}
