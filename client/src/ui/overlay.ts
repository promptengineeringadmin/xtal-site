import { generateCSS } from "./styles"

export class XtalOverlay {
  private host: HTMLDivElement
  private shadow: ShadowRoot
  private contentRoot: HTMLDivElement
  private visible = false
  private onHideCallback: (() => void) | null = null

  constructor(additionalCSS?: string) {
    this.host = document.createElement("div")
    this.host.setAttribute("data-xtal-host", "true")
    this.host.style.position = "fixed"
    this.host.style.inset = "0"
    this.host.style.zIndex = "2147483647"
    this.host.style.display = "none"

    this.shadow = this.host.attachShadow({ mode: "open" })

    // Inject styles
    const style = document.createElement("style")
    style.textContent = generateCSS(additionalCSS)
    this.shadow.appendChild(style)

    // Content container
    this.contentRoot = document.createElement("div")
    this.shadow.appendChild(this.contentRoot)

    document.body.appendChild(this.host)

    // Close on Escape
    this.handleKeydown = this.handleKeydown.bind(this)
    this.handlePopstate = this.handlePopstate.bind(this)
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      this.hide()
    }
  }

  private handlePopstate() {
    if (this.visible) {
      this.hide()
    }
  }

  onHide(cb: () => void) {
    this.onHideCallback = cb
  }

  show() {
    this.visible = true
    this.host.style.display = "block"
    document.addEventListener("keydown", this.handleKeydown)
    window.addEventListener("popstate", this.handlePopstate)
  }

  hide() {
    this.visible = false
    this.host.style.display = "none"
    document.removeEventListener("keydown", this.handleKeydown)
    window.removeEventListener("popstate", this.handlePopstate)
    if (this.onHideCallback) this.onHideCallback()
  }

  isVisible() {
    return this.visible
  }

  setContent(el: HTMLElement) {
    this.contentRoot.innerHTML = ""
    this.contentRoot.appendChild(el)
  }

  destroy() {
    this.hide()
    this.host.remove()
  }
}
