"use client"

const OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
]

interface TimeRangeSelectorProps {
  value: number
  onChange: (days: number) => void
}

export default function TimeRangeSelector({
  value,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === opt.value
              ? "bg-xtal-navy text-white"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
