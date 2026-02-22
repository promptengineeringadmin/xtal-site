type CleanupFn = () => void

export function attachInterceptor(
  selector: string,
  onQuery: (query: string) => void,
  debounceMs = 300
): CleanupFn {
  let timer: ReturnType<typeof setTimeout> | null = null
  let observer: MutationObserver | null = null
  let giveUpTimer: ReturnType<typeof setTimeout> | null = null
  const cleanups: CleanupFn[] = []

  function debounce(fn: () => void, ms: number) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(fn, ms)
  }

  function hookInput(input: HTMLInputElement) {
    // Debounced input listener
    const handleInput = () => {
      const value = input.value.trim()
      if (value.length >= 2) {
        debounce(() => onQuery(value), debounceMs)
      }
    }

    input.addEventListener("input", handleInput)
    cleanups.push(() => input.removeEventListener("input", handleInput))

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
    if (timer) clearTimeout(timer)
  }
}
