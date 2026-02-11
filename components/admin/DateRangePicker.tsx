"use client"

import { Calendar } from "lucide-react"

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange(e.target.value, endDate)}
        className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer"
      />
      <span className="text-xs text-slate-300 select-none">&ndash;</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange(startDate, e.target.value)}
        className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer"
      />
    </div>
  )
}
