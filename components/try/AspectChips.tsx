"use client"

interface AspectChipsProps {
  aspects: string[]
  selectedAspects: string[]
  onSelect: (aspect: string) => void
  onRemove: (aspect: string) => void
}

export default function AspectChips({
  aspects,
  selectedAspects,
  onSelect,
  onRemove,
}: AspectChipsProps) {
  const allAspects = [
    ...selectedAspects,
    ...aspects.filter((a) => !selectedAspects.includes(a)),
  ]

  if (allAspects.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2.5">
      {allAspects.map((aspect) => {
        const isSelected = selectedAspects.includes(aspect)
        return (
          <button
            key={aspect}
            onClick={() => (isSelected ? onRemove(aspect) : onSelect(aspect))}
            className={`text-[13px] px-[18px] py-2 rounded-full transition-colors
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
