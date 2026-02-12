"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PromptEditor from "@/components/admin/PromptEditor"
import { useCollection } from "@/lib/admin/CollectionContext"
import type { PromptDefaults } from "@/lib/admin/types"

export default function PromptsPage() {
  const { collection } = useCollection()
  const [brandPrompt, setBrandPrompt] = useState("")
  const [marketingPrompt, setMarketingPrompt] = useState("")
  const [defaults, setDefaults] = useState<PromptDefaults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingBrand, setSavingBrand] = useState(false)
  const [savingMarketing, setSavingMarketing] = useState(false)
  const [queryEnhancementEnabled, setQueryEnhancementEnabled] = useState(true)
  const [merchRerank, setMerchRerank] = useState(0.25)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [backendWarning, setBackendWarning] = useState(false)
  const rerankDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLoading(true)
    async function load() {
      try {
        const cp = `?collection=${encodeURIComponent(collection)}`
        const [brandRes, marketingRes, defaultsRes, settingsRes] = await Promise.all([
          fetch(`/api/admin/prompts/brand${cp}`),
          fetch(`/api/admin/prompts/marketing${cp}`),
          fetch(`/api/admin/prompts/defaults${cp}`),
          fetch(`/api/admin/settings${cp}`),
        ])

        // Defaults always resolve (hardcoded fallback in route)
        let loadedDefaults: PromptDefaults | null = null
        if (defaultsRes.ok) {
          loadedDefaults = await defaultsRes.json()
          setDefaults(loadedDefaults)
        }

        if (brandRes.ok) {
          const data = await brandRes.json()
          setBrandPrompt(data.brand_prompt ?? "")
        } else if (loadedDefaults) {
          setBrandPrompt(loadedDefaults.default_brand_prompt ?? "")
        }

        if (marketingRes.ok) {
          const data = await marketingRes.json()
          setMarketingPrompt(data.marketing_prompt ?? "")
        } else if (loadedDefaults) {
          setMarketingPrompt(loadedDefaults.default_marketing_prompt ?? "")
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setQueryEnhancementEnabled(data.query_enhancement_enabled ?? true)
          setMerchRerank(data.merch_rerank_strength ?? 0.25)
          if (data._source === "redis_fallback") {
            setBackendWarning(true)
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load prompts"
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [collection])

  async function saveBrand(newPrompt: string) {
    setSavingBrand(true)
    try {
      const res = await fetch(`/api/admin/prompts/brand?collection=${encodeURIComponent(collection)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_prompt: newPrompt }),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      setBrandPrompt(newPrompt)
    } finally {
      setSavingBrand(false)
    }
  }

  async function saveMarketing(newPrompt: string) {
    setSavingMarketing(true)
    try {
      const res = await fetch(`/api/admin/prompts/marketing?collection=${encodeURIComponent(collection)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing_prompt: newPrompt }),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      setMarketingPrompt(newPrompt)
    } finally {
      setSavingMarketing(false)
    }
  }

  const saveMerchRerank = useCallback(async (value: number) => {
    setSettingsSaving(true)
    try {
      const res = await fetch(`/api/admin/settings?collection=${encodeURIComponent(collection)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merch_rerank_strength: value }),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const data = await res.json()
      if (data._source === "redis_fallback") {
        setBackendWarning(true)
      }
    } catch (err) {
      console.error("Failed to save merch rerank strength:", err)
    } finally {
      setSettingsSaving(false)
    }
  }, [collection])

  function handleMerchRerankChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value)
    setMerchRerank(value)
    if (rerankDebounceRef.current) clearTimeout(rerankDebounceRef.current)
    rerankDebounceRef.current = setTimeout(() => saveMerchRerank(value), 500)
  }

  async function toggleQueryEnhancement() {
    const newValue = !queryEnhancementEnabled
    setQueryEnhancementEnabled(newValue)
    setSettingsSaving(true)
    try {
      const res = await fetch(`/api/admin/settings?collection=${encodeURIComponent(collection)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query_enhancement_enabled: newValue }),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const data = await res.json()
      if (data._source === "redis_fallback") {
        setBackendWarning(true)
      }
    } catch (err) {
      console.error("Failed to save settings:", err)
      setQueryEnhancementEnabled(!newValue) // revert on error
    } finally {
      setSettingsSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Prompt Controls
        </h1>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
            >
              <div className="h-5 bg-slate-100 rounded w-40 mb-4" />
              <div className="h-48 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Prompt Controls
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {backendWarning && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Backend unreachable — settings saved locally. Search backend may not reflect this change until it reconnects.
          <button onClick={() => setBackendWarning(false)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      <div className="space-y-6">
        <PromptEditor
          title="Brand Prompt"
          prompt={brandPrompt}
          defaultPrompt={defaults?.default_brand_prompt ?? ""}
          onSave={saveBrand}
          saving={savingBrand}
        />
        <PromptEditor
          title="Marketing Prompt"
          prompt={marketingPrompt}
          defaultPrompt={defaults?.default_marketing_prompt ?? ""}
          onSave={saveMarketing}
          saving={savingMarketing}
        />

        {/* Query Enhancement Toggle */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-xtal-navy">Query Enhancement</h3>
              <p className="text-sm text-slate-500 mt-1">
                When enabled, search queries are rewritten by AI to improve relevance.
                Disable to use exact user queries for more predictable results.
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
              Query enhancement is off. Search queries will not be rewritten by AI.
            </div>
          )}
        </div>

        {/* Merch Re-sequencing Slider */}
        <div className="glass-card p-6">
          <div>
            <h3 className="text-lg font-semibold text-xtal-navy">Merch Re-sequencing</h3>
            <p className="text-sm text-slate-500 mt-1">
              Controls how much the marketing prompt influences result ordering.
              Higher values push marketing-aligned products higher in search results.
            </p>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-slate-400 w-10">Weak</span>
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
              <span className="text-xs font-medium text-slate-400 w-12">Strong</span>
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
  )
}
