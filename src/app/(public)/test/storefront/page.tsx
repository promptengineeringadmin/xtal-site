"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Search, ShoppingBag, Info } from "lucide-react"

export default function TestStorefrontPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" /></div>}>
      <TestStorefrontContent />
    </Suspense>
  )
}

function TestStorefrontContent() {
  const searchParams = useSearchParams()
  const collection = searchParams.get("collection") || "xtaldemo"

  const [configStatus, setConfigStatus] = useState<"loading" | "ok" | "error">("loading")
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [configError, setConfigError] = useState("")

  const fetchConfig = useCallback(async () => {
    setConfigStatus("loading")
    try {
      const res = await fetch(`/api/xtal/config?shopId=${collection}`)
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
        setConfigStatus("ok")
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        setConfigError(err.error || `HTTP ${res.status}`)
        setConfigStatus("error")
      }
    } catch (e) {
      setConfigError(String(e))
      setConfigStatus("error")
    }
  }, [collection])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test harness banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          This is a test storefront &mdash; the XTAL snippet is active for{" "}
          <code className="font-mono bg-amber-100 px-1 rounded">{collection}</code>.
          Config API status:{" "}
          {configStatus === "loading" && <span className="text-amber-600">loading...</span>}
          {configStatus === "ok" && <span className="text-green-600 font-medium">connected</span>}
          {configStatus === "error" && <span className="text-red-600 font-medium">error ({configError})</span>}
        </p>
      </div>

      {/* Fake store header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-gray-800" />
            <span className="text-lg font-bold text-gray-900">Demo Store</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <span className="hover:text-gray-900 cursor-default">Shop</span>
            <span className="hover:text-gray-900 cursor-default">Collections</span>
            <span className="hover:text-gray-900 cursor-default">About</span>
            <span className="hover:text-gray-900 cursor-default">Contact</span>
          </nav>
        </div>
      </header>

      {/* Search section */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find what you&apos;re looking for</h1>
          <p className="text-gray-500">Search our catalog using natural language</p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="max-w-xl mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="What are you looking for?"
              className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>

        {/* Placeholder product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <span className="text-gray-300 text-sm">Product {i + 1}</span>
              </div>
              <div className="p-3">
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Config debug panel */}
      {config && (
        <div className="max-w-6xl mx-auto px-6 pb-10">
          <details className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
              Config API Response (debug)
            </summary>
            <div className="px-4 pb-4">
              <pre className="text-xs bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto font-mono">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* Inject the XTAL snippet — currently just loads config */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // XTAL snippet stub — client library not yet built
            (function() {
              console.log('[XTAL Test Harness] Snippet active for collection: ${collection}');
              fetch('/api/xtal/config?shopId=${collection}')
                .then(r => r.json())
                .then(config => {
                  console.log('[XTAL Test Harness] Config loaded:', config);
                })
                .catch(err => {
                  console.error('[XTAL Test Harness] Config fetch failed:', err);
                });
            })();
          `,
        }}
      />
    </div>
  )
}
