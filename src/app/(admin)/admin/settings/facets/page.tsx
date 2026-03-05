"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, Loader2, ChevronRight, ChevronLeft, Eye, EyeOff } from "lucide-react"
import SubPageHeader from "@/components/admin/SubPageHeader"
import { useCollection } from "@/lib/admin/CollectionContext"

export default function FacetVisibilityPage() {
  const { collection } = useCollection()
  const [allFacets, setAllFacets] = useState<string[]>([])
  const [hiddenFacets, setHiddenFacets] = useState<string[]>([])
  const [selectedVisible, setSelectedVisible] = useState<Set<string>>(new Set())
  const [selectedHidden, setSelectedHidden] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [facetsRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/facets?collection=${collection}`),
        fetch(`/api/admin/settings?collection=${collection}`),
      ])

      if (!facetsRes.ok) throw new Error("Failed to load available facets")
      if (!settingsRes.ok) throw new Error("Failed to load settings")

      const facetsData = await facetsRes.json()
      const settingsData = await settingsRes.json()

      const discovered = facetsData.facets || []
      const hidden = settingsData.hidden_facets || []
      // Merge: include any hidden facets not in discovery results
      const merged = Array.from(new Set([...discovered, ...hidden])).sort()
      setAllFacets(merged)
      setHiddenFacets(hidden)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [collection])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const visibleFacets = allFacets.filter((f) => !hiddenFacets.includes(f))

  function toggleSelection(
    facet: string,
    selected: Set<string>,
    setSelected: (s: Set<string>) => void,
    e: React.MouseEvent,
  ) {
    const next = new Set(selected)
    if (e.shiftKey) {
      next.has(facet) ? next.delete(facet) : next.add(facet)
    } else {
      if (next.has(facet) && next.size === 1) {
        next.clear()
      } else {
        next.clear()
        next.add(facet)
      }
    }
    setSelected(next)
  }

  function hideSelected() {
    if (selectedVisible.size === 0) return
    setHiddenFacets((prev) => [...prev, ...Array.from(selectedVisible)])
    setSelectedVisible(new Set())
    setDirty(true)
  }

  function showSelected() {
    if (selectedHidden.size === 0) return
    setHiddenFacets((prev) => prev.filter((f) => !selectedHidden.has(f)))
    setSelectedHidden(new Set())
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/admin/settings?collection=${collection}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden_facets: hiddenFacets }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed: ${res.status}`)
      }
      setDirty(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  function formatFacetLabel(prefix: string): string {
    return prefix
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <SubPageHeader
          backHref="/admin/settings"
          backLabel="Settings"
          title="Facet Visibility"
          description="Control which filter facets appear in the search overlay."
        />
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shrink-0 ${
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
          Hidden facets saved. Changes take effect within 5 minutes (config cache).
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
            >
              <div className="h-5 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-8 bg-slate-50 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Visible facets (left) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Eye size={16} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Visible Facets
                </h2>
                <span className="ml-auto text-xs text-slate-400">
                  {visibleFacets.length}
                </span>
              </div>
              <div className="p-2 max-h-[480px] overflow-y-auto">
                {visibleFacets.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    All facets are hidden
                  </p>
                ) : (
                  visibleFacets.map((facet) => (
                    <button
                      key={facet}
                      onClick={(e) =>
                        toggleSelection(facet, selectedVisible, setSelectedVisible, e)
                      }
                      onDoubleClick={() => {
                        setHiddenFacets((prev) => [...prev, facet])
                        setSelectedVisible((prev) => {
                          const next = new Set(prev)
                          next.delete(facet)
                          return next
                        })
                        setDirty(true)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedVisible.has(facet)
                          ? "bg-xtal-navy/10 text-xtal-navy font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {formatFacetLabel(facet)}
                      <span className="text-xs text-slate-400 ml-1.5 font-normal">
                        {facet}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Arrow buttons (center) */}
            <div className="flex flex-col items-center gap-2 pt-16">
              <button
                onClick={hideSelected}
                disabled={selectedVisible.size === 0}
                title="Hide selected facets"
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600
                           hover:bg-slate-50 transition-colors
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={showSelected}
                disabled={selectedHidden.size === 0}
                title="Show selected facets"
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600
                           hover:bg-slate-50 transition-colors
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {/* Hidden facets (right) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <EyeOff size={16} className="text-red-500" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Hidden Facets
                </h2>
                <span className="ml-auto text-xs text-slate-400">
                  {hiddenFacets.length}
                </span>
              </div>
              <div className="p-2 max-h-[480px] overflow-y-auto">
                {hiddenFacets.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    All facets are visible
                  </p>
                ) : (
                  hiddenFacets.map((facet) => (
                    <button
                      key={facet}
                      onClick={(e) =>
                        toggleSelection(facet, selectedHidden, setSelectedHidden, e)
                      }
                      onDoubleClick={() => {
                        setHiddenFacets((prev) => prev.filter((f) => f !== facet))
                        setSelectedHidden((prev) => {
                          const next = new Set(prev)
                          next.delete(facet)
                          return next
                        })
                        setDirty(true)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedHidden.has(facet)
                          ? "bg-xtal-navy/10 text-xtal-navy font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {formatFacetLabel(facet)}
                      <span className="text-xs text-slate-400 ml-1.5 font-normal">
                        {facet}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Click to select, shift-click for multi-select, double-click to move instantly.
            Config cache is 5 minutes — changes may take a moment to appear on the live site.
          </p>
        </>
      )}
    </div>
  )
}
