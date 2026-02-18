"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"

const DEFAULT_SUGGESTIONS = [
  "cozy gift for someone who is always cold",
  "hosting a dinner party this weekend",
  "make my bathroom feel like a spa",
  "dainty jewelry for everyday wear",
  "setting up a home cocktail bar",
]

interface SearchBarProps {
  onSearch: (query: string) => void
  loading: boolean
  initialQuery?: string
  hasSearched?: boolean
  suggestions?: string[]
}

export default function SearchBar({ onSearch, loading, initialQuery = "", hasSearched = false, suggestions }: SearchBarProps) {
  const [value, setValue] = useState(initialQuery)

  useEffect(() => {
    setValue(initialQuery)
  }, [initialQuery])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) {
      onSearch(value.trim())
    }
  }

  function handleSuggestion(suggestion: string) {
    setValue(suggestion)
    onSearch(suggestion)
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Describe what a customer is looking for..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-xtal-navy/30 focus:border-xtal-navy
                       transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="px-6 py-3 bg-xtal-navy text-white rounded-lg text-sm font-medium
                     hover:bg-xtal-navy/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {!hasSearched && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 py-1">Example queries:</span>
          {(suggestions ?? DEFAULT_SUGGESTIONS).map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600
                         hover:border-xtal-navy hover:text-xtal-navy transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
