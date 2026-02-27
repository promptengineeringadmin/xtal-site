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

  showLoading() {
    this.captureOriginal()
    const slot = this.gridSlot || this.target
    slot.innerHTML = ""

    const spinner = document.createElement("div")
    spinner.style.cssText =
      "display:flex;align-items:center;justify-content:center;padding:60px 20px;gap:8px;color:#888;font-size:14px;"
    const dot = document.createElement("div")
    dot.style.cssText =
      "width:16px;height:16px;border:2px solid #ccc;border-top-color:#555;border-radius:50%;animation:xtal-inline-spin .6s linear infinite;"
    const label = document.createElement("span")
    label.textContent = "Searching..."
    spinner.appendChild(dot)
    spinner.appendChild(label)

    // Inject keyframes if not already present
    if (!document.getElementById("xtal-inline-keyframes")) {
      const style = document.createElement("style")
      style.id = "xtal-inline-keyframes"
      style.textContent =
        "@keyframes xtal-inline-spin{to{transform:rotate(360deg)}}"
      document.head.appendChild(style)
    }

    slot.appendChild(spinner)
  }

  renderCards(cards: HTMLElement[]) {
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
    this.restore()
    const style = document.getElementById("xtal-inline-keyframes")
    if (style) style.remove()
  }
}
