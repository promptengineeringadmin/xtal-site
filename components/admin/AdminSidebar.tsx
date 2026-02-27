"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Boxes,
  Activity,
  Gauge,
  Flag,
  Settings,
  KeyRound,
  Menu,
  X,
} from "lucide-react"
import UserMenu from "@/components/admin/UserMenu"
import CollectionCombobox from "@/components/admin/CollectionCombobox"

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/demos", label: "Demos", icon: Boxes },
  { href: "/admin/grader", label: "Grader", icon: Gauge },
  { href: "/admin/search-quality", label: "Search Quality", icon: Flag },
  { href: "/admin/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

interface UserInfo {
  name?: string | null
  email?: string | null
  image?: string | null
}

function SidebarContent({ pathname, user }: {
  pathname: string
  user?: UserInfo
}) {
  return (
    <>
      <div className="p-6 pb-4">
        <Link href="/admin/dashboard" className="block">
          <span className="text-lg font-bold text-white tracking-wide">
            XTAL
          </span>
          <span className="text-xs text-white/50 ml-2 font-medium">Admin</span>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 px-1">
          Experience
        </label>
        <CollectionCombobox />
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
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        {user && <UserMenu name={user.name} email={user.email} image={user.image} />}
        <Link
          href="/"
          className="text-xs text-white/40 hover:text-white/70 transition-colors block"
        >
          &larr; Back to site
        </Link>
      </div>
    </>
  )
}

export default function AdminSidebar({ user }: { user?: UserInfo }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-xtal-navy text-white rounded-lg shadow-lg"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar — always visible at md+ */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 bg-xtal-navy flex-col z-30">
        <SidebarContent
          pathname={pathname}
          user={user}
        />
      </aside>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile sidebar — slides from left */}
      <aside
        className={`fixed left-0 top-0 h-full w-60 bg-xtal-navy flex flex-col z-50
                    shadow-2xl transform transition-transform md:hidden ${
                      mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>

        <SidebarContent
          pathname={pathname}
          user={user}
        />
      </aside>
    </>
  )
}
