"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PromptEditor from "@/components/admin/PromptEditor"
import SubPageHeader from "@/components/admin/SubPageHeader"
import { useCollection } from "@/lib/admin/CollectionContext"
import type { PromptDefaults } from "@/lib/admin/types"
import type { OptimizationResult } from "@/lib/xtal-types"

interface HistoryEntry {
  content: string
  timestamp: string
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
  const rerankDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bm25DebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keywordDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLoading(true)
    async function load() {
      try {
        const cp = `?collection=${encodeURIComponent(collection)}`
        const [marketingRes, defaultsRes, settingsRes] = await Promise.all([
          fetch(`/api/admin/prompts/marketing${cp}&includeHistory=true`),
          fetch(`/api/admin/prompts/defaults${cp}`),
          fetch(`/api/admin/settings${cp}`),
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
          if (data._source === "redis_fallback") {
            warnings.push(
              "Search backend unreachable — settings loaded from local cache"
            )
          }
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
          setWarning("Settings saved locally — search backend unreachable")
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
          setWarning("Settings saved locally — search backend unreachable")
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
          setWarning("Settings saved locally — search backend unreachable")
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
        setWarning("Settings saved locally — search backend unreachable")
      }
    } catch (err) {
      console.error("Failed to save settings:", err)
      setQueryEnhancementEnabled(!newValue) // revert on error
    } finally {
      setSettingsSaving(false)
    }
  }

  async function runOptimization() {
    setOptimizing(true)
    setOptimizeError(null)
    setOptimizationResult(null)
    try {
      const cp = `?collection=${encodeURIComponent(collection)}`
      const res = await fetch(`/api/admin/settings/optimize${cp}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimization_target: "accuracy", num_queries: 12 }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `Error ${res.status}` }))
        throw new Error(data.error || `Optimization failed (${res.status})`)
      }
      const result: OptimizationResult = await res.json()
      setOptimizationResult(result)
    } catch (err) {
      setOptimizeError(
        err instanceof Error ? err.message : "Optimization failed"
      )
    } finally {
      setOptimizing(false)
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
        {/* Merchandising Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Merchandising
          </h2>

          <div className="space-y-4">
            <PromptEditor
              title="Marketing Prompt"
              prompt={marketingPrompt}
              defaultPrompt={defaults?.default_marketing_prompt ?? ""}
              onSave={saveMarketing}
              saving={savingMarketing}
              placeholder="Describe your current marketing goals and product priorities. Controls query augmentation and how results are re-ranked to align with your merchandising strategy."
              history={marketingHistory}
            />

            {/* Marketing Influence Slider */}
            <div className="glass-card p-6">
              <div>
                <h3 className="text-lg font-semibold text-xtal-navy">
                  Marketing Influence
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Controls how much the marketing prompt influences result
                  ordering. Higher values push marketing-aligned products higher
                  in search results.
                </p>
              </div>
              <div className="mt-4 max-w-md">
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
          </div>
        </div>

        {/* Ranking Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Ranking
          </h2>

          <div className="space-y-4">
            {/* Keyword Match Priority Slider */}
            <div className="glass-card p-6">
              <div>
                <h3 className="text-lg font-semibold text-xtal-navy">
                  Keyword Match Priority
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  How much to favor products that contain the exact words the
                  shopper typed. Higher values mean exact keyword matches rank
                  above loosely related products.
                </p>
              </div>
              <div className="mt-4 max-w-md">
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
            <div className="glass-card p-6">
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
              </div>
              <div className="mt-4 max-w-md">
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

        {/* Auto-Optimize Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Auto-Optimize
          </h2>

          <div className="glass-card p-6">
            <div>
              <h3 className="text-lg font-semibold text-xtal-navy">
                Optimize for My Store
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Automatically tests different weight combinations against your
                catalog and recent searches, then recommends the best settings.
              </p>
            </div>

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
                <p className="mt-2 text-xs text-slate-400">
                  This takes about 20-30 seconds. Testing multiple search
                  configurations against your catalog.
                </p>
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

                {/* Sample comparisons */}
                {optimizationResult.sample_comparisons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 mb-2">
                      Sample before / after
                    </h4>
                    <div className="space-y-3">
                      {optimizationResult.sample_comparisons.map((comp, i) => (
                        <div
                          key={i}
                          className="border border-slate-200 rounded-lg p-3"
                        >
                          <p className="text-sm font-medium text-xtal-navy mb-2">
                            &ldquo;{comp.query}&rdquo;
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="font-medium text-slate-400 mb-1">
                                Current
                              </p>
                              <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                                {comp.current_top_5.map((t, j) => (
                                  <li key={j} className="truncate">
                                    {t}
                                  </li>
                                ))}
                              </ol>
                            </div>
                            <div>
                              <p className="font-medium text-xtal-navy mb-1">
                                Recommended
                              </p>
                              <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                                {comp.recommended_top_5.map((t, j) => (
                                  <li key={j} className="truncate">
                                    {t}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        </div>
                      ))}
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
    </div>
  )
}
