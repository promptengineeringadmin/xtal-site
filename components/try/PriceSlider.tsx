"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { PriceRange } from "@/lib/xtal-types"

const PRESETS = [
  { label: "Under $25", min: null, max: 25 },
  { label: "$25–$50", min: 25, max: 50 },
  { label: "$50–$100", min: 50, max: 100 },
  { label: "$100–$200", min: 100, max: 200 },
  { label: "$200+", min: 200, max: null },
]

interface PriceSliderProps {
  min: number
  max: number
  currentMin: number
  currentMax: number
  onChange: (range: PriceRange) => void
}

export default function PriceSlider({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
}: PriceSliderProps) {
  const [localMin, setLocalMin] = useState(currentMin)
  const [localMax, setLocalMax] = useState(currentMax)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync from parent when external reset happens
  useEffect(() => {
    setLocalMin(currentMin)
    setLocalMax(currentMax)
  }, [currentMin, currentMax])

  const debouncedChange = useCallback(
    (newMin: number, newMax: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        // Only emit if the range actually constrains results
        const isFullRange = newMin <= min && newMax >= max
        if (isFullRange) {
          onChange({ min: null, max: null })
        } else {
          onChange({ min: newMin, max: newMax })
        }
      }, 300)
    },
    [min, max, onChange]
  )

  function handleMinChange(value: number) {
    const clamped = Math.min(value, localMax - 1)
    setLocalMin(clamped)
    debouncedChange(clamped, localMax)
  }

  function handleMaxChange(value: number) {
    const clamped = Math.max(value, localMin + 1)
    setLocalMax(clamped)
    debouncedChange(localMin, clamped)
  }

  function handlePreset(preset: { min: number | null; max: number | null }) {
    const newMin = preset.min ?? min
    const newMax = preset.max ?? max
    setLocalMin(newMin)
    setLocalMax(newMax)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onChange({ min: preset.min, max: preset.max })
  }

  // Calculate fill position as percentages
  const range = max - min || 1
  const leftPct = ((localMin - min) / range) * 100
  const rightPct = ((localMax - min) / range) * 100

  return (
    <div>
      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESETS.map((preset) => {
          const pMin = preset.min ?? min
          const pMax = preset.max ?? max
          const isActive = localMin === pMin && localMax === pMax
          return (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className={`text-[11px] px-2 py-1 rounded-full transition-colors ${
                isActive
                  ? "bg-xtal-navy text-white"
                  : "border border-slate-200 text-slate-500 hover:border-xtal-navy hover:text-xtal-navy"
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      {/* Slider track */}
      <div className="relative h-6 mt-1">
        {/* Background track */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded" />

        {/* Active fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 bg-xtal-navy rounded"
          style={{
            left: `${leftPct}%`,
            width: `${rightPct - leftPct}%`,
          }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className="absolute w-full top-0 h-6 appearance-none bg-transparent pointer-events-none
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-xtal-navy
                     [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-sm"
          style={{ zIndex: localMin > max - 10 ? 5 : 3 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className="absolute w-full top-0 h-6 appearance-none bg-transparent pointer-events-none
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-xtal-navy
                     [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-sm"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Price labels */}
      <div className="flex justify-between mt-1 text-xs text-slate-500">
        <span>${localMin}</span>
        <span>${localMax}</span>
      </div>
    </div>
  )
}
