"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Boxes,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { useCollection } from "@/lib/admin/CollectionContext"
import { COLLECTIONS, type CollectionConfig } from "@/lib/admin/collections"

const HARDCODED_IDS = new Set(COLLECTIONS.map((c) => c.id))

// Known static routes (not through /demo/[slug])
const STATIC_ROUTES: Record<string, string> = {
  xtaldemo: "/try",
  willow: "/willow",
}

function demoUrl(id: string) {
  return STATIC_ROUTES[id] ?? `/demo/${id}`
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

// ─── Types ──────────────────────────────────────────────────

interface TaskStatus {
  id: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  progress: number
  message: string
  result?: Record<string, unknown>
  error?: string
}

// ─── Main Page ──────────────────────────────────────────────

export default function DemosPage() {
  const { collections, refreshCollections } = useCollection()
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm(`Remove "${id}" from the demo list?`)) return
    setDeleting(id)
    try {
      const res = await fetch("/api/admin/collections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to delete")
      } else {
        await refreshCollections()
      }
    } catch {
      alert("Failed to delete demo")
    } finally {
      setDeleting(null)
    }
  }

  const handleCreated = async () => {
    setShowForm(false)
    await refreshCollections()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage prospect demo environments with their own product
            catalog.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-xtal-navy text-white hover:bg-xtal-navy/90 transition-colors"
          >
            <Plus size={16} />
            Create Demo
          </button>
        )}
      </div>

      {showForm && (
        <CreateDemoForm
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <DemoCard
            key={c.id}
            collection={c}
            isBuiltIn={HARDCODED_IDS.has(c.id)}
            isDeleting={deleting === c.id}
            onDelete={() => handleDelete(c.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Demo Card ──────────────────────────────────────────────

function DemoCard({
  collection,
  isBuiltIn,
  isDeleting,
  onDelete,
}: {
  collection: CollectionConfig
  isBuiltIn: boolean
  isDeleting: boolean
  onDelete: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-xtal-navy/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Boxes className="w-5 h-5 text-xtal-navy" />
          <h3 className="font-semibold text-slate-900">{collection.label}</h3>
        </div>
        {isBuiltIn && (
          <span className="text-[10px] font-medium uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            Built-in
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-1 font-mono">{collection.id}</p>
      <p className="text-sm text-slate-500 mb-4">{collection.description}</p>

      <div className="flex items-center gap-2">
        <a
          href={demoUrl(collection.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-xtal-navy hover:text-xtal-navy/70 transition-colors"
        >
          <ExternalLink size={12} />
          View demo
        </a>
        {!isBuiltIn && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Create Demo Form ───────────────────────────────────────

function CreateDemoForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const slug = slugify(name)

  // Poll task status
  const pollTask = useCallback(
    async (tid: string) => {
      try {
        const res = await fetch(`/api/admin/demos/task/${tid}`)
        if (!res.ok) return
        const data: TaskStatus = await res.json()
        setTaskStatus(data)

        if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
          if (pollRef.current) clearInterval(pollRef.current)
          if (data.status === "completed") {
            // Wait a moment then close
            setTimeout(onCreated, 1500)
          }
        }
      } catch {
        // Ignore polling errors
      }
    },
    [onCreated]
  )

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleSubmit = async () => {
    if (!name.trim() || !file || !slug) return
    setSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("collection_name", slug)
      formData.append("label", name.trim())

      const res = await fetch("/api/admin/demos/ingest", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Request failed: ${res.status}`)
      }

      const data = await res.json()
      setTaskId(data.task_id)

      // Start polling
      pollRef.current = setInterval(() => pollTask(data.task_id), 1500)
      pollTask(data.task_id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start ingestion")
      setSubmitting(false)
    }
  }

  const isIngesting = !!taskId
  const isDone = taskStatus?.status === "completed"
  const isFailed = taskStatus?.status === "failed"

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Create New Demo
        </h2>
        {!isIngesting && (
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!isIngesting ? (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Demo Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Willow Home Goods"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-xtal-navy/50 transition-colors"
              />
              {slug && (
                <p className="mt-1 text-xs text-slate-400">
                  Slug:{" "}
                  <span className="font-mono text-slate-500">{slug}</span>
                  {" "}— accessible at{" "}
                  <span className="font-mono text-xtal-navy">
                    /demo/{slug}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Shopify CSV Export
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f) setFile(f)
                }}
                className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-xtal-navy/30 transition-colors"
              >
                <Upload
                  size={24}
                  className="mx-auto mb-2 text-slate-300"
                />
                {file ? (
                  <p className="text-sm text-slate-700">
                    {file.name}{" "}
                    <span className="text-slate-400">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    Drop a CSV here or click to browse
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !file || !slug}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                name.trim() && file && slug
                  ? "bg-xtal-navy text-white hover:bg-xtal-navy/90"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Upload size={14} />
              Create & Ingest
            </button>
          </div>
        </>
      ) : (
        <IngestionProgress
          taskStatus={taskStatus}
          isDone={isDone}
          isFailed={isFailed}
          slug={slug}
          label={name}
        />
      )}
    </div>
  )
}

// ─── Ingestion Progress ─────────────────────────────────────

function IngestionProgress({
  taskStatus,
  isDone,
  isFailed,
  slug,
  label,
}: {
  taskStatus: TaskStatus | null
  isDone: boolean
  isFailed: boolean
  slug: string
  label: string
}) {
  const progress = taskStatus?.progress ?? 0
  const message = taskStatus?.message ?? "Starting..."

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-700">
            {isDone
              ? "Ingestion complete"
              : isFailed
              ? "Ingestion failed"
              : "Ingesting..."}
          </span>
          <span className="text-sm font-mono text-slate-500">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFailed
                ? "bg-red-500"
                : isDone
                ? "bg-emerald-500"
                : "bg-xtal-navy"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status message */}
      <p className="text-sm text-slate-500">{message}</p>

      {/* Error */}
      {isFailed && taskStatus?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {taskStatus.error}
        </div>
      )}

      {/* Success */}
      {isDone && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">
              {label} is ready
            </span>
          </div>
          {taskStatus?.result && (
            <div className="grid grid-cols-3 gap-3 text-xs text-emerald-600">
              <div>
                <span className="block text-emerald-700 font-semibold text-lg">
                  {String(taskStatus.result.stored ?? taskStatus.result.total_products)}
                </span>
                products
              </div>
              <div>
                <span className="block text-emerald-700 font-semibold text-lg">
                  {String(taskStatus.result.products_per_minute ?? "—")}
                </span>
                products/min
              </div>
              <div>
                <span className="block text-emerald-700 font-semibold text-lg">
                  {String(taskStatus.result.elapsed_seconds ?? "—")}s
                </span>
                total time
              </div>
            </div>
          )}
          <a
            href={`/demo/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <ExternalLink size={14} />
            Open demo
          </a>
        </div>
      )}
    </div>
  )
}
