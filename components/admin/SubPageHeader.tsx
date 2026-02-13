"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface SubPageHeaderProps {
  backHref: string
  backLabel: string
  title: string
  description?: string
}

export default function SubPageHeader({
  backHref,
  backLabel,
  title,
  description,
}: SubPageHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-xtal-navy transition-colors mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {description && (
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      )}
    </div>
  )
}
