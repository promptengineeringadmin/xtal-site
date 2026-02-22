"use client"

import { useSearchParams } from "next/navigation"
import { ShieldX } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const isAccessDenied = error === "AccessDenied"

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-sm text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl mx-auto mb-6">
          <ShieldX className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">
          {isAccessDenied ? "Access Denied" : "Sign-in Error"}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {isAccessDenied
            ? "Only @xtalsearch.com Google accounts can access the admin panel. Please sign in with your XTAL team account."
            : "An error occurred during sign-in. Please try again."}
        </p>
        <div className="space-y-3">
          <Link
            href="/api/auth/signin"
            className="block w-full px-4 py-2.5 bg-xtal-navy text-white text-sm font-medium rounded-lg hover:bg-xtal-navy/90 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            &larr; Back to site
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <AuthErrorContent />
    </Suspense>
  )
}
