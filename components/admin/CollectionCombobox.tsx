"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { useCollection } from "@/lib/admin/CollectionContext"
import type { CollectionConfig, Vertical } from "@/lib/admin/collections"

const VERTICAL_LABELS: Record<string, string> = {
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

const VERTICAL_COLORS: Record<string, string> = {
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

function VerticalBadge({ vertical }: { vertical?: Vertical }) {
  if (!vertical) return null
  const label = VERTICAL_LABELS[vertical] || vertical
  const color = VERTICAL_COLORS[vertical] || "bg-slate-500/20 text-slate-300"
  return (
    <span
      className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${color}`}
    >
      {label}
    </span>
  )
}

function CollectionItem({
  config,
  isActive,
  isHighlighted,
  onSelect,
  onMouseEnter,
}: {
  config: CollectionConfig
  isActive: boolean
  isHighlighted: boolean
  onSelect: () => void
  onMouseEnter: () => void
}) {
  return (
    <button
      type="button"
      className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
        isHighlighted
          ? "bg-white/15 text-white"
          : isActive
            ? "bg-white/10 text-white"
            : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={isActive}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{config.label}</div>
        {config.productCount != null && (
          <span className="text-[10px] text-white/40">
            {config.productCount.toLocaleString()} products
          </span>
        )}
      </div>
      <VerticalBadge vertical={config.vertical} />
    </button>
  )
}

interface GroupedCollections {
  label: string
  items: CollectionConfig[]
}

export default function CollectionCombobox() {
  const { collection, setCollection, collections, recentCollections } =
    useCollection()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = collections.find((c) => c.id === collection)

  // Filter collections by search term
  const filtered = useMemo(() => {
    if (!search.trim()) return collections
    const q = search.toLowerCase()
    return collections.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.vertical && c.vertical.includes(q)),
    )
  }, [collections, search])

  // Group into sections: Recent, Pinned, then by vertical
  const groups = useMemo((): GroupedCollections[] => {
    const result: GroupedCollections[] = []

    // Recent (only if not searching)
    if (!search.trim() && recentCollections.length > 0) {
      const recentItems = recentCollections
        .map((id) => filtered.find((c) => c.id === id))
        .filter((c): c is CollectionConfig => c != null)
      if (recentItems.length > 0) {
        result.push({ label: "Recent", items: recentItems })
      }
    }

    // Pinned
    const pinned = filtered.filter(
      (c) =>
        c.pinned &&
        !recentCollections.includes(c.id), // avoid duplication with recent
    )
    if (pinned.length > 0 && !search.trim()) {
      result.push({ label: "Pinned", items: pinned })
    }

    // Rest grouped by vertical
    const rest = filtered.filter(
      (c) =>
        !c.pinned ||
        search.trim(), // when searching, ignore pinned grouping
    )
    const byVertical: Record<string, CollectionConfig[]> = {}
    for (const c of rest) {
      // Skip items already shown in recent/pinned groups
      if (
        !search.trim() &&
        (recentCollections.includes(c.id) || c.pinned)
      )
        continue
      const v = c.vertical || "general"
      if (!byVertical[v]) byVertical[v] = []
      byVertical[v].push(c)
    }
    for (const v of Object.keys(byVertical)) {
      result.push({
        label: VERTICAL_LABELS[v] || v,
        items: byVertical[v],
      })
    }

    return result
  }, [filtered, recentCollections, search])

  // Flat list for keyboard navigation
  const flatItems = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  )

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      const item = items[highlightIndex] as HTMLElement | undefined
      item?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightIndex((i) =>
          i < flatItems.length - 1 ? i + 1 : 0,
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightIndex((i) =>
          i > 0 ? i - 1 : flatItems.length - 1,
        )
        break
      case "Enter":
        e.preventDefault()
        if (highlightIndex >= 0 && flatItems[highlightIndex]) {
          setCollection(flatItems[highlightIndex].id)
          setOpen(false)
          setSearch("")
        }
        break
      case "Escape":
        setOpen(false)
        setSearch("")
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            setHighlightIndex(-1)
          }}
          className="w-full flex items-center justify-between bg-white/10 text-white text-sm font-medium rounded-lg pl-3 pr-2 py-2 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
        >
          <span className="truncate">{selected?.label ?? "Select..."}</span>
          <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
        </button>
      )}

      {/* Search input (replaces trigger when open) */}
      {open && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setHighlightIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search collections..."
            className="w-full bg-white/15 text-white text-sm rounded-lg pl-8 pr-8 py-2 border border-white/20 outline-none focus:border-white/40 placeholder:text-white/30"
          />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setSearch("")
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropdown list */}
      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-xtal-navy border border-white/15 rounded-lg shadow-xl z-50"
        >
          {flatItems.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-white/40">
              No collections found
            </div>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/30 bg-white/5 sticky top-0">
                {group.label}
              </div>
              {group.items.map((config) => {
                const flatIndex = flatItems.indexOf(config)
                return (
                  <CollectionItem
                    key={`${group.label}-${config.id}`}
                    config={config}
                    isActive={config.id === collection}
                    isHighlighted={flatIndex === highlightIndex}
                    onSelect={() => {
                      setCollection(config.id)
                      setOpen(false)
                      setSearch("")
                    }}
                    onMouseEnter={() => setHighlightIndex(flatIndex)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
