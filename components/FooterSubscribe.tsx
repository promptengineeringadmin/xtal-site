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
    return <p className="text-green-400 text-sm font-medium">You're subscribed!</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
        className="w-full px-4 py-2.5 text-sm bg-white/10 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-400 outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full px-4 py-2.5 text-sm font-semibold bg-white text-xtal-navy rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "..." : "Subscribe"}
      </button>
      {status === "error" && <p className="text-red-400 text-xs">Failed. Please try again.</p>}
    </form>
  )
}
