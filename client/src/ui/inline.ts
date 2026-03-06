/**
 * Inline renderer — replaces the merchant's product grid in-place.
 * No Shadow DOM: cards inherit the merchant's CSS naturally.
 *
 * Uses a persistent .xtal-layout wrapper with two slots:
 * - .xtal-rail-slot: filter rail (persists across loading/results/empty)
 * - .xtal-grid-slot: only this part updates on state changes
 */
export class InlineRenderer {
  private target: HTMLElement
  private originalHTML: string | null = null
  private originalDisplay: string = ""
  private layoutEl: HTMLElement | null = null
  private railSlot: HTMLElement | null = null
  private gridSlot: HTMLElement | null = null
  private firstSearchDone = false

  constructor(target: HTMLElement) {
    this.target = target
  }

  /** Capture original HTML on first mutation — ensures fresh snapshot */
  private captureOriginal() {
    if (this.originalHTML === null) {
      this.originalHTML = this.target.innerHTML
      // Custom elements (e.g. <shopping-multi-view>) default to display:inline.
      // Force block so children can expand to full width.
      this.originalDisplay = this.target.style.display
      this.target.style.display = "block"
      this.target.style.width = "100%"
      // Remove CSS-based early-hide style tags (CMS-injected and SDK-injected)
      const earlyHide = document.getElementById("xtal-early-hide")
      if (earlyHide) earlyHide.remove()
      const sdkEarlyHide = document.getElementById("xtal-sdk-early-hide")
      if (sdkEarlyHide) sdkEarlyHide.remove()
      // Remove CMS-injected loading container (Umbraco Header Scripts)
      const searchLoading = document.getElementById("xtal-search-loading")
      if (searchLoading) searchLoading.remove()
    }
  }

  /** Creates the persistent layout wrapper. Returns the rail slot for FilterRail to mount into. */
  initLayout(): HTMLElement {
    if (this.layoutEl) return this.railSlot!

    this.captureOriginal()
    this.target.innerHTML = ""

    this.layoutEl = document.createElement("div")
    this.layoutEl.className = "xtal-layout"

    this.railSlot = document.createElement("div")
    this.railSlot.className = "xtal-rail-slot"

    this.gridSlot = document.createElement("div")
    this.gridSlot.className = "xtal-grid-slot"

    this.layoutEl.appendChild(this.railSlot)
    this.layoutEl.appendChild(this.gridSlot)
    this.target.appendChild(this.layoutEl)

    return this.railSlot
  }

  private loadingPhraseTimer: ReturnType<typeof setInterval> | null = null

  showLoading(query?: string) {
    this.captureOriginal()
    if (this.loadingPhraseTimer) {
      clearInterval(this.loadingPhraseTimer)
      this.loadingPhraseTimer = null
    }
    const slot = this.gridSlot || this.target
    slot.innerHTML = ""

    // Inject keyframes if not already present
    if (!document.getElementById("xtal-inline-keyframes")) {
      const style = document.createElement("style")
      style.id = "xtal-inline-keyframes"
      style.textContent = [
        "@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}",
        "@keyframes xtal-pulse{0%,100%{opacity:1}50%{opacity:0.4}}",
      ].join("")
      document.head.appendChild(style)
    }

    // Measure container position for pixel-perfect spinner height (no layout shift)
    const rect = this.target.getBoundingClientRect()
    const minHeight = Math.max(200, window.innerHeight - rect.top)

    const wrap = document.createElement("div")
    wrap.style.cssText =
      `display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:60px 20px 48px;width:100%;min-height:${minHeight}px;`
    wrap.setAttribute("role", "status")
    wrap.setAttribute("aria-live", "polite")

    // Spinner ring with sparkle icon
    const ring = document.createElement("div")
    ring.style.cssText =
      "position:relative;width:48px;height:48px;margin-bottom:12px;"
    const track = document.createElement("div")
    track.style.cssText =
      "position:absolute;inset:0;border:3px solid #e5e5e5;border-radius:50%;"
    const spinner = document.createElement("div")
    spinner.style.cssText =
      "position:absolute;inset:0;border:3px solid transparent;border-top-color:#1d1d1b;border-radius:50%;animation:xtal-inline-spin .8s linear infinite;"
    const sparkle = document.createElement("div")
    sparkle.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"
    sparkle.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:xtal-pulse 2s ease-in-out infinite"><path d="M12 3l1.91 5.49L19.4 10.4l-5.49 1.91L12 17.8l-1.91-5.49L4.6 10.4l5.49-1.91z"/><path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5z"/><path d="M5 18l.5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5z"/></svg>'
    ring.appendChild(track)
    ring.appendChild(spinner)
    ring.appendChild(sparkle)

    // Coaching copy — above the sparkle so it's visible immediately
    const phrases = [
      "While we gather your results, here\u2019s how XTAL works",
      "XTAL understands full phrases, not just keywords",
      "For really effective results, try searching the way you\u2019d ask a friend",
      "Know the right SKU or product name? That works too",
      "Finding your results\u2026",
    ]
    const phraseEl = document.createElement("p")
    phraseEl.style.cssText =
      "margin:0 0 16px 0;font-size:13px;line-height:1.5;color:#767676;text-align:center;transition:opacity 0.3s;min-height:2.6em;display:flex;align-items:center;justify-content:center;"
    phraseEl.textContent = phrases[0]
    wrap.appendChild(phraseEl)

    // Sparkle spinner
    wrap.appendChild(ring)

    // Query echo
    if (query) {
      const displayQuery = query.length > 80 ? query.slice(0, 77) + "…" : query
      const queryEl = document.createElement("p")
      queryEl.style.cssText =
        "margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;"
      queryEl.textContent = `"${displayQuery}"`
      wrap.appendChild(queryEl)
    }

    let idx = this.firstSearchDone ? 1 + Math.floor(Math.random() * (phrases.length - 1)) : 0
    this.firstSearchDone = true
    phraseEl.textContent = phrases[idx]
    this.loadingPhraseTimer = setInterval(() => {
      phraseEl.style.opacity = "0"
      setTimeout(() => {
        idx = (idx + 1) % phrases.length
        phraseEl.textContent = phrases[idx]
        phraseEl.style.opacity = "1"
      }, 400)
    }, 2500)

    slot.appendChild(wrap)
  }

  private clearPhraseTimer() {
    if (this.loadingPhraseTimer) {
      clearInterval(this.loadingPhraseTimer)
      this.loadingPhraseTimer = null
    }
  }

  /** Dim existing grid + show small overlay spinner (for filter refinements) */
  showFilterLoading() {
    const slot = this.gridSlot || this.target
    const grid = slot.querySelector<HTMLElement>(".xtal-grid")
    if (grid) {
      grid.style.opacity = "0.5"
      grid.style.pointerEvents = "none"
      grid.style.transition = "opacity 0.15s"
    }
    // Add small overlay spinner if not already present
    if (!slot.querySelector(".xtal-filter-spinner")) {
      const overlay = document.createElement("div")
      overlay.className = "xtal-filter-spinner"
      overlay.style.cssText =
        "position:absolute;top:20px;left:50%;transform:translateX(-50%);z-index:10;" +
        "width:32px;height:32px;border:3px solid #e5e5e5;border-top-color:#1d1d1b;" +
        "border-radius:50%;animation:xtal-inline-spin .8s linear infinite;"
      // Ensure slot is positioned for absolute child
      if (getComputedStyle(slot).position === "static") {
        slot.style.position = "relative"
      }
      slot.appendChild(overlay)
    }
  }

  /** Remove filter loading state (dim + spinner) */
  private clearFilterLoading() {
    const slot = this.gridSlot || this.target
    const grid = slot.querySelector<HTMLElement>(".xtal-grid")
    if (grid) {
      grid.style.opacity = ""
      grid.style.pointerEvents = ""
      grid.style.transition = ""
    }
    const spinner = slot.querySelector(".xtal-filter-spinner")
    if (spinner) spinner.remove()
  }

  renderCards(cards: HTMLElement[]) {
    this.clearPhraseTimer()
    this.clearFilterLoading()
    const slot = this.gridSlot || this.target
    slot.innerHTML = ""
    const grid = document.createElement("div")
    grid.className = "xtal-grid"
    for (const card of cards) {
      grid.appendChild(card)
    }
    slot.appendChild(grid)
  }

  renderCustom(element: HTMLElement) {
    this.clearPhraseTimer()
    this.clearFilterLoading()
    const slot = this.gridSlot || this.target
    slot.innerHTML = ""
    slot.appendChild(element)
  }

  renderEmpty(query: string) {
    this.clearPhraseTimer()
    this.clearFilterLoading()
    const slot = this.gridSlot || this.target
    slot.innerHTML = ""
    const msg = document.createElement("div")
    msg.style.cssText =
      "text-align:center;padding:60px 20px;color:#888;font-size:14px;"
    msg.textContent = `No results found for "${query}"`
    slot.appendChild(msg)
  }

  restore() {
    this.layoutEl = null
    this.railSlot = null
    this.gridSlot = null
    // Remove early-hide and CMS loading container if still present
    const earlyHide = document.getElementById("xtal-early-hide")
    if (earlyHide) earlyHide.remove()
    const sdkEarlyHide = document.getElementById("xtal-sdk-early-hide")
    if (sdkEarlyHide) sdkEarlyHide.remove()
    const searchLoading = document.getElementById("xtal-search-loading")
    if (searchLoading) searchLoading.remove()
    if (this.originalHTML !== null) {
      this.target.innerHTML = this.originalHTML
      this.target.style.display = this.originalDisplay
      this.target.style.width = ""
      this.originalHTML = null
    }
  }

  destroy() {
    this.clearPhraseTimer()
    this.restore()
    const style = document.getElementById("xtal-inline-keyframes")
    if (style) style.remove()
  }
}
