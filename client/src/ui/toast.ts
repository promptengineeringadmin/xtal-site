export type ToastType = "success" | "error" | "loading"

export function showToast(
  shadowRoot: ShadowRoot,
  message: string,
  type: ToastType,
  durationMs = 3000
): HTMLElement {
  // Remove any existing toast
  const existing = shadowRoot.querySelector(".xtal-toast")
  if (existing) existing.remove()

  const toast = document.createElement("div")
  toast.className = `xtal-toast xtal-toast-${type}`

  // Icon
  const icon = document.createElement("span")
  icon.className = "xtal-toast-icon"
  if (type === "loading") {
    const spinner = document.createElement("span")
    spinner.className = "xtal-toast-spinner"
    icon.appendChild(spinner)
  } else {
    icon.textContent = type === "success" ? "\u2713" : "\u2717"
  }
  toast.appendChild(icon)

  // Text
  const text = document.createElement("span")
  text.textContent = message
  toast.appendChild(text)

  // Attach directly to shadow root (not contentRoot) so it survives re-renders
  shadowRoot.appendChild(toast)

  // Animate in
  requestAnimationFrame(() => toast.classList.add("xtal-toast-show"))

  // Auto-dismiss (not for loading)
  if (type !== "loading") {
    setTimeout(() => {
      toast.classList.remove("xtal-toast-show")
      setTimeout(() => toast.remove(), 300)
    }, durationMs)
  }

  return toast
}

export function dismissToast(toast: HTMLElement) {
  toast.classList.remove("xtal-toast-show")
  setTimeout(() => toast.remove(), 300)
}
