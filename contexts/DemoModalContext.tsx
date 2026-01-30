"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface DemoModalContextType {
  isOpen: boolean
  source: string
  open: (source?: string) => void
  close: () => void
}

const DemoModalContext = createContext<DemoModalContextType | null>(null)

export function DemoModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState("modal")

  const open = useCallback((src = "modal") => {
    setSource(src)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <DemoModalContext.Provider value={{ isOpen, source, open, close }}>
      {children}
    </DemoModalContext.Provider>
  )
}

export function useDemoModal() {
  const context = useContext(DemoModalContext)
  if (!context) {
    throw new Error("useDemoModal must be used within DemoModalProvider")
  }
  return context
}
