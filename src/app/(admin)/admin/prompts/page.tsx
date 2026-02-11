"use client"

import { useState, useEffect } from "react"
import PromptEditor from "@/components/admin/PromptEditor"
import type { PromptDefaults } from "@/lib/admin/types"

export default function PromptsPage() {
  const [brandPrompt, setBrandPrompt] = useState("")
  const [marketingPrompt, setMarketingPrompt] = useState("")
  const [defaults, setDefaults] = useState<PromptDefaults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingBrand, setSavingBrand] = useState(false)
  const [savingMarketing, setSavingMarketing] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [brandRes, marketingRes, defaultsRes] = await Promise.all([
          fetch("/api/admin/prompts/brand"),
          fetch("/api/admin/prompts/marketing"),
          fetch("/api/admin/prompts/defaults"),
        ])

        if (brandRes.ok) {
          const data = await brandRes.json()
          setBrandPrompt(data.brand_prompt ?? "")
        }
        if (marketingRes.ok) {
          const data = await marketingRes.json()
          setMarketingPrompt(data.marketing_prompt ?? "")
        }
        if (defaultsRes.ok) {
          const data = await defaultsRes.json()
          setDefaults(data)
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
  }, [])

  async function saveBrand(newPrompt: string) {
    setSavingBrand(true)
    try {
      const res = await fetch("/api/admin/prompts/brand", {
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
      const res = await fetch("/api/admin/prompts/marketing", {
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
      </div>
    </div>
  )
}
