"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import BudtenderDrawer from "./BudtenderDrawer"

interface BudtenderTriggerProps {
  collection: string
}

export default function BudtenderTrigger({ collection }: BudtenderTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Fixed FAB — bottom-right, always visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40
                   flex items-center gap-2 px-5 py-3 rounded-full
                   bg-xtal-navy text-white shadow-lg shadow-xtal-navy/30
                   hover:scale-105 transition-transform"
      >
        <Sparkles size={16} />
        <span className="text-sm font-medium">Ask the Budtender</span>
      </button>

      {/* Drawer */}
      <BudtenderDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        collection={collection}
      />
    </>
  )
}
