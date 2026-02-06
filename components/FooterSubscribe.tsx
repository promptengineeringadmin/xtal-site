"use client"

import { useState } from "react"
import { trackEvent } from "@/lib/gtag"

export default function FooterSubscribe() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus("success")
        setEmail("")
        trackEvent('newsletter_subscribe')
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  if (status === "success") {
    return <p className="text-green-600 text-sm font-medium">You're subscribed!</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 px-4 py-2 text-sm bg-slate-100 rounded-lg border border-slate-200 focus:ring-2 focus:ring-xtal-navy outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2 text-sm font-semibold bg-xtal-navy text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "loading" ? "..." : "Subscribe"}
      </button>
      {status === "error" && <span className="text-red-500 text-xs self-center">Failed</span>}
    </form>
  )
}
