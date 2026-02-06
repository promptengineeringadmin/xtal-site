"use client"

import { useEffect } from "react"
import { useDemoModal } from "@/contexts/DemoModalContext"
import { trackEvent } from "@/lib/gtag"

export default function ExitIntent() {
  const { open, isOpen } = useDemoModal()

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (
        e.clientY <= 0 &&
        !isOpen &&
        !sessionStorage.getItem("exitIntentShown")
      ) {
        sessionStorage.setItem("exitIntentShown", "1")
        trackEvent('exit_intent_shown')
        open("exit-intent")
      }
    }

    document.addEventListener("mouseleave", handleMouseLeave)
    return () => document.removeEventListener("mouseleave", handleMouseLeave)
  }, [open, isOpen])

  return null
}
