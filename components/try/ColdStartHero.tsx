"use client"

import { useState } from "react"
import { Search } from "lucide-react"

interface ColdStartHeroProps {
  onSearch: (query: string) => void
  loading: boolean
}

export default function ColdStartHero({ onSearch, loading }: ColdStartHeroProps) {
  const [value, setValue] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) {
      onSearch(value.trim())
    }
  }

  return (
    <section className="relative pt-6 pb-4 md:pt-12 md:pb-8 lg:pt-24 lg:pb-16 overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-4 md:mb-8">
          Find exactly<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient">
            what you&apos;re looking for.
          </span>
        </h1>
        <p className="text-base md:text-xl text-slate-600 mb-6 md:mb-12 max-w-2xl mx-auto leading-relaxed">
          XTAL Search works differently. Describe your need, not the product name.
          Try one of the examples below to see what comes back.
        </p>

        {/* Search bar with glow */}
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto group px-4 md:px-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-900/5 flex items-center p-2 pl-6">
            <Search className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors shrink-0" />
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Describe what you're looking for..."
              className="w-full bg-transparent border-0 focus:ring-0 text-base md:text-lg py-3 md:py-4 px-3 md:px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="bg-slate-900 text-white px-5 md:px-8 py-3 md:py-4 rounded-xl font-medium hover:bg-indigo-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors shadow-sm ml-2 whitespace-nowrap shrink-0"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
