type CleanupFn = () => void

export function attachInterceptor(
  selector: string,
  onQuery: (query: string) => void,
  observerTimeoutMs?: number
): CleanupFn {
  let currentInput: HTMLInputElement | null = null
  let currentCleanup: CleanupFn | null = null
  let fallbackCleanup: CleanupFn | null = null
  let mode: "seeking" | "guarding" = "seeking"

  /** Hook a specific input element with capture-phase listeners */
  function hookInput(input: HTMLInputElement): CleanupFn {
    const cleanups: CleanupFn[] = []

    const submitQuery = () => {
      const value = input.value.trim()
      if (value.length >= 1) onQuery(value)
    }

    const form = input.closest("form")
    if (form) {
      const handleSubmit = (e: Event) => {
        e.preventDefault()
        e.stopImmediatePropagation()
        submitQuery()
      }
      form.addEventListener("submit", handleSubmit, true)
      cleanups.push(() => form.removeEventListener("submit", handleSubmit, true))
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopImmediatePropagation()
        submitQuery()
      }
    }
    input.addEventListener("keydown", handleKeydown, true)
    cleanups.push(() => input.removeEventListener("keydown", handleKeydown, true))

    // Mobile enhancements: zoom prevention + search button
    const isMobile = window.matchMedia("(max-width: 767px)").matches
    if (isMobile) {
      // Prevent iOS auto-zoom on input focus (requires font-size >= 16px)
      const currentSize = parseFloat(getComputedStyle(input).fontSize) || 0
      if (currentSize < 16) input.style.fontSize = "16px"
      input.style.touchAction = "manipulation"
      input.style.maxWidth = "100%"
      input.style.boxSizing = "border-box"

      // Inject a visible search submit button
      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "xtal-mobile-search-btn"
      btn.setAttribute("aria-label", "Search")
      btn.style.cssText =
        "position:absolute;right:4px;top:50%;transform:translateY(-50%);" +
        "width:34px;height:34px;border:none;border-radius:50%;" +
        "background:#333;color:#fff;cursor:pointer;" +
        "display:flex;align-items:center;justify-content:center;" +
        "z-index:1;padding:0;flex-shrink:0;"
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg>'
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        submitQuery()
      })

      // Make room for the button inside the input
      input.style.paddingRight = "42px"

      const parent = input.parentElement
      if (parent) {
        const pos = getComputedStyle(parent).position
        if (pos === "static") parent.style.position = "relative"
        parent.appendChild(btn)
        cleanups.push(() => btn.remove())
      }
    }

    return () => cleanups.forEach((fn) => fn())
  }

  /** Temporary delegated listener while seeking replacement element */
  function installFallback() {
    removeFallback()
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      const target = e.target as HTMLElement
      if (!target.matches?.(selector)) return
      e.preventDefault()
      // NO stopImmediatePropagation — safe for third-party SDK
      const value = (target as HTMLInputElement).value.trim()
      if (value.length >= 1) onQuery(value)
    }
    document.body.addEventListener("keydown", handler, true)
    fallbackCleanup = () => document.body.removeEventListener("keydown", handler, true)
  }

  function removeFallback() {
    fallbackCleanup?.()
    fallbackCleanup = null
  }

  /** Try to find and hook the input element */
  function tryHook(): boolean {
    const input = document.querySelector<HTMLInputElement>(selector)
    if (!input || input === currentInput) return false
    currentCleanup?.()
    currentCleanup = hookInput(input)
    currentInput = input
    mode = "guarding"
    removeFallback()
    return true
  }

  /** Check if the current element was removed from the DOM */
  function checkRemoved(mutations: MutationRecord[]) {
    if (!currentInput) return
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.removedNodes)) {
        if (node === currentInput || (node instanceof HTMLElement && node.contains(currentInput))) {
          currentCleanup?.()
          currentCleanup = null
          currentInput = null
          mode = "seeking"
          installFallback()
          return
        }
      }
    }
  }

  // Try immediate hook
  tryHook()

  // Persistent observer — seeks new elements, guards existing ones
  const observer = new MutationObserver((mutations) => {
    if (mode === "guarding") {
      checkRemoved(mutations)
    }
    if (mode === "seeking") {
      tryHook()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  // Timeout: stop seeking but keep guarding if already hooked
  const timeoutMs = observerTimeoutMs ?? 10000
  const giveUpTimer = setTimeout(() => {
    if (mode === "seeking" && !currentInput) {
      observer.disconnect()
      removeFallback()
      console.warn(`[xtal.js] Could not find input matching "${selector}" after ${timeoutMs / 1000}s`)
    }
    // If guarding, observer stays active to detect future removal
  }, timeoutMs)

  // Master cleanup
  return () => {
    clearTimeout(giveUpTimer)
    observer.disconnect()
    currentCleanup?.()
    removeFallback()
    currentInput = null
  }
}
