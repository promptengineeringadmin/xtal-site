"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Lock } from "lucide-react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleOAuth(provider: string) {
    setLoading(provider)
    await signIn(provider, { callbackUrl: "/admin/dashboard" })
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading("resend")
    await signIn("resend", {
      email: email.trim(),
      callbackUrl: "/admin/dashboard",
      redirect: false,
    })
    setEmailSent(true)
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-xtal-navy/10 rounded-xl mx-auto mb-6">
          <Lock className="w-6 h-6 text-xtal-navy" />
        </div>
        <h1 className="text-xl font-semibold text-center text-slate-900 mb-1">
          XTAL Admin
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Sign in to continue
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {loading === "google" ? "Redirecting..." : "Sign in with Google"}
          </button>

          <button
            onClick={() => handleOAuth("microsoft-entra-id")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            {loading === "microsoft-entra-id" ? "Redirecting..." : "Sign in with Microsoft"}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400">or sign in with email</span>
          </div>
        </div>

        {emailSent ? (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-slate-900 mb-1">Check your email</p>
            <p className="text-xs text-slate-500">
              We sent a sign-in link to <span className="font-medium">{email}</span>
            </p>
            <button
              onClick={() => { setEmailSent(false); setEmail("") }}
              className="text-xs text-xtal-navy hover:underline mt-3"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmail}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-xtal-navy focus:ring-2 focus:ring-xtal-navy/10 transition-colors"
            />
            <button
              type="submit"
              disabled={loading !== null || !email.trim()}
              className="w-full mt-3 px-4 py-2.5 bg-xtal-navy text-white text-sm font-medium rounded-lg hover:bg-xtal-navy/90 transition-colors disabled:opacity-50"
            >
              {loading === "resend" ? "Sending link..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
