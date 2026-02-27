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
  private layoutEl: HTMLElement | null = null
  private railSlot: HTMLElement | null = null
  private gridSlot: HTMLElement | null = null

  constructor(target: HTMLElement) {
    this.target = target
  }

  /** Capture original HTML on first mutation — ensures fresh snapshot */
  private captureOriginal() {
    if (this.originalHTML === null) {
      this.originalHTML = this.target.innerHTML
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

    const wrap = document.createElement("div")
    wrap.style.cssText =
      "display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;width:100%;"

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
    wrap.appendChild(ring)

    // Query echo
    if (query) {
      const displayQuery = query.length > 80 ? query.slice(0, 77) + "…" : query
      const queryEl = document.createElement("p")
      queryEl.style.cssText =
        "margin:0 0 8px 0;font-size:14px;color:#555;font-style:italic;text-align:center;max-width:320px;"
      queryEl.textContent = `\u201C${displayQuery}\u201D`
      wrap.appendChild(queryEl)
    }

    // Cycling status phrase
    const phrases = [
      "Analyzing search intent\u2026",
      "Finding best matches\u2026",
      "Ranking results\u2026",
      "Almost there\u2026",
    ]
    const phraseEl = document.createElement("p")
    phraseEl.style.cssText =
      "margin:0;font-size:13px;color:#999;text-align:center;transition:opacity 0.3s;"
    phraseEl.textContent = phrases[0]
    wrap.appendChild(phraseEl)

    let idx = 0
    this.loadingPhraseTimer = setInterval(() => {
      phraseEl.style.opacity = "0"
      setTimeout(() => {
        idx = (idx + 1) % phrases.length
        phraseEl.textContent = phrases[idx]
        phraseEl.style.opacity = "1"
      }, 300)
    }, 2500)

    slot.appendChild(wrap)
  }

  private clearPhraseTimer() {
    if (this.loadingPhraseTimer) {
      clearInterval(this.loadingPhraseTimer)
      this.loadingPhraseTimer = null
    }
  }

  renderCards(cards: HTMLElement[]) {
    this.clearPhraseTimer()
    const slot = this.gridSlot || this.target
    slot.innerHTML = ""
    const grid = document.createElement("div")
    grid.className = "xtal-grid"
    for (const card of cards) {
      grid.appendChild(card)
    }
    slot.appendChild(grid)
  }

  renderEmpty(query: string) {
    this.clearPhraseTimer()
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
    if (this.originalHTML !== null) {
      this.target.innerHTML = this.originalHTML
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
