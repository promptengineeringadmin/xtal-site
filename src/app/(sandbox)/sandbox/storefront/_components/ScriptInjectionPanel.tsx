"use client"

import { useState, useRef } from "react"

const PRESETS: { label: string; snippet: string }[] = [
  {
    label: "Willow",
    snippet: '<script src="/client/v1/xtal.js" data-shop-id="willow" async></script>',
  },
  {
    label: "XTAL Demo",
    snippet: '<script src="/client/v1/xtal.js" data-shop-id="xtaldemo" async></script>',
  },
  {
    label: "Best Buy",
    snippet: '<script src="/client/v1/xtal.js" data-shop-id="bestbuy" async></script>',
  },
  {
    label: "Broken URL",
    snippet: '<script src="/client/v1/nonexistent.js" data-shop-id="willow" async></script>',
  },
]

export default function ScriptInjectionPanel() {
  const [code, setCode] = useState(PRESETS[0].snippet)
  const [injected, setInjected] = useState(false)
  const injectedScriptsRef = useRef<HTMLScriptElement[]>([])

  function handleInject() {
    // Parse script tags from the textarea
    const parser = new DOMParser()
    const doc = parser.parseFromString(code, "text/html")
    const scripts = doc.querySelectorAll("script")

    scripts.forEach((parsed) => {
      const script = document.createElement("script")
      // Copy attributes
      for (const attr of Array.from(parsed.attributes)) {
        script.setAttribute(attr.name, attr.value)
      }
      // Copy inline content
      if (parsed.textContent) {
        script.textContent = parsed.textContent
      }
      script.setAttribute("data-xtal-injected", "true")
      document.head.appendChild(script)
      injectedScriptsRef.current.push(script)
    })

    setInjected(true)
  }

  function handleClear() {
    // Remove injected scripts
    injectedScriptsRef.current.forEach((s) => s.remove())
    injectedScriptsRef.current = []

    // Clean up XTAL global
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).XTAL
    }

    // Remove any shadow DOM hosts created by xtal.js
    document.querySelectorAll("[data-xtal-host]").forEach((el) => el.remove())

    setInjected(false)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 mb-2">
        Inject a &lt;script&gt; tag into the page to test xtal.js loading and search hooking.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setCode(p.snippet)
              setInjected(false)
            }}
            className="px-2 py-1 rounded text-[10px] font-medium border transition-colors"
            style={{
              borderColor: code === p.snippet ? "#818cf8" : "#333",
              color: code === p.snippet ? "#818cf8" : "#94a3b8",
              background: code === p.snippet ? "#2d2d4f" : "transparent",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={3}
        className="w-full rounded border px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
        style={{
          background: "#252535",
          borderColor: "#333",
          color: "#e2e8f0",
          fontFamily: "inherit",
        }}
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleInject}
          disabled={injected}
          className="px-4 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40"
          style={{ background: "#22c55e", color: "#fff" }}
        >
          {injected ? "Injected" : "Inject"}
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-1.5 rounded text-xs font-medium transition-colors"
          style={{ background: "#ef4444", color: "#fff" }}
        >
          Clear / Reset
        </button>
      </div>

      {injected && (
        <p className="text-[10px] text-green-400">
          Script(s) injected into document.head. Check the console for xtal.js boot logs.
        </p>
      )}
    </div>
  )
}
