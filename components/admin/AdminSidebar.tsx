"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Search, FileText, Clock, Gauge } from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/searches", label: "Searches", icon: Search },
  { href: "/admin/prompts", label: "Prompts", icon: FileText },
  { href: "/admin/events", label: "Events", icon: Clock },
  { href: "/admin/grader", label: "Grader", icon: Gauge },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-xtal-navy flex flex-col z-30">
      <div className="p-6 pb-4">
        <Link href="/admin/dashboard" className="block">
          <span className="text-lg font-bold text-white tracking-wide">
            XTAL
          </span>
          <span className="text-xs text-white/50 ml-2 font-medium">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          href="/"
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          &larr; Back to site
        </Link>
      </div>
    </aside>
  )
}
