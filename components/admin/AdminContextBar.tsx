"use client"

import { useCollection } from "@/lib/admin/CollectionContext"
import { VerticalBadge } from "@/components/admin/VerticalBadge"
import { MARKETING_HOST } from "@/lib/admin/subdomain-routes"
import { useState, useEffect } from "react"

export default function AdminContextBar() {
  const { collectionConfig } = useCollection()
  const [isMarketing, setIsMarketing] = useState(false)
  useEffect(() => {
    setIsMarketing(typeof window !== "undefined" && window.location.hostname === MARKETING_HOST)
  }, [])
  if (isMarketing || !collectionConfig) return null
  return (
    <div className="flex items-center gap-2 px-1 pb-4 text-sm text-slate-500">
      {collectionConfig.vertical && (
        <VerticalBadge vertical={collectionConfig.vertical} variant="light" />
      )}
      <span className="font-medium text-slate-700">{collectionConfig.label}</span>
      {collectionConfig.description && (
        <span className="text-slate-400 text-xs">{collectionConfig.description}</span>
      )}
    </div>
  )
}
