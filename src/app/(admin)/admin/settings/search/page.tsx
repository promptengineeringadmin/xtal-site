"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PromptEditor from "@/components/admin/PromptEditor"
import SubPageHeader from "@/components/admin/SubPageHeader"
import { useCollection } from "@/lib/admin/CollectionContext"
import type { PromptDefaults } from "@/lib/admin/types"
import type { OptimizationResult, ProductResult } from "@/lib/xtal-types"
import { ChevronDown, ChevronRight, Check, X } from "lucide-react"

interface HistoryEntry {
  content: string
  timestamp: string
}

interface OptimizationEvent {
  id: string
  timestamp: string
  event_data: {
    target: string
    queries_tested: number
    configs_tested: number
    optimization_time: number
    reasoning: string
    current_config: Record<string, unknown>
    recommended_config: Record<string, unknown>
    all_configs: Record<string, unknown>[]
    weirdest_results: { current: { query: string; product: string; reason: string }; recommended: { query: string; product: string; reason: string } } | null
    sample_comparisons: { query: string; current_top_5: string[]; recommended_top_5: string[]; current_results: ProductResult[]; recommended_results: ProductResult[] }[]
    test_queries: string[]
    applied: boolean
    applied_at?: string
    per_query_rankings?: Record<string, number[]>
  }
}

export default function SearchTuningPage() {
  const { collection } = useCollection()
  const [marketingPrompt, setMarketingPrompt] = useState("")
  const [marketingHistory, setMarketingHistory] = useState<HistoryEntry[]>([])
  const [defaults, setDefaults] = useState<PromptDefaults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingMarketing, setSavingMarketing] = useState(false)
  const [queryEnhancementEnabled, setQueryEnhancementEnabled] = useState(true)
  const [merchRerank, setMerchRerank] = useState(0.25)
  const [bm25Weight, setBm25Weight] = useState(1.0)
  const [keywordRerank, setKeywordRerank] = useState(0.3)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null)
  const [optimizeError, setOptimizeError] = useState<string | null>(null)
  const [optimizeStage, setOptimizeStage] = useState("")
  const [optimizeElapsed, setOptimizeElapsed] = useState(0)
  const [expandedComparisons, setExpandedComparisons] = useState<Set<number>>(new Set())
  const [storeType, setStoreType] = useState("online retailer")
  const [storeTypeSaving, setStoreTypeSaving] = useState(false)
  const [aspectsEnabled, setAspectsEnabled] = useState(true)
  const [resultsPerPage, setResultsPerPage] = useState(48)
  const [aspectsPrompt, setAspectsPrompt] = useState("")
  const [aspectsHistory, setAspectsHistory] = useState<HistoryEntry[]>([])
  const [aspectsDefault, setAspectsDefault] = useState("")
  const [savingAspects, setSavingAspects] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyEvents, setHistoryEvents] = useState<OptimizationEvent[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedHistoryRow, setExpandedHistoryRow] = useState<string | null>(null)
  const [resultsPerPageSaving, setResultsPerPageSaving] = useState(false)
  const storeTypeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rerankDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bm25DebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keywordDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Reset stale state from previous collection
    setError(null)
    setWarning(null)
    setOptimizationResult(null)
    setOptimizeError(null)
    setHistoryEvents([])
    setHistoryOpen(false)
    setExpandedHistoryRow(null)
    setStoreType("online retailer")
    setResultsPerPage(48)
    setAspectsPrompt("")
    setAspectsHistory([])

    setLoading(true)
    async function load() {
      try {
        const cp = `?collection=${encodeURIComponent(collection)}`
        const [marketingRes, defaultsRes, settingsRes, aspectsRes] = await Promise.all([
          fetch(`/api/admin/prompts/marketing${cp}&includeHistory=true`),
          fetch(`/api/admin/prompts/defaults${cp}`),
          fetch(`/api/admin/settings${cp}`),
          fetch(`/api/admin/settings/aspects-prompt${cp}&includeHistory=true`),
        ])

        let loadedDefaults: PromptDefaults | null = null
        if (defaultsRes.ok) {
          loadedDefaults = await defaultsRes.json()
          setDefaults(loadedDefaults)
        }

        const warnings: string[] = []

        if (marketingRes.ok) {
          const data = await marketingRes.json()
          setMarketingPrompt(data.marketing_prompt ?? "")
          setMarketingHistory(data.history ?? [])
        } else {
          if (loadedDefaults) {
            setMarketingPrompt(loadedDefaults.default_marketing_prompt ?? "")
          }
          warnings.push("Marketing prompt failed to load")
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setQueryEnhancementEnabled(data.query_enhancement_enabled ?? true)
          setMerchRerank(data.merch_rerank_strength ?? 0.25)
          setBm25Weight(data.bm25_weight ?? 1.0)
          setKeywordRerank(data.keyword_rerank_strength ?? 0.3)
          if (data.store_type) setStoreType(data.store_type)
          setAspectsEnabled(data.aspects_enabled ?? true)
          setResultsPerPage(data.results_per_page ?? 48)
          if (data._source === "redis_fallback") {
            warnings.push(
              "Search backend unreachable — settings loaded from local cache"
            )
          }
        }

        if (aspectsRes.ok) {
          const data = await aspectsRes.json()
          setAspectsPrompt(data.content ?? "")
          setAspectsDefault(data.defaultContent ?? "")
          setAspectsHistory(data.history ?? [])
        } else {
          warnings.push("Aspects prompt failed to load")
        }

        if (warnings.length > 0) {
          setWarning(warnings.join(". "))
        } else {
          setWarning(null)
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load settings"
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [collection])

  async function saveMarketing(newPrompt: string) {
    setSavingMarketing(true)
    try {
      const res = await fetch(
        `/api/admin/prompts/marketing?collection=${encodeURIComponent(collection)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketing_prompt: newPrompt }),
        }
      )
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const data = await res.json()
      setMarketingPrompt(newPrompt)

      if (data._source === "redis_only" || data._source === "redis") {
        setWarning(data.backendWarning || "Prompt saved locally — search backend sync failed")
      } else {
        setWarning(null)
      }

      // Refresh history
      try {
        const histRes = await fetch(
          `/api/admin/prompts/marketing?collection=${encodeURIComponent(collection)}&includeHistory=true`
        )
        if (histRes.ok) {
          const histData = await histRes.json()
          setMarketingHistory(histData.history ?? [])
        }
      } catch {
        // History refresh failed — not critical
      }
    } finally {
      setSavingMarketing(false)
    }
  }

  const saveMerchRerank = useCallback(
    async (value: number) => {
      setSettingsSaving(true)
      try {
        const res = await fetch(
          `/api/admin/settings?collection=${encodeURIComponent(collection)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ merch_rerank_strength: value }),
          }
        )
        if (!res.ok) throw new Error(`Save failed: ${res.status}`)
        const data = await res.json()
        if (data._source === "redis_fallback") {
          setWarning(data.backendWarning || "Settings saved locally — search backend unreachable")
        }
      } catch (err) {
        console.error("Failed to save merch rerank strength:", err)
      } finally {
        setSettingsSaving(false)
      }
    },
    [collection]
  )

  function handleMerchRerankChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value)
    setMerchRerank(value)
    if (rerankDebounceRef.current) clearTimeout(rerankDebounceRef.current)
    rerankDebounceRef.current = setTimeout(() => saveMerchRerank(value), 500)
  }

  const saveBm25 = useCallback(
    async (value: number) => {
      setSettingsSaving(true)
      try {
        const res = await fetch(
          `/api/admin/settings?collection=${encodeURIComponent(collection)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bm25_weight: value }),
          }
        )
        if (!res.ok) throw new Error(`Save failed: ${res.status}`)
        const data = await res.json()
        if (data._source === "redis_fallback") {
          setWarning(data.backendWarning || "Settings saved locally — search backend unreachable")
        }
      } catch (err) {
        console.error("Failed to save bm25 weight:", err)
      } finally {
        setSettingsSaving(false)
      }
    },
    [collection]
  )

  function handleBm25Change(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value)
    setBm25Weight(value)
    if (bm25DebounceRef.current) clearTimeout(bm25DebounceRef.current)
    bm25DebounceRef.current = setTimeout(() => saveBm25(value), 500)
  }

  const saveKeywordRerank = useCallback(
    async (value: number) => {
      setSettingsSaving(true)
      try {
        const res = await fetch(
          `/api/admin/settings?collection=${encodeURIComponent(collection)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword_rerank_strength: value }),
          }
        )
        if (!res.ok) throw new Error(`Save failed: ${res.status}`)
        const data = await res.json()
        if (data._source === "redis_fallback") {
          setWarning(data.backendWarning || "Settings saved locally — search backend unreachable")
        }
      } catch (err) {
        console.error("Failed to save keyword rerank strength:", err)
      } finally {
        setSettingsSaving(false)
      }
    },
    [collection]
  )

  function handleKeywordRerankChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value)
    setKeywordRerank(value)
    if (keywordDebounceRef.current) clearTimeout(keywordDebounceRef.current)
    keywordDebounceRef.current = setTimeout(() => saveKeywordRerank(value), 500)
  }

  async function toggleQueryEnhancement() {
    const newValue = !queryEnhancementEnabled
    setQueryEnhancementEnabled(newValue)
    setSettingsSaving(true)
    try {
      const res = await fetch(
        `/api/admin/settings?collection=${encodeURIComponent(collection)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query_enhancement_enabled: newValue }),
        }
      )
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const data = await res.json()
      if (data._source === "redis_fallback") {
        setWarning(data.backendWarning || "Settings saved locally — search backend unreachable")
      }
    } catch (err) {
      console.error("Failed to save settings:", err)
      setQueryEnhancementEnabled(!newValue) // revert on error
    } finally {
      setSettingsSaving(false)
    }
  }

  async function toggleAspectsEnabled() {
    const newValue = !aspectsEnabled
    setAspectsEnabled(newValue)
    setSettingsSaving(true)
    try {
      const res = await fetch(
        `/api/admin/settings?collection=${encodeURIComponent(collection)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aspects_enabled: newValue }),
        }
      )
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const data = await res.json()
      if (data._source === "redis_fallback") {
        setWarning(data.backendWarning || "Settings saved locally — search backend unreachable")
      }
    } catch (err) {
      console.error("Failed to save aspects enabled:", err)
      setAspectsEnabled(!newValue) // revert on error
    } finally {
      setSettingsSaving(false)
    }
  }

  const saveStoreType = useCallback(
    async (value: string) => {
      setStoreTypeSaving(true)
      try {
        const res = await fetch(
          `/api/admin/settings?collection=${encodeURIComponent(collection)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store_type: value }),
          }
        )
        if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      } catch (err) {
        console.error("Failed to save store type:", err)
      } finally {
        setStoreTypeSaving(false)
      }
    },
    [collection]
  )

  function handleStoreTypeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setStoreType(value)
    if (storeTypeDebounceRef.current) clearTimeout(storeTypeDebounceRef.current)
    storeTypeDebounceRef.current = setTimeout(() => saveStoreType(value), 800)
  }

  async function handleResultsPerPageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = parseInt(e.target.value, 10)
    setResultsPerPage(value)
    setResultsPerPageSaving(true)
    try {
      const res = await fetch(
        `/api/admin/settings?collection=${encodeURIComponent(collection)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ results_per_page: value }),
        }
      )
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const data = await res.json()
      if (data._source === "redis_fallback") {
        setWarning(data.backendWarning || "Settings saved locally — search backend unreachable")
      }
    } catch (err) {
      console.error("Failed to save results per page:", err)
    } finally {
      setResultsPerPageSaving(false)
    }
  }

  async function saveAspectsPromptFn(newPrompt: string) {
    setSavingAspects(true)
    try {
      const cp = `?collection=${encodeURIComponent(collection)}`
      const res = await fetch(`/api/admin/settings/aspects-prompt${cp}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPrompt }),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      setAspectsPrompt(newPrompt)

      // Refresh history
      try {
        const histRes = await fetch(`/api/admin/settings/aspects-prompt${cp}&includeHistory=true`)
        if (histRes.ok) {
          const histData = await histRes.json()
          setAspectsHistory(histData.history ?? [])
        }
      } catch {
        // History refresh failed — not critical
      }
    } finally {
      setSavingAspects(false)
    }
  }

  async function runOptimization() {
    setOptimizing(true)
    setOptimizeError(null)
    setOptimizationResult(null)
    setOptimizeStage("starting")
    setOptimizeElapsed(0)
    try {
      const cp = `?collection=${encodeURIComponent(collection)}`

      // 1. Start the async job
      const startRes = await fetch(`/api/admin/settings/optimize${cp}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimization_target: "accuracy", num_queries: 12 }),
      })
      if (!startRes.ok) {
        const data = await startRes.json().catch(() => ({ error: `Error ${startRes.status}` }))
        throw new Error(data.error || `Failed to start optimization (${startRes.status})`)
      }
      const { job_id } = await startRes.json()

      // 2. Poll for progress
      let consecutiveFailures = 0
      while (true) {
        await new Promise((r) => setTimeout(r, 2000))

        const pollRes = await fetch(
          `/api/admin/settings/optimize?job_id=${encodeURIComponent(job_id)}`
        )
        if (!pollRes.ok) {
          consecutiveFailures++
          if (consecutiveFailures >= 3) {
            const data = await pollRes.json().catch(() => ({ error: `Poll error ${pollRes.status}` }))
            throw new Error(data.error || `Polling failed after ${consecutiveFailures} retries (${pollRes.status})`)
          }
          continue
        }

        consecutiveFailures = 0
        const job = await pollRes.json()
        setOptimizeStage(job.stage || "")
        setOptimizeElapsed(job.elapsed || 0)

        if (job.status === "completed") {
          setOptimizationResult(job.result as OptimizationResult)
          break
        }
        if (job.status === "failed") {
          throw new Error(job.error || "Optimization failed")
        }
      }
    } catch (err) {
      setOptimizeError(
        err instanceof Error ? err.message : "Optimization failed"
      )
    } finally {
      setOptimizing(false)
      setOptimizeStage("")
    }
  }

  async function applyRecommendation() {
    if (!optimizationResult) return
    const rec = optimizationResult.recommended_config
    setSettingsSaving(true)
    try {
      const res = await fetch(
        `/api/admin/settings?collection=${encodeURIComponent(collection)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query_enhancement_enabled: rec.query_enhancement_enabled,
            merch_rerank_strength: rec.merch_rerank_strength,
            bm25_weight: rec.bm25_weight,
            keyword_rerank_strength: rec.keyword_rerank_strength,
          }),
        }
      )
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)

      // Mark this optimization as applied
      if (optimizationResult.event_id) {
        fetch("/api/admin/settings/optimize/applied", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: optimizationResult.event_id }),
        }).catch((err) => console.warn("Failed to track applied state:", err))
      }

      // Update local state to match recommendation
      setQueryEnhancementEnabled(rec.query_enhancement_enabled)
      setMerchRerank(rec.merch_rerank_strength)
      setBm25Weight(rec.bm25_weight)
      setKeywordRerank(rec.keyword_rerank_strength)
      setOptimizationResult(null)
    } catch (err) {
      console.error("Failed to apply recommendation:", err)
    } finally {
      setSettingsSaving(false)
    }
  }

  async function loadHistory() {
    if (historyEvents.length > 0) return // Already loaded
    setHistoryLoading(true)
    try {
      const cp = `?collection=${encodeURIComponent(collection)}`
      const res = await fetch(`/api/admin/settings/optimize/history${cp}`)
      if (res.ok) {
        const data = await res.json()
        setHistoryEvents(data.events || [])
      }
    } catch (err) {
      console.error("Failed to load optimization history:", err)
    } finally {
      setHistoryLoading(false)
    }
  }

  function toggleHistory() {
    const opening = !historyOpen
    setHistoryOpen(opening)
    if (opening) loadHistory()
  }

  function toggleComparisonExpand(index: number) {
    setExpandedComparisons((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  if (loading) {
    return (
      <div>
        <SubPageHeader
          backHref="/admin/settings"
          backLabel="Settings"
          title="Search Tuning"
          description="Control how searches are interpreted and results are ranked."
        />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
            >
              <div className="h-5 bg-slate-100 rounded w-40 mb-4" />
              <div className="h-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <SubPageHeader
        backHref="/admin/settings"
        backLabel="Settings"
        title="Search Tuning"
        description="Control how customer searches are interpreted, which products are prioritized, and how merchandising influences results."
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {warning && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          {warning}
          <button
            onClick={() => setWarning(null)}
            className="ml-2 underline"
          >
            dismiss
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Store Identity Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Store Identity
          </h2>

          <div className="glass-card p-6">
            <div>
              <h3 className="text-lg font-semibold text-xtal-navy">
                Store Type
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                What kind of store this is. Used by AI prompts for aspect generation
                and query augmentation (e.g., &ldquo;luxury home goods retailer&rdquo;,
                &ldquo;whiskey and spirits shop&rdquo;).
              </p>
            </div>
            <div className="mt-4 max-w-full sm:max-w-md">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={storeType}
                  onChange={handleStoreTypeChange}
                  placeholder="online retailer"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-xtal-navy/20 focus:border-xtal-navy
                    placeholder:text-slate-300"
                />
                {storeTypeSaving && (
                  <span className="text-xs text-slate-400 shrink-0">Saving...</span>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div>
              <h3 className="text-lg font-semibold text-xtal-navy">
                Results Per Page
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Default number of products returned per search. End users can
                override this from the search page.
              </p>
            </div>
            <div className="mt-4 max-w-full sm:max-w-md">
              <div className="flex items-center gap-2">
                <select
                  value={resultsPerPage}
                  onChange={handleResultsPerPageChange}
                  disabled={resultsPerPageSaving}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-xtal-navy/20 focus:border-xtal-navy
                    cursor-pointer disabled:opacity-50"
                >
                  <option value={24}>24 per page</option>
                  <option value={48}>48 per page</option>
                  <option value={96}>96 per page</option>
                  <option value={120}>120 per page</option>
                </select>
                {resultsPerPageSaving && (
                  <span className="text-xs text-slate-400 shrink-0">Saving...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Merchandising Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Merchandising
          </h2>

          <PromptEditor
            title="Marketing Prompt"
            prompt={marketingPrompt}
            defaultPrompt={defaults?.default_marketing_prompt ?? ""}
            onSave={saveMarketing}
            saving={savingMarketing}
            placeholder="Describe your current marketing goals and product priorities. Controls query augmentation and how results are re-ranked to align with your merchandising strategy."
            history={marketingHistory}
          />
        </div>

        {/* Search Weights Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Search Weights
          </h2>

          <div className="glass-card p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Marketing Influence Slider */}
              <div>
                <h3 className="text-lg font-semibold text-xtal-navy">
                  Marketing Influence
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Controls how much the marketing prompt influences result
                  ordering. Higher values push marketing-aligned products higher
                  in search results.
                </p>
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400 shrink-0">
                      Weak
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={0.5}
                      step={0.05}
                      value={merchRerank}
                      onChange={handleMerchRerankChange}
                      disabled={settingsSaving}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer
                        bg-slate-200 accent-xtal-navy
                        [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-xtal-navy
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer
                        disabled:opacity-50"
                    />
                    <span className="text-xs font-medium text-slate-400 shrink-0">
                      Strong
                    </span>
                    <span className="text-sm font-mono text-xtal-navy bg-xtal-ice rounded px-2 py-0.5 min-w-[3rem] text-center">
                      {merchRerank.toFixed(2)}
                    </span>
                  </div>
                </div>
                {merchRerank === 0 && (
                  <div className="mt-3 text-xs text-slate-500 bg-slate-50 rounded px-3 py-2">
                    Marketing prompt has no influence on result ordering.
                  </div>
                )}
              </div>

              {/* Keyword Match Priority Slider */}
              <div>
                <h3 className="text-lg font-semibold text-xtal-navy">
                  Keyword Match Priority
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  How much to favor products that contain the exact words the
                  shopper typed. Higher values mean exact keyword matches rank
                  above loosely related products.
                </p>
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400 shrink-0">
                      Semantic
                    </span>
                    <input
                      type="range"
                      min={0.5}
                      max={5}
                      step={0.5}
                      value={bm25Weight}
                      onChange={handleBm25Change}
                      disabled={settingsSaving}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer
                        bg-slate-200 accent-xtal-navy
                        [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-xtal-navy
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer
                        disabled:opacity-50"
                    />
                    <span className="text-xs font-medium text-slate-400 shrink-0">
                      Keyword
                    </span>
                    <span className="text-sm font-mono text-xtal-navy bg-xtal-ice rounded px-2 py-0.5 min-w-[3rem] text-center">
                      {bm25Weight.toFixed(1)}
                    </span>
                  </div>
                </div>
                {bm25Weight >= 3 && (
                  <div className="mt-3 text-xs text-slate-500 bg-slate-50 rounded px-3 py-2">
                    High keyword priority — searches will strongly favor exact text
                    matches over semantic similarity.
                  </div>
                )}
              </div>

              {/* Product Type Boost Slider */}
              <div>
                <h3 className="text-lg font-semibold text-xtal-navy">
                  Product Type Boost
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  When a shopper searches for a specific product (e.g.,
                  &ldquo;ties for a wedding&rdquo;), this boosts actual ties above
                  related but different products. Higher values mean stronger
                  preference for the correct product type.
                </p>
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400 shrink-0">
                      Off
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={keywordRerank}
                      onChange={handleKeywordRerankChange}
                      disabled={settingsSaving}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer
                        bg-slate-200 accent-xtal-navy
                        [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-xtal-navy
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer
                        disabled:opacity-50"
                    />
                    <span className="text-xs font-medium text-slate-400 shrink-0">
                      Strong
                    </span>
                    <span className="text-sm font-mono text-xtal-navy bg-xtal-ice rounded px-2 py-0.5 min-w-[3rem] text-center">
                      {keywordRerank.toFixed(1)}
                    </span>
                  </div>
                </div>
                {keywordRerank === 0 && (
                  <div className="mt-3 text-xs text-slate-500 bg-slate-50 rounded px-3 py-2">
                    Product type boost is off — all products ranked purely by
                    relevance score.
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* Auto-Optimize */}
            <div>
              <h3 className="text-lg font-semibold text-xtal-navy">
                Optimize for My Store
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Automatically tests different weight combinations against your
                catalog and recent searches, then recommends the best settings.
              </p>

              <div className="mt-4">
                <button
                  onClick={runOptimization}
                  disabled={optimizing || settingsSaving}
                  className="px-4 py-2 bg-xtal-navy text-white rounded-lg text-sm font-medium
                    hover:bg-xtal-navy/90 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  {optimizing ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Analyzing your catalog...
                    </span>
                  ) : (
                    "Optimize Settings"
                  )}
                </button>
                {optimizing && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="font-medium">
                        {optimizeStage === "gathering_context" && "Analyzing your catalog and recent searches..."}
                        {optimizeStage === "proposing_configs" && "Claude is designing 30 test configurations..."}
                        {optimizeStage === "executing_searches" && "Testing 360 search combinations across your catalog..."}
                        {optimizeStage === "evaluating_results" && "Claude is evaluating results and picking a winner..."}
                        {(!optimizeStage || optimizeStage === "starting") && "Connecting to optimization service..."}
                      </span>
                      {optimizeElapsed > 0 && (
                        <span className="text-xs text-slate-400 tabular-nums">
                          {Math.round(optimizeElapsed)}s
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-xtal-navy h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.max(5, (
                            optimizeStage === "gathering_context" ? 5 :
                            optimizeStage === "proposing_configs" ? 15 :
                            optimizeStage === "executing_searches" ? 45 :
                            optimizeStage === "evaluating_results" ? 85 :
                            2
                          ))}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      This typically takes about 5 minutes. Testing 30 configurations
                      across 12 queries to find your optimal search settings.
                    </p>
                  </div>
                )}
              </div>

              {optimizeError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {optimizeError}
                </div>
              )}

              {optimizationResult && (
                <div className="mt-6 space-y-4">
                  {/* Config comparison */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left px-4 py-2 font-medium text-slate-500">
                            Setting
                          </th>
                          <th className="text-center px-4 py-2 font-medium text-slate-500">
                            Current
                          </th>
                          <th className="text-center px-4 py-2 font-medium text-xtal-navy">
                            Recommended
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-4 py-2 text-slate-600">
                            AI Query Rewriting
                          </td>
                          <td className="px-4 py-2 text-center">
                            {optimizationResult.current_config
                              .query_enhancement_enabled
                              ? "On"
                              : "Off"}
                          </td>
                          <td className="px-4 py-2 text-center font-medium">
                            {optimizationResult.recommended_config
                              .query_enhancement_enabled
                              ? "On"
                              : "Off"}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-slate-600">
                            Marketing Influence
                          </td>
                          <td className="px-4 py-2 text-center font-mono">
                            {optimizationResult.current_config.merch_rerank_strength.toFixed(
                              2
                            )}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-medium">
                            {optimizationResult.recommended_config.merch_rerank_strength.toFixed(
                              2
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-slate-600">
                            Keyword Match Priority
                          </td>
                          <td className="px-4 py-2 text-center font-mono">
                            {optimizationResult.current_config.bm25_weight.toFixed(
                              1
                            )}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-medium">
                            {optimizationResult.recommended_config.bm25_weight.toFixed(
                              1
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-slate-600">
                            Product Type Boost
                          </td>
                          <td className="px-4 py-2 text-center font-mono">
                            {optimizationResult.current_config.keyword_rerank_strength.toFixed(
                              1
                            )}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-medium">
                            {optimizationResult.recommended_config.keyword_rerank_strength.toFixed(
                              1
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-xtal-ice/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-xtal-navy mb-1">
                      Why this recommendation
                    </h4>
                    <p className="text-sm text-slate-600 whitespace-pre-line">
                      {optimizationResult.reasoning}
                    </p>
                  </div>

                  {/* Weirdest Results */}
                  {optimizationResult.weirdest_results && (
                    <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-amber-700 mb-3">
                        Weirdest Results
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-medium text-slate-500 mb-1">Current config</p>
                          <p className="text-slate-700 font-medium">
                            &ldquo;{optimizationResult.weirdest_results.current.query}&rdquo;
                          </p>
                          <p className="text-amber-800 mt-1">
                            {optimizationResult.weirdest_results.current.product}
                          </p>
                          <p className="text-slate-500 mt-1 italic">
                            {optimizationResult.weirdest_results.current.reason}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-xtal-navy mb-1">Recommended config</p>
                          <p className="text-slate-700 font-medium">
                            &ldquo;{optimizationResult.weirdest_results.recommended.query}&rdquo;
                          </p>
                          <p className="text-amber-800 mt-1">
                            {optimizationResult.weirdest_results.recommended.product}
                          </p>
                          <p className="text-slate-500 mt-1 italic">
                            {optimizationResult.weirdest_results.recommended.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sample comparisons */}
                  {optimizationResult.sample_comparisons.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2">
                        Sample before / after
                      </h4>
                      <div className="space-y-3">
                        {optimizationResult.sample_comparisons.map((comp, i) => {
                          const isExpanded = expandedComparisons.has(i)
                          const currentItems = isExpanded
                            ? (comp.current_results?.length ? comp.current_results : comp.current_top_5.map(t => ({ title: t })))
                            : comp.current_top_5.map(t => ({ title: t }))
                          const recommendedItems = isExpanded
                            ? (comp.recommended_results?.length ? comp.recommended_results : comp.recommended_top_5.map(t => ({ title: t })))
                            : comp.recommended_top_5.map(t => ({ title: t }))
                          const hasMore = (comp.current_results?.length || 0) > 5 || (comp.recommended_results?.length || 0) > 5

                          return (
                            <div
                              key={i}
                              className="border border-slate-200 rounded-lg p-3"
                            >
                              <p className="text-sm font-medium text-xtal-navy mb-2">
                                &ldquo;{comp.query}&rdquo;
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <p className="font-medium text-slate-400 mb-1">
                                    Current
                                  </p>
                                  <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                                    {currentItems.map((item, j) => (
                                      <li key={j} className="truncate" title={"title" in item ? item.title : String(item)}>
                                        {"title" in item ? item.title : String(item)}
                                        {"price" in item && item.price ? ` — $${Number(item.price).toFixed(2)}` : ""}
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                                <div>
                                  <p className="font-medium text-xtal-navy mb-1">
                                    Recommended
                                  </p>
                                  <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                                    {recommendedItems.map((item, j) => (
                                      <li key={j} className="truncate" title={"title" in item ? item.title : String(item)}>
                                        {"title" in item ? item.title : String(item)}
                                        {"price" in item && item.price ? ` — $${Number(item.price).toFixed(2)}` : ""}
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                              {hasMore && (
                                <button
                                  onClick={() => toggleComparisonExpand(i)}
                                  className="mt-2 text-xs text-xtal-navy hover:underline"
                                >
                                  {isExpanded ? "Show top 5" : `Show all ${Math.max(comp.current_results?.length || 0, comp.recommended_results?.length || 0)} results`}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <p className="text-xs text-slate-400">
                    Tested {optimizationResult.configs_tested} configurations
                    across {optimizationResult.queries_tested} queries in{" "}
                    {optimizationResult.optimization_time.toFixed(1)}s
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={applyRecommendation}
                      disabled={settingsSaving}
                      className="px-4 py-2 bg-xtal-navy text-white rounded-lg text-sm font-medium
                        hover:bg-xtal-navy/90 disabled:opacity-50 transition-colors"
                    >
                      Apply Recommended Settings
                    </button>
                    <button
                      onClick={() => setOptimizationResult(null)}
                      className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Query Understanding Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Query Understanding
          </h2>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-xtal-navy">
                  AI Query Rewriting
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  When enabled, search queries are rewritten by AI to capture
                  customer intent more broadly. Disable to use exact user queries
                  for more predictable results.
                </p>
              </div>
              <button
                onClick={toggleQueryEnhancement}
                disabled={settingsSaving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  queryEnhancementEnabled ? "bg-xtal-navy" : "bg-slate-300"
                } ${settingsSaving ? "opacity-50" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    queryEnhancementEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {!queryEnhancementEnabled && (
              <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
                Query enhancement is off. Search queries will not be rewritten
                by AI.
              </div>
            )}
          </div>
        </div>

        {/* Aspect Chips Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Aspect Chips
          </h2>

          <div className="glass-card p-6 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-xtal-navy">
                  Show Aspect Suggestions
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  When enabled, AI-generated discovery chips appear below the
                  search bar to help shoppers refine their results.
                </p>
              </div>
              <button
                onClick={toggleAspectsEnabled}
                disabled={settingsSaving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  aspectsEnabled ? "bg-xtal-navy" : "bg-slate-300"
                } ${settingsSaving ? "opacity-50" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aspectsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {!aspectsEnabled && (
              <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
                Aspect suggestions are hidden. Shoppers will not see discovery
                chips below the search bar.
              </div>
            )}
          </div>

          <PromptEditor
            title="Aspect Chips Prompt"
            prompt={aspectsPrompt}
            defaultPrompt={aspectsDefault}
            onSave={saveAspectsPromptFn}
            saving={savingAspects}
            placeholder="System prompt for generating discovery chips. Use {store_type} — it will be replaced with the Store Type value above."
            history={aspectsHistory}
          />
        </div>

        {/* Optimization History — collapsed by default */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={toggleHistory}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {historyOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              <h3 className="text-sm font-semibold text-xtal-navy">
                Optimization History
              </h3>
              {historyEvents.length > 0 && (
                <span className="text-xs text-slate-400">
                  ({historyEvents.length} runs)
                </span>
              )}
            </div>
          </button>

          {historyOpen && (
            <div className="border-t border-slate-100 px-4 pb-4">
              {historyLoading ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  Loading history...
                </div>
              ) : historyEvents.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  No optimization runs yet.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {historyEvents.map((evt) => {
                    const d = evt.event_data
                    const isExpanded = expandedHistoryRow === evt.id
                    const date = new Date(evt.timestamp)
                    const configChanged =
                      JSON.stringify(d.current_config) !== JSON.stringify(d.recommended_config)

                    return (
                      <div key={evt.id} className="border border-slate-200 rounded-lg">
                        <button
                          onClick={() =>
                            setExpandedHistoryRow(isExpanded ? null : evt.id)
                          }
                          className="w-full flex items-center gap-3 p-3 text-left text-xs hover:bg-slate-50/50 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="text-slate-500 shrink-0">
                            {date.toLocaleDateString()}{" "}
                            {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-xtal-navy font-medium shrink-0">
                            {d.target}
                          </span>
                          <span className="text-slate-400">
                            {d.configs_tested} configs / {d.queries_tested} queries / {d.optimization_time?.toFixed(1)}s
                          </span>
                          <span className="ml-auto flex items-center gap-1 shrink-0">
                            {configChanged ? (
                              <span className="text-blue-600">changed</span>
                            ) : (
                              <span className="text-slate-400">no change</span>
                            )}
                            {d.applied && (
                              <span className="inline-flex items-center gap-0.5 text-green-600 font-medium">
                                <Check className="w-3 h-3" /> applied
                              </span>
                            )}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-slate-100 p-3 space-y-3 text-xs">
                            {/* Reasoning */}
                            {d.reasoning && (
                              <div className="bg-xtal-ice/50 rounded p-3">
                                <p className="font-medium text-xtal-navy mb-1">Reasoning</p>
                                <p className="text-slate-600 whitespace-pre-line">{d.reasoning}</p>
                              </div>
                            )}

                            {/* Config comparison */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <p className="font-medium text-slate-400 mb-1">Current</p>
                                <pre className="bg-slate-50 rounded p-2 text-[11px] overflow-auto">
                                  {JSON.stringify(d.current_config, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <p className="font-medium text-xtal-navy mb-1">Recommended</p>
                                <pre className="bg-slate-50 rounded p-2 text-[11px] overflow-auto">
                                  {JSON.stringify(d.recommended_config, null, 2)}
                                </pre>
                              </div>
                            </div>

                            {/* Weirdest results */}
                            {d.weirdest_results && (
                              <div className="border border-amber-200 bg-amber-50/50 rounded p-3">
                                <p className="font-medium text-amber-700 mb-2">Weirdest Results</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-slate-500">Current: &ldquo;{d.weirdest_results.current.query}&rdquo;</p>
                                    <p className="text-amber-800">{d.weirdest_results.current.product}</p>
                                    <p className="text-slate-500 italic">{d.weirdest_results.current.reason}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">Recommended: &ldquo;{d.weirdest_results.recommended.query}&rdquo;</p>
                                    <p className="text-amber-800">{d.weirdest_results.recommended.product}</p>
                                    <p className="text-slate-500 italic">{d.weirdest_results.recommended.reason}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Sample comparisons */}
                            {d.sample_comparisons?.length > 0 && (
                              <div>
                                <p className="font-medium text-slate-500 mb-1">Sample comparisons</p>
                                {d.sample_comparisons.map((comp, ci) => (
                                  <div key={ci} className="border border-slate-100 rounded p-2 mb-1">
                                    <p className="font-medium text-xtal-navy mb-1">
                                      &ldquo;{comp.query}&rdquo;
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                                        {comp.current_top_5.map((t, j) => (
                                          <li key={j} className="truncate">{t}</li>
                                        ))}
                                      </ol>
                                      <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                                        {comp.recommended_top_5.map((t, j) => (
                                          <li key={j} className="truncate">{t}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Test queries */}
                            {d.test_queries?.length > 0 && (
                              <details className="text-slate-500">
                                <summary className="cursor-pointer font-medium hover:text-slate-700">
                                  Test queries ({d.test_queries.length})
                                </summary>
                                <ul className="mt-1 list-disc list-inside">
                                  {d.test_queries.map((q, qi) => (
                                    <li key={qi}>{q}</li>
                                  ))}
                                </ul>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
