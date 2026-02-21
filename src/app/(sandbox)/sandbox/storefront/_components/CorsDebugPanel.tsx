"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface LogEntry {
  id: number
  timestamp: Date
  type: "success" | "error" | "warning" | "info"
  method: string
  url: string
  status?: number
  duration?: number
  message: string
  headers?: Record<string, string>
}

export default function CorsDebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [monitoring, setMonitoring] = useState(false)
  const nextId = useRef(0)
  const originalFetch = useRef<typeof fetch | null>(null)

  const addLog = useCallback(
    (entry: Omit<LogEntry, "id" | "timestamp">) => {
      setLogs((prev) => [
        { ...entry, id: nextId.current++, timestamp: new Date() },
        ...prev.slice(0, 99),
      ])
    },
    []
  )

  // Passive request monitor — monkey-patch fetch
  useEffect(() => {
    if (!monitoring) return

    originalFetch.current = window.fetch
    const origFetch = window.fetch

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const isXtal = url.includes("/api/xtal/")

      if (!isXtal) {
        return origFetch.call(window, input, init)
      }

      const method = init?.method || "GET"
      const t0 = performance.now()

      try {
        const res = await origFetch.call(window, input, init)
        const duration = Math.round(performance.now() - t0)

        const corsHeaders: Record<string, string> = {}
        const acao = res.headers.get("access-control-allow-origin")
        if (acao) corsHeaders["access-control-allow-origin"] = acao
        const acam = res.headers.get("access-control-allow-methods")
        if (acam) corsHeaders["access-control-allow-methods"] = acam

        addLog({
          type: res.ok ? "success" : "error",
          method,
          url,
          status: res.status,
          duration,
          message: res.ok ? "OK" : `HTTP ${res.status}`,
          headers: corsHeaders,
        })

        return res
      } catch (err) {
        const duration = Math.round(performance.now() - t0)
        addLog({
          type: "error",
          method,
          url,
          duration,
          message: err instanceof Error ? err.message : "Network error",
        })
        throw err
      }
    }

    addLog({ type: "info", method: "", url: "", message: "Passive monitor started — intercepting /api/xtal/* requests" })

    return () => {
      if (originalFetch.current) {
        window.fetch = originalFetch.current
      }
      originalFetch.current = null
    }
  }, [monitoring, addLog])

  async function handleManualProbe() {
    const url = "/api/xtal/search-full"
    const t0 = performance.now()
    addLog({ type: "info", method: "POST", url, message: "Sending CORS probe..." })

    try {
      const res = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test", collection: "willow", limit: 1 }),
      })
      const duration = Math.round(performance.now() - t0)

      const corsHeaders: Record<string, string> = {}
      for (const [k, v] of res.headers.entries()) {
        if (k.startsWith("access-control")) corsHeaders[k] = v
      }

      addLog({
        type: res.ok ? "success" : "error",
        method: "POST",
        url,
        status: res.status,
        duration,
        message: `CORS probe: ${res.status} ${res.statusText}`,
        headers: corsHeaders,
      })
    } catch (err) {
      const duration = Math.round(performance.now() - t0)
      addLog({
        type: "error",
        method: "POST",
        url,
        duration,
        message: `CORS probe failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      })
    }
  }

  const typeColors: Record<LogEntry["type"], string> = {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#eab308",
    info: "#64748b",
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 mb-2">
        Test CORS behavior against /api/xtal/* endpoints.
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleManualProbe}
          className="px-3 py-1.5 rounded text-xs font-medium"
          style={{ background: "#3b82f6", color: "#fff" }}
        >
          Manual CORS Probe
        </button>
        <button
          onClick={() => setMonitoring(!monitoring)}
          className="px-3 py-1.5 rounded text-xs font-medium"
          style={{ background: monitoring ? "#ef4444" : "#22c55e", color: "#fff" }}
        >
          {monitoring ? "Stop Monitor" : "Start Monitor"}
        </button>
        <button
          onClick={() => setLogs([])}
          className="px-3 py-1.5 rounded text-xs font-medium"
          style={{ background: "#333", color: "#94a3b8" }}
        >
          Clear Log
        </button>
      </div>

      {/* Log display */}
      <div
        className="rounded border overflow-auto"
        style={{
          background: "#0f0f1a",
          borderColor: "#333",
          maxHeight: "calc(40vh - 140px)",
        }}
      >
        {logs.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: "#64748b" }}>
            No requests logged. Click &quot;Manual CORS Probe&quot; or start the passive monitor.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "#1e1e2e" }}>
            {logs.map((log) => (
              <div key={log.id} className="px-3 py-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span style={{ color: typeColors[log.type] }}>
                    {log.type === "success" ? "\u2713" : log.type === "error" ? "\u2717" : log.type === "warning" ? "\u26a0" : "\u2022"}
                  </span>
                  <span style={{ color: "#64748b" }}>
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  {log.method && (
                    <span className="font-bold" style={{ color: "#818cf8" }}>
                      {log.method}
                    </span>
                  )}
                  {log.url && (
                    <span className="truncate" style={{ color: "#94a3b8" }}>
                      {log.url}
                    </span>
                  )}
                  {log.status !== undefined && (
                    <span style={{ color: log.status < 400 ? "#22c55e" : "#ef4444" }}>
                      {log.status}
                    </span>
                  )}
                  {log.duration !== undefined && (
                    <span style={{ color: "#64748b" }}>{log.duration}ms</span>
                  )}
                </div>
                <div className="ml-5" style={{ color: "#94a3b8" }}>
                  {log.message}
                </div>
                {log.headers && Object.keys(log.headers).length > 0 && (
                  <div className="ml-5 mt-0.5" style={{ color: "#64748b" }}>
                    {Object.entries(log.headers).map(([k, v]) => (
                      <div key={k}>
                        <span style={{ color: "#818cf8" }}>{k}:</span> {v}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
