"use client"

import { useEffect } from "react"
import { X, SlidersHorizontal } from "lucide-react"

interface MobileFilterDrawerProps {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  total: number
  activeFilterCount: number
  children: React.ReactNode
}

export default function MobileFilterDrawer({
  isOpen,
  onOpen,
  onClose,
  total,
  activeFilterCount,
  children,
}: MobileFilterDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <>
      {/* FAB button — fixed at bottom, mobile only */}
      <button
        onClick={onOpen}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40
                   flex items-center gap-2 px-5 py-3 rounded-full
                   bg-xtal-navy text-white shadow-lg shadow-xtal-navy/30
                   hover:scale-105 transition-transform"
      >
        <SlidersHorizontal size={16} />
        <span className="text-sm font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-xtal-navy text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer — slides from left */}
      <div
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-[360px] bg-white z-50
                     shadow-2xl transform transition-transform md:hidden
                     flex flex-col ${
                       isOpen ? "translate-x-0" : "-translate-x-full"
                     }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">Filters</span>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter content — scrollable */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Sticky footer — "See N results" */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-xtal-navy text-white rounded-lg text-sm font-medium
                       hover:bg-xtal-navy/90 transition-colors"
          >
            See {total} result{total !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </>
  )
}
