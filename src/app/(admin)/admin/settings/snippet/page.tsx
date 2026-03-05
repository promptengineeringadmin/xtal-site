"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Save, Loader2, Copy, Check } from "lucide-react"
import SubPageHeader from "@/components/admin/SubPageHeader"
import { useCollection } from "@/lib/admin/CollectionContext"

export default function SnippetSettingsPage() {
  const { collection } = useCollection()
  const [origins, setOrigins] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newOrigin, setNewOrigin] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchOrigins = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/settings?collection=${collection}`)
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setOrigins(data.allowed_origins || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }, [collection])

  useEffect(() => {
    fetchOrigins()
  }, [fetchOrigins])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/admin/settings?collection=${collection}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed_origins: origins }),
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

  function normalizeOrigin(raw: string): string {
    let value = raw.trim()
    if (!value) return ""
    // Auto-prepend https:// if no scheme
    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      value = `https://${value}`
    }
    return value
  }

  function validateOrigin(value: string): string | null {
    try {
      const url = new URL(value)
      // Origin = scheme + host (no path)
      if (url.pathname !== "/" && url.pathname !== "") {
        return "Origin should not include a path"
      }
      const origin = url.origin
      if (origins.includes(origin)) {
        return "This origin is already in the list"
      }
      return null
    } catch {
      return "Invalid URL format"
    }
  }

  function addOrigin() {
    setInputError(null)
    const normalized = normalizeOrigin(newOrigin)
    if (!normalized) return

    const validationError = validateOrigin(normalized)
    if (validationError) {
      setInputError(validationError)
      return
    }

    const origin = new URL(normalized).origin
    setOrigins((prev) => [...prev, origin])
    setNewOrigin("")
    setDirty(true)
  }

  function removeOrigin(index: number) {
    setOrigins((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <SubPageHeader
          backHref="/admin/settings"
          backLabel="Settings"
          title="Snippet & Deployment"
          description="Manage SDK embedding and security settings."
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
          Allowed origins saved. Changes take effect within 60 seconds.
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
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-slate-700">
              Allowed Origins
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Restrict which domains can use the XTAL search API for this
              collection. Leave empty to allow all domains.
            </p>
          </div>

          {/* Existing origins */}
          <div className="space-y-2 mb-4">
            {origins.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-500">
                  No origins configured — API accepts requests from any domain.
                </p>
              </div>
            )}

            {origins.map((origin, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
              >
                <span className="text-sm font-mono text-slate-700">
                  {origin}
                </span>
                <button
                  onClick={() => removeOrigin(i)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Add origin form */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Add Origin
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newOrigin}
                  onChange={(e) => {
                    setNewOrigin(e.target.value)
                    setInputError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addOrigin()
                    }
                  }}
                  placeholder="e.g. https://www.mystore.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-xtal-navy/20 focus:border-xtal-navy/40"
                />
                {inputError && (
                  <p className="text-xs text-red-500 mt-1">{inputError}</p>
                )}
              </div>
              <button
                onClick={addOrigin}
                disabled={!newOrigin.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg
                           bg-xtal-navy text-white hover:bg-xtal-navy/90 transition-colors
                           disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>

          {/* GTM Snippet */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  GTM Snippet
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Copy this snippet and add it to Google Tag Manager using the steps below.
                </p>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById("gtm-snippet-content")
                  if (el) {
                    navigator.clipboard.writeText(el.textContent || "")
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                           bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
              <pre id="gtm-snippet-content" className="text-xs text-slate-100 font-mono whitespace-pre-wrap break-all">
{`<script>window.XTAL_CONFIG = { shopId: "${collection}" };</script>
<script src="https://www.xtalsearch.com/client/v1/xtal.js"></script>`}
              </pre>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Installation Steps
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {[
                {
                  step: 1,
                  title: "Open Google Tag Manager",
                  detail: "Go to tagmanager.google.com and select your website\u2019s container.",
                },
                {
                  step: 2,
                  title: "Create a new Tag",
                  detail: "Click Tags in the left sidebar, then New in the top right.",
                },
                {
                  step: 3,
                  title: "Choose Custom HTML",
                  detail: "Click Tag Configuration, then select Custom HTML as the tag type.",
                },
                {
                  step: 4,
                  title: "Paste the snippet",
                  detail: "Copy the code above and paste it into the HTML field. Check the Support document.write checkbox.",
                },
                {
                  step: 5,
                  title: "Set the trigger to All Pages",
                  detail: "Click Triggering, then select All Pages so the snippet loads on every page of your site.",
                },
                {
                  step: 6,
                  title: "Name and save",
                  detail: "Name the tag \u201cXTAL Search\u201d (or similar), then click Save.",
                },
                {
                  step: 7,
                  title: "Preview and publish",
                  detail: "Use GTM\u2019s Preview mode to verify the tag fires correctly. Once confirmed, click Submit to publish the container.",
                },
              ].map(({ step, title, detail }) => (
                <div key={step} className="flex gap-4 p-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-xtal-navy text-white text-xs font-bold shrink-0 mt-0.5">
                    {step}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Changes typically appear within a few minutes of publishing. If you don&apos;t have GTM installed yet, ask your developer to add the GTM container snippet to your site first.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
