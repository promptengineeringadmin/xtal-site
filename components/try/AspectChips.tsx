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
    <div className="flex flex-wrap gap-2">
      {allAspects.map((aspect) => {
        const isSelected = selectedAspects.includes(aspect)
        return (
          <button
            key={aspect}
            onClick={() => (isSelected ? onRemove(aspect) : onSelect(aspect))}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              isSelected
                ? "bg-xtal-navy text-white"
                : "border border-xtal-navy/30 text-xtal-navy hover:border-xtal-navy"
            }`}
          >
            {aspect}
            {isSelected && <span className="ml-1.5">&times;</span>}
          </button>
        )
      })}
    </div>
  )
}
