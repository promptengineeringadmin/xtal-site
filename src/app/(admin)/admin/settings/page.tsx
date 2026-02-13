"use client"

import Link from "next/link"
import { ArrowRight, Store, Sparkles, MessageSquareText, BookType } from "lucide-react"

const SETTINGS_PAGES = [
  {
    href: "/admin/settings/brand",
    label: "Brand Identity",
    description:
      "Define your store's brand voice and product philosophy. Shapes how your catalog is understood and searched.",
    icon: Store,
  },
  {
    href: "/admin/settings/search",
    label: "Search Tuning",
    description:
      "Control how customer searches are interpreted, which products are prioritized, and how merchandising influences results.",
    icon: Sparkles,
  },
  {
    href: "/admin/settings/explain-prompt",
    label: "Result Explanations",
    description:
      "Customize the AI prompt that generates \u201cWhy this result?\u201d explanations on each product card.",
    icon: MessageSquareText,
  },
  {
    href: "/admin/settings/synonyms",
    label: "Filter Management",
    description:
      "Merge duplicate facet values so customers see clean, organized filters.",
    icon: BookType,
  },
]

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure search behavior, prompts, and display settings.
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
