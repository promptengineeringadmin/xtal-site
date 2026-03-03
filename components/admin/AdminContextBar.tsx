"use client"

import { useCollection } from "@/lib/admin/CollectionContext"
import { VerticalBadge } from "@/components/admin/VerticalBadge"

export default function AdminContextBar() {
  const { collectionConfig } = useCollection()
  if (!collectionConfig) return null
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
