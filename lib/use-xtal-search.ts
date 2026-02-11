"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type {
  Product,
  SearchContext,
  SearchResponse,
  AspectsResponse,
  PriceRange,
} from "./xtal-types"

export function useXtalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queryTime, setQueryTime] = useState(0)

  // search_context — cached from first response, sent back on filter-in-place
  const [searchContext, setSearchContext] = useState<SearchContext | null>(null)

  // Aspects
  const [aspects, setAspects] = useState<string[]>([])
  const [selectedAspects, setSelectedAspects] = useState<string[]>([])

  // Facets (from computed_facets) — populated in M2
  const [computedFacets, setComputedFacets] = useState<Record<string, Record<string, number>> | null>(null)
  const [activeFacetFilters, setActiveFacetFilters] = useState<Record<string, string[]>>({})

  // Price
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null)

  // Relevance scores
  const [relevanceScores, setRelevanceScores] = useState<Record<string, number>>({})

  // Abort controller for cancelling in-flight requests
  const abortRef = useRef<AbortController | null>(null)

  // Explain cache: query::productId → explanation text
  const explainCache = useRef<Map<string, string>>(new Map())

  // --- Full search (new query) ---
  const search = useCallback(async (newQuery: string) => {
    const trimmed = newQuery.trim()
    if (!trimmed) return

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Full reset
    setQuery(trimmed)
    setResults([])
    setTotal(0)
    setError(null)
    setLoading(true)
    setSearchContext(null)
    setAspects([])
    setSelectedAspects([])
    setComputedFacets(null)
    setActiveFacetFilters({})
    setPriceRange(null)
    setRelevanceScores({})
    explainCache.current.clear()

    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set("q", trimmed)
    window.history.replaceState({}, "", url.toString())

    try {
      // Fire search + aspects in parallel
      const [searchRes, aspectsRes] = await Promise.all([
        fetch("/api/xtal/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        }),
        fetch("/api/xtal/aspects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        }),
      ])

      if (controller.signal.aborted) return

      const searchData: SearchResponse = await searchRes.json()
      const aspectsData: AspectsResponse = await aspectsRes.json()

      if (controller.signal.aborted) return

      setResults(searchData.results || [])
      setTotal(searchData.total || 0)
      setQueryTime(searchData.query_time || 0)
      setRelevanceScores(searchData.relevance_scores || {})
      setSearchContext(searchData.search_context || null)
      setComputedFacets(searchData.computed_facets || null)
      setAspects(aspectsData.aspects || [])
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      console.error("Search error:", err)
      setError("Search failed. Please try again.")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  // --- Filter-in-place (shared helper) ---
  const filterInPlace = useCallback(async (
    overrides: {
      selectedAspects?: string[]
      facetFilters?: Record<string, string[]>
      priceRange?: PriceRange | null
    } = {}
  ) => {
    if (!searchContext) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    const aspectsToSend = overrides.selectedAspects ?? selectedAspects
    const facetsToSend = overrides.facetFilters ?? activeFacetFilters
    const priceToSend = overrides.priceRange !== undefined ? overrides.priceRange : priceRange

    const hasActiveFacets = Object.values(facetsToSend).some(v => v.length > 0)

    try {
      const res = await fetch("/api/xtal/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          search_context: searchContext,
          selected_aspects: aspectsToSend.length > 0 ? aspectsToSend : undefined,
          facet_filters: hasActiveFacets ? facetsToSend : undefined,
          price_range: priceToSend ?? undefined,
        }),
        signal: controller.signal,
      })

      if (controller.signal.aborted) return

      const data: SearchResponse = await res.json()

      if (controller.signal.aborted) return

      setResults(data.results || [])
      setTotal(data.total || 0)
      setQueryTime(data.query_time || 0)
      setRelevanceScores(data.relevance_scores || {})
      setComputedFacets(data.computed_facets || null)
      // Do NOT update searchContext — keep the original
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      console.error("Filter error:", err)
      setError("Filter failed. Please try again.")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [query, searchContext, selectedAspects, activeFacetFilters, priceRange])

  // --- Aspect selection ---
  const selectAspect = useCallback(async (aspect: string) => {
    const updated = [...selectedAspects, aspect]
    setSelectedAspects(updated)
    await filterInPlace({ selectedAspects: updated })
  }, [selectedAspects, filterInPlace])

  const removeAspect = useCallback(async (aspect: string) => {
    const updated = selectedAspects.filter(a => a !== aspect)
    setSelectedAspects(updated)
    await filterInPlace({ selectedAspects: updated })
  }, [selectedAspects, filterInPlace])

  // --- Facet filter toggle ---
  const applyFacetFilter = useCallback(async (prefix: string, value: string) => {
    const current = activeFacetFilters[prefix] || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]

    const newFilters = { ...activeFacetFilters }
    if (updated.length > 0) {
      newFilters[prefix] = updated
    } else {
      delete newFilters[prefix]
    }

    setActiveFacetFilters(newFilters)
    await filterInPlace({ facetFilters: newFilters })
  }, [activeFacetFilters, filterInPlace])

  // --- Price range ---
  const applyPriceRange = useCallback(async (range: PriceRange | null) => {
    setPriceRange(range)
    await filterInPlace({ priceRange: range })
  }, [filterInPlace])

  // --- Clear all filters ---
  const clearAllFilters = useCallback(async () => {
    setActiveFacetFilters({})
    setPriceRange(null)
    setSelectedAspects([])
    await filterInPlace({
      selectedAspects: [],
      facetFilters: {},
      priceRange: null,
    })
  }, [filterInPlace])

  // --- Explain (on-demand, cached) ---
  const explain = useCallback(async (productId: string, score?: number): Promise<string> => {
    const cacheKey = `${query}::${productId}`
    const cached = explainCache.current.get(cacheKey)
    if (cached) return cached

    try {
      const res = await fetch("/api/xtal/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, product_id: productId, score }),
      })
      const data = await res.json()
      const explanation = data.explanation || "No explanation available."
      explainCache.current.set(cacheKey, explanation)
      return explanation
    } catch {
      return "Failed to load explanation."
    }
  }, [query])

  // --- Auto-search from URL on mount ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get("q")
    if (q) {
      search(q)
    }
  }, [search])

  return {
    query,
    results,
    total,
    loading,
    error,
    queryTime,
    searchContext,
    aspects,
    selectedAspects,
    computedFacets,
    activeFacetFilters,
    priceRange,
    relevanceScores,
    search,
    selectAspect,
    removeAspect,
    applyFacetFilter,
    applyPriceRange,
    clearAllFilters,
    explain,
  }
}
