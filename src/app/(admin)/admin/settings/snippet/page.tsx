"use client"

import { useState, useEffect, useCallback } from "react"
import { useCollection } from "@/lib/admin/CollectionContext"
import { Code2, Copy, Check, ExternalLink, Info } from "lucide-react"

interface SnippetSettings {
  enabled: boolean
  siteUrl: string
  searchSelector: string
  resultsSelector: string
  displayMode: string
}

export default function SnippetSettingsPage() {
  const { collection } = useCollection()
  const [settings, setSettings] = useState<SnippetSettings>({
    enabled: false,
    siteUrl: "",
    searchSelector: 'input[type="search"]',
    resultsSelector: "",
    displayMode: "overlay",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dirty, setDirty] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/settings/snippet?collection=${collection}`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch {
      // Use defaults
    }
    setLoading(false)
  }, [collection])

  useEffect(() => {
    fetchSettings()
    setDirty(false)
  }, [fetchSettings])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/admin/settings/snippet?collection=${collection}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      setDirty(false)
    } catch {
      // Handle error silently
    }
    setSaving(false)
  }

  function updateField<K extends keyof SnippetSettings>(key: K, value: SnippetSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const snippetCode = `<link rel="preconnect" href="${typeof window !== "undefined" ? window.location.origin : "https://xtalsearch.com"}">
<script>
  (function(){
    var s = document.createElement('script');
    s.src = '${typeof window !== "undefined" ? window.location.origin : "https://xtalsearch.com"}/client/v1/xtal.js';
    s.async = true;
    s.dataset.shopId = '${collection}';
    document.head.appendChild(s);
  })();
</script>`

  function handleCopy() {
    navigator.clipboard.writeText(snippetCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-xtal-navy rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Embed Snippet</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure and generate a JavaScript snippet to embed XTAL search on a merchant&apos;s website.
        </p>
      </div>

      {/* Preview banner */}
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <span className="font-medium">Preview</span> &mdash; The client library is coming in a future release.
          Settings saved here will be used once the snippet is live.
        </p>
      </div>

      <div className="space-y-6">
        {/* Snippet Status */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Snippet Status</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateField("enabled", e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-xtal-navy focus:ring-xtal-navy/30"
            />
            <span className="text-sm text-slate-700">
              Enable snippet for <span className="font-medium">{collection}</span>
            </span>
          </label>
        </section>

        {/* Merchant Site URL */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Merchant Site URL</h2>
          <p className="text-xs text-slate-500 mb-3">
            The merchant&apos;s website URL. Used for future style analysis.
          </p>
          <input
            type="url"
            value={settings.siteUrl}
            onChange={(e) => updateField("siteUrl", e.target.value)}
            placeholder="https://merchant-store.com"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-xtal-navy/30 focus:border-xtal-navy"
          />
        </section>

        {/* Search Selectors */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Search Selectors</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Search Input Selector</label>
              <input
                type="text"
                value={settings.searchSelector}
                onChange={(e) => updateField("searchSelector", e.target.value)}
                placeholder='input[type="search"]'
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-xtal-navy/30 focus:border-xtal-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Results Container Selector <span className="text-slate-400">(optional, for full-page mode)</span>
              </label>
              <input
                type="text"
                value={settings.resultsSelector}
                onChange={(e) => updateField("resultsSelector", e.target.value)}
                placeholder="#search-results"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-xtal-navy/30 focus:border-xtal-navy"
              />
            </div>
          </div>
        </section>

        {/* Display Mode */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Display Mode</h2>
          <div className="flex gap-4">
            {(["overlay", "fullpage"] as const).map((mode) => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="displayMode"
                  value={mode}
                  checked={settings.displayMode === mode}
                  onChange={() => updateField("displayMode", mode)}
                  className="w-4 h-4 text-xtal-navy focus:ring-xtal-navy/30"
                />
                <span className="text-sm text-slate-700 capitalize">
                  {mode === "fullpage" ? "Full Page" : "Overlay"}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Generated Snippet */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Generated Snippet
            </h2>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-xtal-navy transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-slate-300 font-mono whitespace-pre">{snippetCode}</pre>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Paste this snippet into the merchant&apos;s site &lt;head&gt; tag. The client library is not yet available.
          </p>
        </section>

        {/* UTM Info */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">UTM Attribution</h2>
          <p className="text-xs text-slate-500 mb-3">
            All product links include immutable UTM parameters for attribution tracking. These cannot be changed.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
            {[
              ["utm_source", "xtal"],
              ["utm_medium", "search"],
              ["utm_campaign", collection],
              ["utm_content", "(product ID)"],
              ["utm_term", "(search query)"],
            ].map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <code className="font-mono text-xtal-navy font-medium">{key}</code>
                <span className="text-slate-400">=</span>
                <code className="font-mono text-slate-600">{value}</code>
              </div>
            ))}
          </div>
        </section>

        {/* Test Storefront Link */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Test Storefront</h2>
          <p className="text-xs text-slate-500 mb-3">
            Preview how the snippet will behave on a simulated merchant storefront.
          </p>
          <a
            href={`/test/storefront?collection=${collection}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-xtal-navy hover:underline"
          >
            Open test storefront <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </section>
      </div>

      {/* Save button */}
      {dirty && (
        <div className="sticky bottom-4 mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-xtal-navy text-white text-sm font-medium rounded-lg hover:bg-xtal-navy/90 disabled:opacity-50 transition-colors shadow-lg"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  )
}
