"use client"

import { useDemoModal } from "@/contexts/DemoModalContext"
import { ReactNode } from "react"

interface DemoButtonProps {
  children: ReactNode
  className?: string
  source?: string
}

export default function DemoButton({ children, className, source = "cta" }: DemoButtonProps) {
  const { open } = useDemoModal()

  return (
    <button
      onClick={() => open(source)}
      className={className}
    >
      {children}
    </button>
  )
}
