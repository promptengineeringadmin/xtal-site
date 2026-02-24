/**
 * Inline renderer — replaces the merchant's product grid in-place.
 * No Shadow DOM: cards inherit the merchant's CSS naturally.
 */
export class InlineRenderer {
  private target: HTMLElement
  private originalHTML: string

  constructor(target: HTMLElement) {
    this.target = target
    this.originalHTML = target.innerHTML
  }

  showLoading() {
    this.target.innerHTML = ""
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

    this.target.appendChild(spinner)
  }

  renderCards(cards: HTMLElement[]) {
    this.target.innerHTML = ""
    for (const card of cards) {
      this.target.appendChild(card)
    }
  }

  renderEmpty(query: string) {
    this.target.innerHTML = ""
    const msg = document.createElement("div")
    msg.style.cssText =
      "text-align:center;padding:60px 20px;color:#888;font-size:14px;"
    msg.textContent = `No results found for "${query}"`
    this.target.appendChild(msg)
  }

  restore() {
    this.target.innerHTML = this.originalHTML
  }

  destroy() {
    this.restore()
    const style = document.getElementById("xtal-inline-keyframes")
    if (style) style.remove()
  }
}
