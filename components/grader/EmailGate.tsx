"use client"

import { useState } from "react"
import { trackEvent } from "@/lib/gtag"

interface EmailGateProps {
  reportId: string
  storeName: string
  score: number
  onUnlock: () => void
}

export default function EmailGate({ reportId, storeName, score, onUnlock }: EmailGateProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams(window.location.search)

    const data = {
      name: formData.get("name") || "",
      email: formData.get("email"),
      company: formData.get("company") || storeName,
      pain: `Search Health Score: ${score}/100. Store: ${storeName}. Report: ${reportId}`,
      source: "grader",
      page: window.location.pathname,
      referrer: document.referrer || "",
      utm: [params.get("utm_source"), params.get("utm_medium"), params.get("utm_campaign")]
        .filter(Boolean)
        .join(" / ") || "",
      honeyPot: formData.get("honeyPot") || "",
    }

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setStatus("success")
        trackEvent("grader_email_captured", {
          reportId,
          score: String(score),
        })
        setTimeout(onUnlock, 800)
      } else {
        setStatus("error")
        setErrorMessage("Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setErrorMessage("Network error. Please check your connection.")
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-xtal-navy">Unlocking your full report...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xtal border border-slate-100 p-8 my-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-xtal-navy mb-2">
          Get Your Full Report
        </h3>
        <p className="text-sm text-slate-500">
          See specific failing queries, detailed recommendations, and how XTAL would fix each issue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <input type="text" name="honeyPot" className="hidden" tabIndex={-1} autoComplete="off" />

        <div>
          <input
            required
            name="email"
            type="email"
            placeholder="Work email"
            className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            name="name"
            placeholder="Name (optional)"
            className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none"
          />
          <input
            name="company"
            placeholder="Company (optional)"
            className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-3.5 bg-xtal-navy text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            "Unlock Full Report"
          )}
        </button>

        {status === "error" && (
          <p className="text-red-600 text-sm text-center">{errorMessage}</p>
        )}

        <p className="text-xs text-slate-400 text-center">
          No spam. We&apos;ll send you the report and that&apos;s it.
        </p>
      </form>
    </div>
  )
}
