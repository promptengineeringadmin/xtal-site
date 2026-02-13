"use client"

import { useState, useEffect } from "react"
import PromptEditor from "@/components/admin/PromptEditor"
import SubPageHeader from "@/components/admin/SubPageHeader"
import { useCollection } from "@/lib/admin/CollectionContext"
import type { PromptDefaults } from "@/lib/admin/types"

interface HistoryEntry {
  content: string
  timestamp: string
}

export default function BrandIdentityPage() {
  const { collection } = useCollection()
  const [brandPrompt, setBrandPrompt] = useState("")
  const [brandHistory, setBrandHistory] = useState<HistoryEntry[]>([])
  const [defaults, setDefaults] = useState<PromptDefaults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    async function load() {
      try {
        const cp = `?collection=${encodeURIComponent(collection)}`
        const [brandRes, defaultsRes] = await Promise.all([
          fetch(`/api/admin/prompts/brand${cp}&includeHistory=true`),
          fetch(`/api/admin/prompts/defaults${cp}`),
        ])

        let loadedDefaults: PromptDefaults | null = null
        if (defaultsRes.ok) {
          loadedDefaults = await defaultsRes.json()
          setDefaults(loadedDefaults)
        }

        if (brandRes.ok) {
          const data = await brandRes.json()
          setBrandPrompt(data.brand_prompt ?? "")
          setBrandHistory(data.history ?? [])
          setWarning(null)
        } else {
          if (loadedDefaults) {
            setBrandPrompt(loadedDefaults.default_brand_prompt ?? "")
          }
          setWarning("Brand prompt failed to load from storage")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load prompt")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [collection])

  async function saveBrand(newPrompt: string) {
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/prompts/brand?collection=${encodeURIComponent(collection)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand_prompt: newPrompt }),
        }
      )
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const data = await res.json()
      setBrandPrompt(newPrompt)

      if (data._source === "redis") {
        setWarning("Prompt saved locally — search backend sync failed")
      }

      // Refresh history
      try {
        const histRes = await fetch(
          `/api/admin/prompts/brand?collection=${encodeURIComponent(collection)}&includeHistory=true`
        )
        if (histRes.ok) {
          const histData = await histRes.json()
          setBrandHistory(histData.history ?? [])
        }
      } catch {
        // History refresh failed — not critical
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <SubPageHeader
          backHref="/admin/settings"
          backLabel="Settings"
          title="Brand Identity"
          description="Define your store's brand voice and product philosophy."
        />
        <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
          <div className="h-5 bg-slate-100 rounded w-40 mb-4" />
          <div className="h-48 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <SubPageHeader
        backHref="/admin/settings"
        backLabel="Settings"
        title="Brand Identity"
        description="Describes your store's brand identity and values. Used during product ingestion to shape how product descriptions are embedded for search."
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

      <PromptEditor
        title="Brand Prompt"
        prompt={brandPrompt}
        defaultPrompt={defaults?.default_brand_prompt ?? ""}
        onSave={saveBrand}
        saving={saving}
        placeholder="Describe this store's brand identity, voice, and values. Used during product ingestion to shape how product descriptions are embedded for search."
        history={brandHistory}
      />
    </div>
  )
}
