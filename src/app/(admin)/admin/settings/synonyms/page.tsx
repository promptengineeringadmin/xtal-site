"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, X, Save, Loader2 } from "lucide-react"
import { formatFacetValue } from "@/lib/facet-utils"

export default function SynonymsPage() {
  const [groups, setGroups] = useState<string[][]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // New group form
  const [newCanonical, setNewCanonical] = useState("")
  const [newAliases, setNewAliases] = useState("")

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/synonyms")
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setGroups(data.groups || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load synonyms")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch("/api/admin/synonyms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed: ${res.status}`)
      }
      setDirty(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  function addGroup() {
    const canonical = newCanonical.trim().toLowerCase().replace(/\s+/g, "-")
    if (!canonical) return

    const aliases = newAliases
      .split(",")
      .map((a) => a.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter((a) => a && a !== canonical)

    if (aliases.length === 0) return

    setGroups((prev) => [...prev, [canonical, ...aliases]])
    setNewCanonical("")
    setNewAliases("")
    setDirty(true)
  }

  function removeGroup(index: number) {
    setGroups((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
  }

  function removeAlias(groupIndex: number, aliasIndex: number) {
    setGroups((prev) =>
      prev
        .map((group, gi) => {
          if (gi !== groupIndex) return group
          // aliasIndex is offset by 1 (0 = canonical)
          return group.filter((_, vi) => vi !== aliasIndex)
        })
        .filter((group) => group.length >= 2) // remove group if only canonical remains
    )
    setDirty(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Facet Synonyms
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Merge duplicate facet values so they appear as one filter. The first
            value is the canonical name shown to users.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            dirty
              ? "bg-xtal-navy text-white hover:bg-xtal-navy/90"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          Synonyms saved. Changes will apply on next search.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"
            >
              <div className="h-5 bg-slate-100 rounded w-1/3" />
              <div className="h-4 bg-slate-100 rounded w-2/3 mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Existing synonym groups */}
          <div className="space-y-3 mb-6">
            {groups.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-500">
                  No synonym groups defined yet. Add one below.
                </p>
              </div>
            )}

            {groups.map((group, gi) => {
              const canonical = group[0]
              const aliases = group.slice(1)

              return (
                <div
                  key={gi}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {formatFacetValue(canonical)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-xtal-navy/10 text-xtal-navy font-medium">
                        canonical
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aliases.map((alias, ai) => (
                        <span
                          key={ai}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600"
                        >
                          {formatFacetValue(alias)}
                          <button
                            onClick={() => removeAlias(gi, ai + 1)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeGroup(gi)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Add new group form */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Add Synonym Group
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">
                  Canonical value
                </label>
                <input
                  type="text"
                  value={newCanonical}
                  onChange={(e) => setNewCanonical(e.target.value)}
                  placeholder="e.g. earbuds"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-xtal-navy/20 focus:border-xtal-navy/40"
                />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs text-slate-500 mb-1">
                  Aliases (comma-separated)
                </label>
                <input
                  type="text"
                  value={newAliases}
                  onChange={(e) => setNewAliases(e.target.value)}
                  placeholder="e.g. headphones-earbuds, ear-buds"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addGroup()
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-xtal-navy/20 focus:border-xtal-navy/40"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addGroup}
                  disabled={!newCanonical.trim() || !newAliases.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg
                             bg-xtal-navy text-white hover:bg-xtal-navy/90 transition-colors
                             disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
