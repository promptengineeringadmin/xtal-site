"use client"

interface AspectChipsProps {
  aspects: string[]
  selectedAspects: string[]
  onSelect: (aspect: string) => void
  onRemove: (aspect: string) => void
  showLabel?: boolean
}

export default function AspectChips({
  aspects,
  selectedAspects,
  onSelect,
  onRemove,
  showLabel,
}: AspectChipsProps) {
  const allAspects = [
    ...selectedAspects,
    ...aspects.filter((a) => !selectedAspects.includes(a)),
  ]

  if (allAspects.length === 0) return null

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0 scrollbar-none [-webkit-overflow-scrolling:touch]">
      {showLabel && (
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider shrink-0 self-center">
          Refine:
        </span>
      )}
      {allAspects.map((aspect) => {
        const isSelected = selectedAspects.includes(aspect)
        return (
          <button
            key={aspect}
            onClick={() => (isSelected ? onRemove(aspect) : onSelect(aspect))}
            className={`text-[13px] px-[18px] py-2.5 md:py-2 rounded-full transition-colors shrink-0
                       focus:outline-none focus:ring-2 focus:ring-xtal-navy/50 focus:ring-offset-1 ${
              isSelected
                ? "bg-xtal-navy text-white border border-xtal-navy"
                : "border border-xtal-navy/30 text-xtal-navy hover:border-xtal-navy"
            }`}
          >
            {aspect}
            <span className={`ml-1.5 ${isSelected ? "opacity-50" : "opacity-40"}`}>
              {isSelected ? "\u2212" : "+"}
            </span>
          </button>
        )
      })}
    </div>
  )
}
