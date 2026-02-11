"use client"

import { useState, useMemo } from "react"
import { Link2, Check } from "lucide-react"
import { trackEvent } from "@/lib/gtag"

interface ShareBarProps {
  reportId: string
  storeName: string
  score: number
}

export default function ShareBar({ reportId, storeName, score }: ShareBarProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/grade/${reportId}`
    return `${window.location.origin}/grade/${reportId}`
  }, [reportId])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    trackEvent("grader_share_copy", { reportId })
    setTimeout(() => setCopied(false), 2000)
  }

  const twitterText = `${storeName} scored ${score}/100 on search health. Check your store's search for free:`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-6">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:border-xtal-navy/30 hover:text-xtal-navy transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Copy Link
          </>
        )}
      </button>

      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:border-xtal-navy/30 hover:text-xtal-navy transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </a>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:border-xtal-navy/30 hover:text-xtal-navy transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Twitter
      </a>
    </div>
  )
}
