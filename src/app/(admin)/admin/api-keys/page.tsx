"use client"

import { useState, useEffect, useCallback } from "react"
import { useCollection } from "@/lib/admin/CollectionContext"
import { Key, Plus, Trash2, Copy, Check, BarChart3, Eye, EyeOff } from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface ApiKeyEntry {
  token_suffix: string
  client: string
  collection: string
  created_at: string
  created_by: string
  revoked: boolean
  usage_this_month: number
}

interface UsageMonth {
  month: string
  count: number
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const { collection } = useCollection()
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [createClient, setCreateClient] = useState("")
  const [creating, setCreating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Revoke confirm
  const [revoking, setRevoking] = useState<string | null>(null)

  // Usage detail
  const [usageClient, setUsageClient] = useState<string | null>(null)
  const [usageData, setUsageData] = useState<UsageMonth[]>([])
  const [usageLoading, setUsageLoading] = useState(false)

  // ─── Fetch keys ──────────────────────────────────────────────────

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/api-keys?collection=${collection}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setKeys(data.keys || [])
    } catch {
      setError("Failed to load API keys")
    } finally {
      setLoading(false)
    }
  }, [collection])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  // ─── Create key ──────────────────────────────────────────────────

  async function handleCreate() {
    if (!createClient.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: createClient.trim(), collection }),
      })
      if (!res.ok) throw new Error("Failed to create key")
      const data = await res.json()
      setNewToken(data.token)
      fetchKeys()
    } catch {
      setError("Failed to create API key")
    } finally {
      setCreating(false)
    }
  }

  function resetCreateModal() {
    setShowCreate(false)
    setCreateClient("")
    setNewToken(null)
    setCopied(false)
  }

  async function copyToken() {
    if (!newToken) return
    await navigator.clipboard.writeText(newToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── Revoke key ──────────────────────────────────────────────────

  async function handleRevoke(tokenSuffix: string, client: string) {
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_suffix: tokenSuffix, client }),
      })
      if (!res.ok) throw new Error("Failed to revoke")
      setRevoking(null)
      fetchKeys()
    } catch {
      setError("Failed to revoke API key")
    }
  }

  // ─── Usage detail ────────────────────────────────────────────────

  async function toggleUsage(client: string) {
    if (usageClient === client) {
      setUsageClient(null)
      return
    }
    setUsageClient(client)
    setUsageLoading(true)
    try {
      const res = await fetch(`/api/admin/api-keys/usage?client=${client}&months=6`)
      if (!res.ok) throw new Error("Failed to fetch usage")
      const data = await res.json()
      setUsageData(data.usage || [])
    } catch {
      setUsageData([])
    } finally {
      setUsageLoading(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage API keys for the budtender recommendation API
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      {/* Key table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No API keys yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Create a key to get started with the budtender API
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left font-medium text-slate-500 px-4 py-3">Client</th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">Key</th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">Created</th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">Status</th>
                <th className="text-right font-medium text-slate-500 px-4 py-3">
                  This Month
                </th>
                <th className="text-right font-medium text-slate-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <>
                  <tr
                    key={key.token_suffix + key.client}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {key.client}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                        ****{key.token_suffix}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(key.created_at).toLocaleDateString()}
                      <span className="block text-xs text-slate-400">
                        by {key.created_by}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {key.revoked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {key.usage_this_month.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleUsage(key.client)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Usage details"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        {!key.revoked && (
                          <>
                            {revoking === key.token_suffix + key.client ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    handleRevoke(key.token_suffix, key.client)
                                  }
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setRevoking(null)}
                                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setRevoking(key.token_suffix + key.client)
                                }
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Revoke key"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Usage detail row */}
                  {usageClient === key.client && (
                    <tr key={key.token_suffix + key.client + "-usage"}>
                      <td colSpan={6} className="px-4 py-4 bg-slate-50">
                        <UsageDetail
                          client={key.client}
                          loading={usageLoading}
                          data={usageData}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            {newToken ? (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  API Key Created
                </h2>
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
                  Copy this key now — you won&apos;t be able to see it again.
                </div>
                <div className="flex items-center gap-2 mb-6">
                  <code className="flex-1 text-xs bg-slate-100 px-3 py-2 rounded font-mono break-all">
                    {newToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={resetCreateModal}
                  className="w-full px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Create API Key
                </h2>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={createClient}
                  onChange={(e) => setCreateClient(e.target.value)}
                  placeholder="e.g. goldcanna-shopify"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 mb-2"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
                <p className="text-xs text-slate-400 mb-4">
                  Collection: <span className="font-medium">{collection}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={resetCreateModal}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !createClient.trim()}
                    className="flex-1 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Usage detail sub-component ─────────────────────────────────────

function UsageDetail({
  client,
  loading,
  data,
}: {
  client: string
  loading: boolean
  data: UsageMonth[]
}) {
  if (loading) {
    return <div className="text-sm text-slate-400">Loading usage data...</div>
  }

  if (data.length === 0) {
    return <div className="text-sm text-slate-400">No usage data available</div>
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div>
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
        Monthly Usage — {client}
      </h3>
      <div className="flex items-end gap-2 h-24">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-slate-600 tabular-nums">
              {d.count > 0 ? d.count.toLocaleString() : "—"}
            </span>
            <div
              className="w-full bg-slate-900 rounded-t"
              style={{
                height: `${Math.max((d.count / maxCount) * 64, 2)}px`,
              }}
            />
            <span className="text-[10px] text-slate-400">
              {d.month.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
