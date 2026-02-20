"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function HelpPage() {
  const { data: session } = useSession()
  const [html, setHtml] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const isInternal = session?.user?.role === "internal"

  useEffect(() => {
    async function loadGuide() {
      try {
        const res = await fetch(`/api/admin/help?role=${isInternal ? "internal" : "client"}`)
        if (res.ok) {
          const data = await res.json()
          setHtml(data.html)
        }
      } catch {
        setHtml("<p>Failed to load guide.</p>")
      } finally {
        setLoading(false)
      }
    }
    loadGuide()
  }, [isInternal])

  if (loading) {
    return (
      <div className="text-sm text-slate-500 py-8 text-center">
        Loading guide...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-h1:text-2xl prose-h1:font-semibold prose-h1:mb-2 prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-3 prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6 prose-h4:text-sm prose-h4:font-semibold prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-900 prose-hr:border-slate-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
