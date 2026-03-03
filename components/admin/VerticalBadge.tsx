import type { Vertical } from "@/lib/admin/collections"

export const VERTICAL_LABELS: Record<string, string> = {
  food: "Food",
  home: "Home",
  beauty: "Beauty",
  outdoor: "Outdoor",
  pet: "Pet",
  electronics: "Electronics",
  cannabis: "Cannabis",
  niche: "Niche",
  apparel: "Apparel",
  general: "General",
}

const VERTICAL_COLORS_DARK: Record<string, string> = {
  food: "bg-amber-500/20 text-amber-300",
  home: "bg-blue-500/20 text-blue-300",
  beauty: "bg-pink-500/20 text-pink-300",
  outdoor: "bg-green-500/20 text-green-300",
  pet: "bg-orange-500/20 text-orange-300",
  electronics: "bg-cyan-500/20 text-cyan-300",
  cannabis: "bg-emerald-500/20 text-emerald-300",
  niche: "bg-purple-500/20 text-purple-300",
  apparel: "bg-rose-500/20 text-rose-300",
  general: "bg-slate-500/20 text-slate-300",
}

const VERTICAL_COLORS_LIGHT: Record<string, string> = {
  food: "bg-amber-100 text-amber-700",
  home: "bg-blue-100 text-blue-700",
  beauty: "bg-pink-100 text-pink-700",
  outdoor: "bg-green-100 text-green-700",
  pet: "bg-orange-100 text-orange-700",
  electronics: "bg-cyan-100 text-cyan-700",
  cannabis: "bg-emerald-100 text-emerald-700",
  niche: "bg-purple-100 text-purple-700",
  apparel: "bg-rose-100 text-rose-700",
  general: "bg-slate-100 text-slate-600",
}

export function VerticalBadge({
  vertical,
  variant = "dark",
}: {
  vertical?: Vertical
  variant?: "dark" | "light"
}) {
  if (!vertical) return null
  const label = VERTICAL_LABELS[vertical] || vertical
  const colors = variant === "light" ? VERTICAL_COLORS_LIGHT : VERTICAL_COLORS_DARK
  const color = colors[vertical] || (variant === "light" ? "bg-slate-100 text-slate-600" : "bg-slate-500/20 text-slate-300")
  return (
    <span
      className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${color}`}
    >
      {label}
    </span>
  )
}
