"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronDown, ChevronUp, ExternalLink, ArrowLeft, Loader2 } from "lucide-react"

// --- Vibe config ---
const VIBES = [
  { id: "relax", label: "Relax", emoji: "\u{1F60C}", accent: "border-indigo-400 bg-indigo-50 text-indigo-700" },
  { id: "sleep", label: "Sleep", emoji: "\u{1F634}", accent: "border-purple-400 bg-purple-50 text-purple-700" },
  { id: "energize", label: "Energize", emoji: "\u26A1", accent: "border-amber-400 bg-amber-50 text-amber-700" },
  { id: "create", label: "Create", emoji: "\u{1F3A8}", accent: "border-pink-400 bg-pink-50 text-pink-700" },
  { id: "focus", label: "Focus", emoji: "\u{1F3AF}", accent: "border-blue-400 bg-blue-50 text-blue-700" },
  { id: "social", label: "Social", emoji: "\u{1F389}", accent: "border-green-400 bg-green-50 text-green-700" },
] as const

// --- Filter options ---
const FILTER_SECTIONS = [
  {
    key: "terpenes",
    label: "Terpenes",
    options: ["myrcene", "limonene", "caryophyllene", "pinene", "linalool", "humulene", "terpinolene", "ocimene"],
  },
  {
    key: "strains",
    label: "Strain Type",
    options: ["indica", "sativa", "hybrid", "indica-dominant-hybrid", "sativa-dominant-hybrid"],
  },
  {
    key: "effects",
    label: "Effects",
    options: ["relaxation", "euphoria", "focus", "creativity", "energy", "stress-relief", "sleep", "pain-relief", "mood-boost"],
  },
  {
    key: "formats",
    label: "Format",
    options: ["flower", "live-rosin", "crumble", "vape-pod", "nuggets", "gummies"],
  },
] as const

type FilterKey = (typeof FILTER_SECTIONS)[number]["key"]

interface BudtenderPick {
  product: {
    id: string
    title: string
    price: number
    vendor: string
    product_type: string
    image_url: string | null
    product_url: string
    tags: string[]
    available: boolean
  }
  reasoning: string
  relevance_score: number
}

interface BudtenderResponse {
  picks: BudtenderPick[]
  meta: {
    vibe?: string
    resolved_query: string
    resolved_filters: Record<string, string[]>
    total_candidates: number
    query_time_ms: number
    fallback_reason?: string
  }
}

function humanizeFilterValue(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

interface BudtenderDrawerProps {
  isOpen: boolean
  onClose: () => void
  collection: string
}

export default function BudtenderDrawer({ isOpen, onClose, collection }: BudtenderDrawerProps) {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [filters, setFilters] = useState<Record<FilterKey, string[]>>({
    terpenes: [],
    strains: [],
    effects: [],
    formats: [],
  })
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<BudtenderResponse | null>(null)
  const [view, setView] = useState<"selecting" | "results">("selecting")

  const hasSelection =
    selectedVibe !== null ||
    Object.values(filters).some((arr) => arr.length > 0)

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleFilter = useCallback((section: FilterKey, value: string) => {
    setFilters((prev) => {
      const current = prev[section]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [section]: next }
    })
  }, [])

  const resetSelections = useCallback(() => {
    setSelectedVibe(null)
    setFilters({ terpenes: [], strains: [], effects: [], formats: [] })
    setResults(null)
    setError(null)
    setView("selecting")
  }, [])

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)

    const body: Record<string, unknown> = { limit: 3 }
    if (selectedVibe) body.vibe = selectedVibe
    if (filters.terpenes.length) body.terpenes = filters.terpenes
    if (filters.strains.length) body.strains = filters.strains
    if (filters.effects.length) body.effects = filters.effects
    if (filters.formats.length) body.formats = filters.formats

    try {
      const res = await fetch("/api/xtal/budtender/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const data: BudtenderResponse = await res.json()
      setResults(data)
      setView("results")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [selectedVibe, filters])

  const goBackToFilters = useCallback(() => {
    setView("selecting")
    setError(null)
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[90vw] max-w-[420px] bg-white z-50
                     shadow-2xl transform transition-transform flex flex-col
                     ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {view === "results" && (
              <button
                onClick={goBackToFilters}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <span className="text-sm font-semibold text-slate-700">
              {view === "results" ? "Your Picks" : "Ask the Budtender"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close budtender"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {view === "selecting" ? (
            <>
              {/* Vibe selection */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  How are you feeling?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {VIBES.map((vibe) => (
                    <button
                      key={vibe.id}
                      onClick={() =>
                        setSelectedVibe((prev) => (prev === vibe.id ? null : vibe.id))
                      }
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center
                        ${
                          selectedVibe === vibe.id
                            ? vibe.accent
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      <span className="text-xl">{vibe.emoji}</span>
                      <span className="text-xs font-medium">{vibe.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  or refine further
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Filter sections */}
              {FILTER_SECTIONS.map((section) => {
                const isExpanded = expandedSections.has(section.key)
                const activeCount = filters[section.key].length
                return (
                  <div key={section.key} className="mb-2">
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="flex items-center justify-between w-full py-2 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          {section.label}
                        </span>
                        {activeCount > 0 && (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-xtal-navy text-white text-[10px] font-bold">
                            {activeCount}
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="pl-1 pb-2 space-y-1">
                        {section.options.map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-2 py-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filters[section.key].includes(opt)}
                              onChange={() => toggleFilter(section.key, opt)}
                              className="rounded border-slate-300 text-xtal-navy focus:ring-xtal-navy/30"
                            />
                            <span className="text-sm text-slate-600">
                              {humanizeFilterValue(opt)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Error */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}
            </>
          ) : (
            /* Results view */
            <>
              {results && results.picks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">
                    {results.meta.fallback_reason || "No products matched your preferences."}
                  </p>
                  <button
                    onClick={goBackToFilters}
                    className="mt-3 text-sm text-xtal-navy font-medium hover:underline"
                  >
                    Try different filters
                  </button>
                </div>
              )}

              {results &&
                results.picks.map((pick) => (
                  <div
                    key={pick.product.id}
                    className="mb-4 rounded-xl border border-slate-200 overflow-hidden bg-white"
                  >
                    {/* Product image + info */}
                    <div className="flex gap-3 p-3">
                      {pick.product.image_url && (
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-50">
                          <img
                            src={pick.product.image_url}
                            alt={pick.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-2">
                          {pick.product.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatPrice(pick.product.price)}
                          {pick.product.product_type && (
                            <span> &middot; {pick.product.product_type}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* AI reasoning */}
                    <div className="px-3 pb-3">
                      <p className="text-sm text-slate-600 italic leading-relaxed">
                        &ldquo;{pick.reasoning}&rdquo;
                      </p>
                    </div>

                    {/* View product link */}
                    <div className="px-3 pb-3">
                      <a
                        href={pick.product.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-xtal-navy hover:underline"
                      >
                        View Product
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}

              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-slate-100">
          {view === "selecting" ? (
            <button
              onClick={fetchRecommendations}
              disabled={!hasSelection || loading}
              className="w-full py-3 bg-xtal-navy text-white rounded-lg text-sm font-medium
                         hover:bg-xtal-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Finding picks...
                </>
              ) : (
                "Get Recommendations"
              )}
            </button>
          ) : (
            <button
              onClick={resetSelections}
              className="w-full py-3 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium
                         hover:bg-slate-50 transition-colors"
            >
              Try Different Vibes
            </button>
          )}
        </div>
      </div>
    </>
  )
}
