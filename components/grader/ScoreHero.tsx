"use client"

import { useEffect, useState } from "react"
import type { Grade } from "@/lib/grader/types"

interface ScoreHeroProps {
  score: number
  grade: Grade
  storeName: string
  storeUrl: string
}

const GRADE_COLORS: Record<Grade, string> = {
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-amber-400",
  D: "text-orange-400",
  F: "text-red-400",
}

export default function ScoreHero({ score, grade, storeName, storeUrl }: ScoreHeroProps) {
  const [displayScore, setDisplayScore] = useState(0)

  // Animated count-up
  useEffect(() => {
    let frame: number
    const duration = 1200
    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * score))

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  // SVG circle progress
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (displayScore / 100) * circumference

  return (
    <div className="relative py-16 px-6 overflow-hidden brand-gradient text-white">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 blur-[150px] rounded-full pointer-events-none" />

      {/* Abstract bg elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[10%] right-[-5%] w-[400px] h-[80px] bg-xtal-ice rounded-full rotate-[-45deg]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[100px] bg-white rounded-full rotate-[45deg]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Store name */}
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300 mb-2">
          Search Health Report
        </p>
        <h1 className="text-2xl md:text-3xl font-bold mb-8">
          {storeName}
        </h1>

        {/* Score circle */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <svg className="w-56 h-56 -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Score text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-7xl font-bold tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {displayScore}
            </span>
            <span className="text-sm text-white/60 font-medium -mt-1">out of 100</span>
          </div>
        </div>

        {/* Grade badge */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className={`text-5xl font-black ${GRADE_COLORS[grade]}`}>
            {grade}
          </span>
          <span className="text-lg text-white/60">
            {grade === "A" && "Excellent"}
            {grade === "B" && "Good"}
            {grade === "C" && "Needs Work"}
            {grade === "D" && "Poor"}
            {grade === "F" && "Failing"}
          </span>
        </div>

        <p className="text-sm text-white/40">{storeUrl}</p>
      </div>
    </div>
  )
}
