"use client"

import { useEffect, useState } from "react"
import type { Grade } from "@/lib/grader/types"

const SEARCH_PROVIDER_LABELS: Record<string, string> = {
  algolia: "Algolia",
  searchspring: "Searchspring",
  klevu: "Klevu",
  bloomreach: "Bloomreach",
  nosto: "Nosto",
  constructor: "Constructor.io",
  doofinder: "Doofinder",
  searchanise: "Searchanise",
  "boost-commerce": "Boost Commerce",
  xtal: "XTAL Search",
  "shopify-native": "Shopify Native",
  "woocommerce-native": "WooCommerce Native",
}

interface ReportHeroProps {
  report: {
    storeName: string
    storeUrl: string
    overallScore: number
    overallGrade: Grade
    summary: string
    createdAt: string
    platform: string
    vertical: string
    searchProvider?: string
  }
  animate?: boolean
}

const GRADE_CONFIG = {
  A: {
    color: "bg-green-500",
    description: "Excellent",
  },
  B: {
    color: "bg-blue-500",
    description: "Strong",
  },
  C: {
    color: "bg-amber-500",
    description: "Average",
  },
  D: {
    color: "bg-orange-500",
    description: "Below Average",
  },
  F: {
    color: "bg-red-500",
    description: "Needs Improvement",
  },
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

export default function ReportHero({ report, animate = false }: ReportHeroProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : report.overallScore)

  useEffect(() => {
    if (!animate) return

    const duration = 1200
    const startTime = performance.now()
    const startScore = 0
    const endScore = report.overallScore

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    const animateScore = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      const currentScore = startScore + (endScore - startScore) * easedProgress

      setDisplayScore(Math.round(currentScore))

      if (progress < 1) {
        requestAnimationFrame(animateScore)
      }
    }

    requestAnimationFrame(animateScore)
  }, [animate, report.overallScore])

  const gradeConfig = GRADE_CONFIG[report.overallGrade]

  return (
    <section
      className="relative w-full bg-[#0F172A] px-8 py-12 print:break-after"
      style={{ printColorAdjust: "exact" }}
    >
      {/* Dot grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-7xl space-y-8">
        {/* Top bar */}
        <div className="flex items-start justify-between">
          {/* Left: Brand mark */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              <div className="text-white">
                <span className="font-bold">XTAL</span>
                <span className="ml-1 font-light">SEARCH</span>
              </div>
            </div>
            <div className="text-sm text-white/60">Site Search Audit</div>
          </div>

          {/* Right: Prepared for */}
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wider text-white/50">
              Prepared For
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {report.storeName}
            </div>
            <div className="mt-0.5 text-sm text-white/60">
              {formatDate(report.createdAt)}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Heading + Summary */}
          <div className="space-y-6">
            <h1 className="font-outfit text-5xl font-bold leading-tight text-white">
              Search Health
              <br />
              Report
            </h1>

            {/* Summary card with frosted glass effect */}
            <div className="rounded-xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm leading-relaxed text-white/90">
                {report.summary}
              </p>

              {/* Platform, Vertical, and Search Provider pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  {report.platform}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  {report.vertical}
                </span>
                {report.searchProvider && report.searchProvider !== "unknown" && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                    Search: {SEARCH_PROVIDER_LABELS[report.searchProvider] ?? report.searchProvider}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Score + Grade cards */}
          <div className="flex items-center gap-4">
            {/* Score card */}
            <div className="flex-1 rounded-xl bg-white p-6 shadow-xl">
              <div className="text-center">
                <div className="text-6xl font-bold text-gray-900">
                  {displayScore}
                </div>
                <div className="mt-2 text-sm font-medium uppercase tracking-wide text-gray-500">
                  out of 100
                </div>
              </div>
            </div>

            {/* Grade card */}
            <div
              className={`flex-1 rounded-xl ${gradeConfig.color} p-6 shadow-xl`}
            >
              <div className="text-center">
                <div className="text-5xl font-bold text-white">
                  {report.overallGrade}
                </div>
                <div className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  {gradeConfig.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
