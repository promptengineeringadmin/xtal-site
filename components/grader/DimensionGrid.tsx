"use client"

import type { DimensionScore } from "@/lib/grader/types"
import DimensionBar from "./DimensionBar"

interface DimensionGridProps {
  dimensions: DimensionScore[]
  showDetail?: boolean
}

export default function DimensionGrid({ dimensions, showDetail = false }: DimensionGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {dimensions.map((d) => (
        <DimensionBar key={d.key} dimension={d} showDetail={showDetail} />
      ))}
    </div>
  )
}
