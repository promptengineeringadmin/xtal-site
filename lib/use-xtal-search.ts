"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import type {
  Product,
  SearchContext,
  SearchResponse,
  AspectsResponse,
  PriceRange,
} from "./xtal-types"
import { normalizeFacets, expandFilters } from "./facet-utils"

type LoadingState =
  | { type: "idle" }
  | { type: "searching" }
  | { type: "filtering" }

export function useXtalSearch(collection?: string, initialQuery?: string, initialSearchData?: SearchResponse | null, defaultResultsPerPage?: number) {
  const [query, setQuery] = useState(initialQuery || "")
  const [results, setResults] = useState<Product[]>(initialSearchData?.results || [])
  const [total, setTotal] = useState(initialSearchData?.total || 0)
  const [loadingState, setLoadingState] = useState<LoadingState>({ type: "idle" })
  const [error, setError] = useState<string | null>(null)
  const [queryTime, setQueryTime] = useState(initialSearchData?.query_time || 0)

  // search_context — cached from first response, sent back on filter-in-place
  const [searchContext, setSearchContext] = useState<SearchContext | null>(initialSearchData?.search_context || null)

  // Aspects
  const [aspects, setAspects] = useState<string[]>([])
  const [selectedAspects, setSelectedAspects] = useState<string[]>([])

  // Facets (from computed_facets) — populated in M2
  const [computedFacets, setComputedFacets] = useState<Record<string, Record<string, number>> | null>(initialSearchData?.computed_facets || null)
  const [activeFacetFilters, setActiveFacetFilters] = useState<Record<string, string[]>>({})

  // Expansion map: canonical facet value → original backend values (for synonym normalization)
  const facetExpansionMap = useRef<Record<string, Record<string, string[]>>>({})

  // Synonym groups loaded from /api/admin/synonyms on mount
  const synonymGroups = useRef<string[][]>([])

  /** Normalize raw facets from the backend and store the expansion map */
  function setNormalizedFacets(raw: Record<string, Record<string, number>> | null) {
    if (!raw) {
      setComputedFacets(null)
      facetExpansionMap.current = {}
      return
    }
    const { facets, expansionMap } = normalizeFacets(raw, synonymGroups.current)
    setComputedFacets(facets)
    facetExpansionMap.current = expansionMap
  }

  // Price
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null)

  // Relevance scores
  const [relevanceScores, setRelevanceScores] = useState<Record<string, number>>(initialSearchData?.relevance_scores || {})

  // Sort
  const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc">("relevance")

  // Results per page
  const [resultsPerPage, setResultsPerPage] = useState<number>(defaultResultsPerPage || 48)

  // Abort controller for cancelling in-flight requests
  const abortRef = useRef<AbortController | null>(null)

  // Explain cache: query::productId → { explanation, prompt_hash }
  const explainCache = useRef<Map<string, { explanation: string; prompt_hash: string }>>(new Map())

  // --- Full search (new query) ---
  const search = useCallback(async (newQuery: string, previewResults?: Product[]) => {
    const trimmed = newQuery.trim()
    if (!trimmed) return

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Full reset — if previewResults provided, show them instantly instead of empty
    setQuery(trimmed)
    setResults(previewResults || [])
    setTotal(0)
    setError(null)
    setLoadingState({ type: "searching" })
    setSearchContext(null)
    setAspects([])
    setSelectedAspects([])
    setComputedFacets(null)
    setActiveFacetFilters({})
    setPriceRange(null)
    setRelevanceScores({})
    setSortBy("relevance")
    explainCache.current.clear()

    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set("q", trimmed)
    window.history.replaceState({}, "", url.toString())

    try {
      // Fire search + aspects in parallel
      const searchBody = JSON.stringify({ query: trimmed, limit: resultsPerPage, ...(collection && { collection }) })
      const searchInit: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: searchBody,
        signal: controller.signal,
      }

      let [searchRes, aspectsRes] = await Promise.all([
        fetch("/api/xtal/search", searchInit),
        fetch("/api/xtal/aspects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, ...(collection && { collection }) }),
          signal: controller.signal,
        }),
      ])

      if (controller.signal.aborted) return

      // Auto-retry once on cold-start errors (502/504)
      if (!searchRes.ok && (searchRes.status === 502 || searchRes.status === 504) && !controller.signal.aborted) {
        searchRes = await fetch("/api/xtal/search", searchInit)
      }

      if (controller.signal.aborted) return

      if (!searchRes.ok) {
        setError("Search failed. Please try again.")
        return
      }

      const searchData: SearchResponse = await searchRes.json()
      const aspectsData: AspectsResponse & { aspects_enabled?: boolean } = aspectsRes.ok ? await aspectsRes.json() : { aspects: [] }

      if (controller.signal.aborted) return

      setResults(searchData.results || [])
      setTotal(searchData.total || 0)
      setQueryTime(searchData.query_time || 0)
      setRelevanceScores(searchData.relevance_scores || {})
      setSearchContext(searchData.search_context || null)

      // Debug: surface whether backend returns facets at all
      if (!searchData.computed_facets) {
        console.warn("Search response missing computed_facets — backend returned none.")
      } else if (Object.keys(searchData.computed_facets).length === 0) {
        console.warn("Search response has empty computed_facets {} — products may lack {prefix}_{value} tags.")
      }
      setNormalizedFacets(searchData.computed_facets || null)

      setAspects(aspectsData.aspects_enabled !== false ? (aspectsData.aspects || []) : [])
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      console.error("Search error:", err)
      setError("Search failed. Please try again.")
    } finally {
      if (!controller.signal.aborted) {
        setLoadingState({ type: "idle" })
      }
    }
  }, [collection, resultsPerPage])

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

    setLoadingState({ type: "filtering" })
    setError(null)

    const aspectsToSend = overrides.selectedAspects ?? selectedAspects
    const facetsToSend = overrides.facetFilters ?? activeFacetFilters
    const priceToSend = overrides.priceRange !== undefined ? overrides.priceRange : priceRange

    // Expand canonical facet values back to originals for the backend
    const expandedFacets = expandFilters(facetsToSend, facetExpansionMap.current)
    const hasActiveFacets = Object.values(expandedFacets).some(v => v.length > 0)

    // Price range — slider values are already in dollars, same as Qdrant
    const priceRangeForApi = priceToSend
      ? {
        min: priceToSend.min,
        max: priceToSend.max,
      }
      : undefined

    try {
      const res = await fetch("/api/xtal/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          search_context: searchContext,
          selected_aspects: aspectsToSend.length > 0 ? aspectsToSend : undefined,
          facet_filters: hasActiveFacets ? expandedFacets : undefined,
          price_range: priceRangeForApi,
          limit: resultsPerPage,
          ...(collection && { collection }),
        }),
        signal: controller.signal,
      })

      if (controller.signal.aborted) return

      if (!res.ok) {
        setError("Filter failed. Please try again.")
        return
      }

      const data: SearchResponse = await res.json()

      if (controller.signal.aborted) return

      setResults(data.results || [])
      setTotal(data.total || 0)
      setQueryTime(data.query_time || 0)
      setRelevanceScores(data.relevance_scores || {})
      setNormalizedFacets(data.computed_facets || null)
      // Do NOT update searchContext — keep the original
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      console.error("Filter error:", err)
      setError("Filter failed. Please try again.")
    } finally {
      if (!controller.signal.aborted) {
        setLoadingState({ type: "idle" })
      }
    }
  }, [query, searchContext, selectedAspects, activeFacetFilters, priceRange, resultsPerPage, collection])

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

  // --- Change results per page ---
  const changeResultsPerPage = useCallback(async (value: number) => {
    setResultsPerPage(value)
    // Re-search with new limit if we have an active search
    if (searchContext) {
      // We need to manually trigger filterInPlace since resultsPerPage state
      // won't have updated yet in this callback's closure
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoadingState({ type: "filtering" })
      setError(null)

      const expandedFacets = expandFilters(activeFacetFilters, facetExpansionMap.current)
      const hasActiveFacets = Object.values(expandedFacets).some(v => v.length > 0)
      const priceRangeForApi = priceRange
        ? { min: priceRange.min, max: priceRange.max }
        : undefined

      try {
        const res = await fetch("/api/xtal/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            search_context: searchContext,
            selected_aspects: selectedAspects.length > 0 ? selectedAspects : undefined,
            facet_filters: hasActiveFacets ? expandedFacets : undefined,
            price_range: priceRangeForApi,
            limit: value,
            ...(collection && { collection }),
          }),
          signal: controller.signal,
        })

        if (controller.signal.aborted) return
        if (!res.ok) {
          setError("Filter failed. Please try again.")
          return
        }

        const data: SearchResponse = await res.json()
        if (controller.signal.aborted) return

        setResults(data.results || [])
        setTotal(data.total || 0)
        setQueryTime(data.query_time || 0)
        setRelevanceScores(data.relevance_scores || {})
        setNormalizedFacets(data.computed_facets || null)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        console.error("Results per page change error:", err)
        setError("Failed to update results. Please try again.")
      } finally {
        if (!controller.signal.aborted) {
          setLoadingState({ type: "idle" })
        }
      }
    }
  }, [query, searchContext, selectedAspects, activeFacetFilters, priceRange, collection])

  // --- Explain (on-demand, cached) ---
  const explain = useCallback(async (productId: string, score?: number): Promise<{ explanation: string; prompt_hash: string }> => {
    const cacheKey = `${query}::${productId}`
    const cached = explainCache.current.get(cacheKey)
    if (cached) return cached

    try {
      const res = await fetch("/api/xtal/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, product_id: productId, score, ...(collection && { collection }) }),
      })
      if (!res.ok) {
        const errBody = await res.text()
        console.error(`Explain API error ${res.status}:`, errBody)
        return { explanation: `Explanation unavailable (${res.status}).`, prompt_hash: "" }
      }
      const data = await res.json()
      const result = {
        explanation: data.explanation || "No explanation available.",
        prompt_hash: data.prompt_hash || "",
      }
      explainCache.current.set(cacheKey, result)
      return result
    } catch (err) {
      console.error("Explain fetch error:", err)
      return { explanation: "Failed to load explanation.", prompt_hash: "" }
    }
  }, [query, collection])

  // --- Report irrelevant (fire-and-forget + remove from results) ---
  const reportIrrelevant = useCallback((product: Product, score?: number) => {
    // Remove from results immediately
    setResults((prev) => prev.filter((p) => p.id !== product.id))
    setTotal((prev) => Math.max(0, prev - 1))

    // Get prompt_hash from explain cache if available
    const cacheKey = `${query}::${product.id}`
    const cached = explainCache.current.get(cacheKey)

    // Fire-and-forget feedback POST (enriched payload for search quality log)
    fetch("/api/xtal/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        product_id: product.id,
        product_title: product.title,
        product_vendor: product.vendor,
        product_type: product.product_type,
        product_tags: product.tags,
        product_price: product.price,
        product_image_url: product.image_url || product.featured_image || product.images?.[0]?.src || null,
        augmented_query: searchContext?.augmented_query || null,
        score,
        action: "irrelevant",
        ...(cached?.prompt_hash && { prompt_hash: cached.prompt_hash }),
        ...(collection && { collection }),
      }),
    }).catch((err) => console.error("Feedback submission error:", err))
  }, [query, collection, searchContext])

  // --- Report well put (fire-and-forget, card stays visible) ---
  const reportWellPut = useCallback((product: Product, score?: number) => {
    const cacheKey = `${query}::${product.id}`
    const cached = explainCache.current.get(cacheKey)

    fetch("/api/xtal/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        product_id: product.id,
        product_title: product.title,
        product_vendor: product.vendor,
        product_type: product.product_type,
        product_tags: product.tags,
        product_price: product.price,
        product_image_url: product.image_url || product.featured_image || product.images?.[0]?.src || null,
        augmented_query: searchContext?.augmented_query || null,
        score,
        action: "well_put",
        ...(cached?.prompt_hash && { prompt_hash: cached.prompt_hash }),
        ...(collection && { collection }),
      }),
    }).catch((err) => console.error("Feedback submission error:", err))
  }, [query, collection, searchContext])

  // --- Report storefront events (fire-and-forget) ---
  const reportStorefrontEvent = useCallback((action: "click" | "add_to_cart", productId: string, extraData?: Record<string, any>) => {
    fetch("/api/xtal/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        product_id: productId,
        ...(query && { query }),
        ...(collection && { collection }),
        ...(extraData || {}),
      }),
    }).catch((err) => console.error("Storefront event submission error:", err))
  }, [query, collection])

  // --- Load synonym groups + auto-search from URL on mount ---
  useEffect(() => {
    // Fire synonyms fetch (non-blocking — only needed for facet normalization)
    const synonymsReady = fetch("/api/admin/synonyms")
      .then((res) => (res.ok ? res.json() : { groups: [] }))
      .then((data) => { synonymGroups.current = data.groups || [] })
      .catch(() => { })

    if (initialSearchData) {
      // SSR data — fire aspects immediately (no dependency on synonyms)
      if (initialQuery) {
        fetch("/api/xtal/aspects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: initialQuery, ...(collection && { collection }) }),
        })
          .then((res) => (res.ok ? res.json() : { aspects: [] }))
          .then((data) => setAspects(data.aspects_enabled !== false ? (data.aspects || []) : []))
          .catch(() => { })
      }

      // Normalize facets once synonyms are loaded (needs synonym groups for merging)
      if (initialSearchData.computed_facets) {
        synonymsReady.then(() => {
          setNormalizedFacets(initialSearchData.computed_facets!)
        })
      }
    } else {
      // No SSR data — wait for synonyms then auto-search from URL
      synonymsReady.then(() => {
        const params = new URLSearchParams(window.location.search)
        const q = params.get("q")
        if (q) {
          search(q)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loading = loadingState.type !== "idle"
  const isSearching = loadingState.type === "searching"
  const isFiltering = loadingState.type === "filtering"

  // Client-side sort for price; AI relevance = backend order
  const sortedResults = useMemo(() => {
    if (sortBy === "relevance") return results
    return [...results].sort((a, b) => {
      const priceA = Array.isArray(a.price) ? Math.min(...a.price) : (a.price ?? 0)
      const priceB = Array.isArray(b.price) ? Math.min(...b.price) : (b.price ?? 0)
      return sortBy === "price-asc" ? priceA - priceB : priceB - priceA
    })
  }, [results, sortBy])

  return {
    query,
    results,
    sortedResults,
    total,
    loading,
    isSearching,
    isFiltering,
    error,
    queryTime,
    searchContext,
    aspects,
    selectedAspects,
    computedFacets,
    activeFacetFilters,
    priceRange,
    relevanceScores,
    sortBy,
    setSortBy,
    resultsPerPage,
    changeResultsPerPage,
    search,
    selectAspect,
    removeAspect,
    applyFacetFilter,
    applyPriceRange,
    clearAllFilters,
    explain,
    reportIrrelevant,
    reportWellPut,
    reportStorefrontEvent,
  }
}
