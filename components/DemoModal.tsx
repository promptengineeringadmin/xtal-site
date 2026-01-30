"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import DemoForm from "./DemoForm"
import { useDemoModal } from "@/contexts/DemoModalContext"

export default function DemoModal() {
  const { isOpen, close, source } = useDemoModal()
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, close])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) close()
  }

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-slideUp">
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-10">
          <h2 className="text-2xl font-bold mb-2 text-xtal-navy">Request a Demo</h2>
          <p className="text-slate-500 mb-6">
            See how XTAL Search transforms your store&apos;s conversion rate.
          </p>

          <DemoForm onSuccess={close} source={source} />
        </div>
      </div>
    </div>
  )
}
