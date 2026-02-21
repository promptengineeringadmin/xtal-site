"use client"

import { LogOut, User } from "lucide-react"

interface UserMenuProps {
  name?: string | null
  email?: string | null
  image?: string | null
}

export default function UserMenu({ name, email, image }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3 px-1">
      {image ? (
        <img
          src={image}
          alt=""
          className="w-7 h-7 rounded-full border border-white/20 shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-white/60" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/80 truncate">{name ?? email ?? "Admin"}</p>
      </div>
      <button
        onClick={() => { window.location.href = "/api/auth/signout" }}
        className="p-1.5 text-white/40 hover:text-white/80 transition-colors shrink-0"
        title="Sign out"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
