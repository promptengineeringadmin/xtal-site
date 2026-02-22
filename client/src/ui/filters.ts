export function renderAspectChips(
  aspects: string[],
  selected: Set<string>,
  onToggle: (aspect: string) => void
): HTMLElement {
  const wrap = document.createElement("div")
  wrap.className = "xtal-chips"

  for (const aspect of aspects) {
    const chip = document.createElement("button")
    chip.className = selected.has(aspect)
      ? "xtal-chip xtal-chip-selected"
      : "xtal-chip"
    chip.textContent = aspect
    chip.addEventListener("click", () => onToggle(aspect))
    wrap.appendChild(chip)
  }

  return wrap
}
