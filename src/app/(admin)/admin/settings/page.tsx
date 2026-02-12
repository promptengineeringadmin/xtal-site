"use client"

import Link from "next/link"
import { ArrowRight, BookType, MessageSquareText } from "lucide-react"

const SETTINGS_PAGES = [
  {
    href: "/admin/settings/synonyms",
    label: "Facet Synonyms",
    description:
      "Merge duplicate facet values so they appear as one filter in search results.",
    icon: BookType,
  },
  {
    href: "/admin/settings/explain-prompt",
    label: "\"Why This Result\" Prompt",
    description:
      "View and edit the system prompt used to generate per-result explanations on /try.",
    icon: MessageSquareText,
  },
]

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure search behavior and prompt settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_PAGES.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-xtal-navy/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-xtal-navy/5 rounded-lg">
                <Icon className="w-5 h-5 text-xtal-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 group-hover:text-xtal-navy transition-colors">
                  {label}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-xtal-navy transition-colors mt-1 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
