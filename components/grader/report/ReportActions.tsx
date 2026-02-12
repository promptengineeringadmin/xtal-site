"use client"

import { useState } from "react"

interface ReportActionsProps {
  reportId: string
  storeName: string
  score: number
}

export default function ReportActions({ reportId, storeName, score }: ReportActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch(`/api/grader/report/${reportId}/pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `xtal-report-${reportId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/grade/${reportId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const handleLinkedInShare = () => {
    const shareUrl = `${window.location.origin}/grade/${reportId}`
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(linkedInUrl, "_blank", "width=600,height=600")
  }

  const handleTwitterShare = () => {
    const shareUrl = `${window.location.origin}/grade/${reportId}`
    const tweetText = `${storeName} scored ${score}/100 on site search health. See the full report: ${shareUrl}`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
    window.open(twitterUrl, "_blank", "width=600,height=600")
  }

  return (
    <div className="flex items-center gap-3 print:hidden">
      {/* Download PDF Button */}
      <button
        onClick={handleDownloadPDF}
        disabled={isDownloading}
        className="px-4 py-2 bg-[#0F172A] text-white font-medium rounded-lg hover:opacity-90 transition-all text-sm flex items-center gap-2"
      >
        {isDownloading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" strokeOpacity="0.75" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download PDF
          </>
        )}
      </button>

      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className={`px-4 py-2 border font-medium rounded-lg transition-all text-sm flex items-center gap-2 ${
          isCopied
            ? "border-green-300 text-green-600"
            : "border-slate-200 text-slate-600 hover:border-slate-300"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {isCopied ? "Copied!" : "Copy Link"}
      </button>

      {/* LinkedIn Share Button */}
      <button
        onClick={handleLinkedInShare}
        className="p-2 border border-slate-200 rounded-lg hover:border-slate-300 transition-all"
        aria-label="Share on LinkedIn"
      >
        <span className="font-bold text-slate-600">in</span>
      </button>

      {/* Twitter/X Share Button */}
      <button
        onClick={handleTwitterShare}
        className="p-2 border border-slate-200 rounded-lg hover:border-slate-300 transition-all"
        aria-label="Share on Twitter"
      >
        <span className="font-bold text-slate-600">X</span>
      </button>
    </div>
  )
}
