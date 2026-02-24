type CleanupFn = () => void

export function attachInterceptor(
  selector: string,
  onQuery: (query: string) => void
): CleanupFn {
  let observer: MutationObserver | null = null
  let giveUpTimer: ReturnType<typeof setTimeout> | null = null
  const cleanups: CleanupFn[] = []

  function hookInput(input: HTMLInputElement) {
    // Intercept form submit
    const form = input.closest("form")
    if (form) {
      const handleSubmit = (e: Event) => {
        e.preventDefault()
        const value = input.value.trim()
        if (value.length >= 1) {
          onQuery(value)
        }
      }
      form.addEventListener("submit", handleSubmit)
      cleanups.push(() => form.removeEventListener("submit", handleSubmit))
    }

    // Enter key on input (fallback when no wrapping <form>)
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        const value = input.value.trim()
        if (value.length >= 1) {
          onQuery(value)
        }
      }
    }
    input.addEventListener("keydown", handleKeydown)
    cleanups.push(() => input.removeEventListener("keydown", handleKeydown))
  }

  // Try to find the input immediately
  const input = document.querySelector<HTMLInputElement>(selector)
  if (input) {
    hookInput(input)
    return () => cleanups.forEach((fn) => fn())
  }

  // Fallback: MutationObserver for late-rendered inputs
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (!(node instanceof HTMLElement)) continue
        const match = node.matches(selector)
          ? (node as HTMLInputElement)
          : node.querySelector<HTMLInputElement>(selector)
        if (match) {
          hookInput(match)
          observer?.disconnect()
          observer = null
          if (giveUpTimer) clearTimeout(giveUpTimer)
          giveUpTimer = null
          return
        }
      }
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })

  // Give up after 10 seconds
  giveUpTimer = setTimeout(() => {
    observer?.disconnect()
    observer = null
    console.warn(`[xtal.js] Could not find input matching "${selector}" after 10s`)
  }, 10000)

  return () => {
    cleanups.forEach((fn) => fn())
    observer?.disconnect()
    observer = null
    if (giveUpTimer) clearTimeout(giveUpTimer)
  }
}
