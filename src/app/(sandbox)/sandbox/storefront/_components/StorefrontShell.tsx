"use client"

import { useState } from "react"
import type { Product } from "@/lib/xtal-types"
import StorefrontHeader, { type DomScenario } from "./StorefrontHeader"
import StorefrontHero from "./StorefrontHero"
import StorefrontProductGrid from "./StorefrontProductGrid"
import StorefrontFooter from "./StorefrontFooter"
import DomScenarioPanel from "./DomScenarioPanel"
import ScriptInjectionPanel from "./ScriptInjectionPanel"
import CorsDebugPanel from "./CorsDebugPanel"

type DevTab = "dom" | "script" | "cors"

interface Props {
  products: Product[]
}

export default function StorefrontShell({ products }: Props) {
  const [scenario, setScenario] = useState<DomScenario>("shopify-dawn")
  const [devOpen, setDevOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<DevTab>("dom")

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      {/* Warning banner */}
      <div className="bg-amber-100 text-amber-900 text-xs text-center py-1.5 font-mono">
        XTAL Sandbox — Script injection enabled for development testing only
      </div>

      {/* Storefront */}
      <StorefrontHeader scenario={scenario} />
      <StorefrontHero />
      <StorefrontProductGrid products={products} />
      <StorefrontFooter />

      {/* Dev tools toggle */}
      <button
        onClick={() => setDevOpen(!devOpen)}
        className="fixed bottom-4 right-4 z-[9999] px-4 py-2 rounded-lg text-xs font-mono font-bold shadow-lg transition-colors"
        style={{
          background: devOpen ? "#ef4444" : "#1e1e2e",
          color: "#fff",
        }}
      >
        {devOpen ? "Close Dev Tools" : "Dev Tools"}
      </button>

      {/* Dev tools panel */}
      {devOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[9998] shadow-2xl border-t overflow-hidden flex flex-col"
          style={{
            height: "40vh",
            background: "#1e1e2e",
            borderColor: "#333",
            fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
          }}
        >
          {/* Tab bar */}
          <div className="flex border-b" style={{ borderColor: "#333" }}>
            {(
              [
                { id: "dom", label: "DOM Scenarios" },
                { id: "script", label: "Script Injection" },
                { id: "cors", label: "CORS Debug" },
              ] as { id: DevTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  color: activeTab === tab.id ? "#e2e8f0" : "#64748b",
                  background: activeTab === tab.id ? "#2d2d3f" : "transparent",
                  borderBottom: activeTab === tab.id ? "2px solid #818cf8" : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === "dom" && (
              <DomScenarioPanel scenario={scenario} onScenarioChange={setScenario} />
            )}
            {activeTab === "script" && <ScriptInjectionPanel />}
            {activeTab === "cors" && <CorsDebugPanel />}
          </div>
        </div>
      )}
    </div>
  )
}
