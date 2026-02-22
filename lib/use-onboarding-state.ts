"use client"

import { useState, useCallback, useEffect } from "react"

const SEARCH_COUNT_KEY = "xtal_search_count"
const EXPLAIN_USED_KEY = "xtal_explain_used"

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private browsing or quota exceeded — silently ignore
  }
}

export function useOnboardingState() {
  const [searchCount, setSearchCount] = useState(0)
  const [hasUsedExplain, setHasUsedExplain] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const count = parseInt(safeGetItem(SEARCH_COUNT_KEY) || "0", 10)
    setSearchCount(isNaN(count) ? 0 : count)
    setHasUsedExplain(safeGetItem(EXPLAIN_USED_KEY) === "true")
  }, [])

  const incrementSearchCount = useCallback(() => {
    setSearchCount((prev) => {
      const next = prev + 1
      safeSetItem(SEARCH_COUNT_KEY, String(next))
      return next
    })
  }, [])

  const markExplainUsed = useCallback(() => {
    setHasUsedExplain(true)
    safeSetItem(EXPLAIN_USED_KEY, "true")
  }, [])

  return {
    isFirstSearch: searchCount === 0,
    hasUsedExplain,
    incrementSearchCount,
    markExplainUsed,
  }
}
