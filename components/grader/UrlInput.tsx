"use client"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"

interface UrlInputProps {
  onSubmit: (url: string) => void
  loading?: boolean
}

const EXAMPLE_STORES = [
  "allbirds.com",
  "gymshark.com",
  "bombas.com",
]

export default function UrlInput({ onSubmit, loading }: UrlInputProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmed = url.trim()
    if (!trimmed) {
      setError("Please enter a store URL")
      return
    }

    // Basic URL validation
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    try {
      new URL(withProtocol)
    } catch {
      setError("Please enter a valid URL")
      return
    }

    onSubmit(trimmed)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (error) setError("")
              }}
              placeholder="Enter any store URL (e.g., mystore.com)"
              disabled={loading}
              className="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-xl text-lg focus:ring-2 focus:ring-xtal-navy outline-none disabled:opacity-50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-xtal-navy text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </span>
            ) : (
              "Grade Search"
            )}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
        )}
      </form>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
        <span>Try:</span>
        {EXAMPLE_STORES.map((store) => (
          <button
            key={store}
            onClick={() => {
              setUrl(store)
              onSubmit(store)
            }}
            disabled={loading}
            className="px-3 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-xtal-navy/30 hover:text-xtal-navy transition-colors disabled:opacity-50"
          >
            {store}
          </button>
        ))}
      </div>
    </div>
  )
}
