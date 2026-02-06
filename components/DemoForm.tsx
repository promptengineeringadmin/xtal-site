"use client"

import { useState } from "react"

interface DemoFormProps {
  onSuccess?: () => void
  source?: string
  preselectedPlan?: string
}

export default function DemoForm({ onSuccess, source = "website", preselectedPlan }: DemoFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [bookingUrl, setBookingUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    const formData = new FormData(e.currentTarget)
    const data = {
      ...Object.fromEntries(formData),
      source,
      plan: preselectedPlan,
      page: window.location.pathname,
    }

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (res.ok) {
        setStatus("success")
        setBookingUrl(result.bookingUrl || null)
        onSuccess?.()

        // Redirect to booking after short delay
        if (result.bookingUrl) {
          setTimeout(() => {
            window.location.href = result.bookingUrl
          }, 2000)
        }
      } else {
        setStatus("error")
        setErrorMessage(result.error || "Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setErrorMessage("Network error. Please check your connection.")
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-xtal-navy mb-2">Request Received!</h3>
        {bookingUrl ? (
          <>
            <p className="text-slate-500 mb-4">Redirecting you to schedule your demo...</p>
            <div className="animate-pulse text-sm text-blue-600">Loading calendar...</div>
          </>
        ) : (
          <p className="text-slate-500">We&apos;ll be in touch shortly to schedule your demo.</p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="text" name="honeyPot" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Name</label>
          <input
            required
            name="name"
            className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Work Email</label>
          <input
            required
            name="email"
            type="email"
            className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none"
            placeholder="jane@company.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Company</label>
        <input
          required
          name="company"
          className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none"
          placeholder="Acme Corp"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          What&apos;s broken about your current search?
          <span className="text-slate-400 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          name="pain"
          rows={3}
          className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none resize-none"
          placeholder="e.g., Customers can't find products unless they use exact keywords..."
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-4 bg-xtal-navy text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
          "Request Demo"
        )}
      </button>

      {status === "error" && (
        <p className="text-red-600 font-medium text-center text-sm">{errorMessage}</p>
      )}
    </form>
  )
}
