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
  Sparkles,
  Pencil,
  Save,
  RotateCcw,
} from "lucide-react"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import { useCollection } from "@/lib/admin/CollectionContext"
import { COLLECTIONS, type CollectionConfig, type Vertical } from "@/lib/admin/collections"

const HARDCODED_IDS = new Set(COLLECTIONS.map((c) => c.id))

const VERTICALS: { value: Vertical | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "home", label: "Home" },
  { value: "beauty", label: "Beauty" },
  { value: "electronics", label: "Electronics" },
  { value: "food", label: "Food" },
  { value: "outdoor", label: "Outdoor" },
  { value: "pet", label: "Pet" },
  { value: "cannabis", label: "Cannabis" },
  { value: "apparel", label: "Apparel" },
  { value: "niche", label: "Niche" },
  { value: "general", label: "General" },
]

const ITEMS_PER_PAGE = 12

// Known static routes (not through /demo/[slug])
const STATIC_ROUTES: Record<string, string> = {
  xtaldemo: "/try",
  willow: "/willow",
  goldcanna: "/goldcanna",
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
  const [searchQuery, setSearchQuery] = useState("")
  const [activeVertical, setActiveVertical] = useState<Vertical | "all">("all")
  const [sortBy, setSortBy] = useState<"name" | "productCount">("name")
  const [page, setPage] = useState(1)

  // Filter collections
  const filtered = collections.filter((c) => {
    const q = searchQuery.toLowerCase()
    if (q && !c.label.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) {
      return false
    }
    if (activeVertical !== "all" && c.vertical !== activeVertical) {
      return false
    }
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "productCount") {
      return (b.productCount ?? 0) - (a.productCount ?? 0)
    }
    return a.label.localeCompare(b.label)
  })

  // Separate pinned and rest
  const pinned = sorted.filter((c) => c.pinned)
  const rest = sorted.filter((c) => !c.pinned)

  // Paginate the rest (pinned always shown)
  const totalPages = Math.max(1, Math.ceil(rest.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginatedRest = rest.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  )

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, activeVertical, sortBy])

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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
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

      {/* Search + Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search demos..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-xtal-navy/50 transition-colors"
          />
        </div>
        <div className="relative">
          <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "productCount")}
            className="appearance-none pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-xtal-navy/50 cursor-pointer"
          >
            <option value="name">Name A-Z</option>
            <option value="productCount">Product Count</option>
          </select>
        </div>
      </div>

      {/* Vertical filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {VERTICALS.map((v) => (
          <button
            key={v.value}
            onClick={() => setActiveVertical(v.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              activeVertical === v.value
                ? "bg-xtal-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-400 mb-3">
        {sorted.length} collection{sorted.length !== 1 ? "s" : ""}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      {/* Curated/pinned section */}
      {pinned.length > 0 && !searchQuery && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Curated
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {pinned.map((c) => (
              <DemoCard
                key={c.id}
                collection={c}
                isBuiltIn={HARDCODED_IDS.has(c.id)}
                isDeleting={deleting === c.id}
                onDelete={() => handleDelete(c.id)}
                onUpdate={refreshCollections}
              />
            ))}
          </div>
        </>
      )}

      {/* Imported / rest section */}
      {paginatedRest.length > 0 && (
        <>
          {pinned.length > 0 && !searchQuery && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Imported
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedRest.map((c) => (
              <DemoCard
                key={c.id}
                collection={c}
                isBuiltIn={HARDCODED_IDS.has(c.id)}
                isDeleting={deleting === c.id}
                onDelete={() => handleDelete(c.id)}
                onUpdate={refreshCollections}
              />
            ))}
          </div>
        </>
      )}

      {/* When searching, show pinned inline with rest */}
      {searchQuery && pinned.length > 0 && paginatedRest.length === 0 && rest.length === 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pinned.map((c) => (
            <DemoCard
              key={c.id}
              collection={c}
              isBuiltIn={HARDCODED_IDS.has(c.id)}
              isDeleting={deleting === c.id}
              onDelete={() => handleDelete(c.id)}
              onUpdate={refreshCollections}
            />
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-400">
          No collections found
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-500 px-3">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Demo Card ──────────────────────────────────────────────

function DemoCard({
  collection,
  isBuiltIn,
  isDeleting,
  onDelete,
  onUpdate,
}: {
  collection: CollectionConfig
  isBuiltIn: boolean
  isDeleting: boolean
  onDelete: () => void
  onUpdate: () => Promise<void>
}) {
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editValues, setEditValues] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const hasSuggestions = collection.suggestions && collection.suggestions.length > 0

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/demos/suggestions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: collection.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Generation failed")
      }
      const data = await res.json()
      const queries = (data.suggestions || []).map((s: { query: string }) => s.query)
      if (queries.length === 0) {
        throw new Error("No suitable suggestions found for this catalog")
      }
      setEditValues(queries)
      setEditing(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed")
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    const filtered = editValues.filter((v) => v.trim())
    if (filtered.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: collection.id, suggestions: filtered }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Save failed")
      }
      setEditing(false)
      await onUpdate()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    setEditValues([...(collection.suggestions || [])])
    setEditing(true)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-xtal-navy/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Boxes className="w-5 h-5 text-xtal-navy" />
          <h3 className="font-semibold text-slate-900">{collection.label}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {collection.vertical && (
            <span className="text-[9px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
              {collection.vertical}
            </span>
          )}
          {hasSuggestions && (
            <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
              {collection.suggestions!.length} queries
            </span>
          )}
          {isBuiltIn && (
            <span className="text-[10px] font-medium uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              Built-in
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-1 font-mono">{collection.id}</p>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-slate-500">{collection.description}</p>
        {collection.productCount != null && (
          <span className="text-[10px] text-slate-400 whitespace-nowrap">
            {collection.productCount.toLocaleString()} products
          </span>
        )}
      </div>

      {/* Suggestions editor */}
      {editing && (
        <div className="mb-3 space-y-2">
          <label className="text-xs font-medium text-slate-600">
            Example search queries
          </label>
          {editValues.map((val, i) => (
            <input
              key={i}
              type="text"
              value={val}
              onChange={(e) => {
                const updated = [...editValues]
                updated[i] = e.target.value
                setEditValues(updated)
              }}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-xtal-navy/50 transition-colors"
              placeholder={`Query ${i + 1}`}
            />
          ))}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-xtal-navy text-white hover:bg-xtal-navy/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
              title="Re-generate suggestions"
            >
              {generating ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
              Re-generate
            </button>
          </div>
        </div>
      )}

      {/* Show current suggestions when not editing */}
      {!editing && hasSuggestions && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {collection.suggestions!.slice(0, 3).map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 truncate max-w-[180px]"
                title={s}
              >
                {s}
              </span>
            ))}
            {collection.suggestions!.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 text-slate-400">
                +{collection.suggestions!.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-1.5">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

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

        {!editing && (
          <>
            {hasSuggestions ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Pencil size={10} />
                Edit queries
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Sparkles size={10} />
                )}
                {generating ? "Generating..." : "Generate queries"}
              </button>
            )}
          </>
        )}

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

      if (data.task_id) {
        // Legacy async path — start polling
        setTaskId(data.task_id)
        pollRef.current = setInterval(() => pollTask(data.task_id), 1500)
        pollTask(data.task_id)
      } else if (data.status === "completed") {
        // New sync path — immediately show completion
        setTaskId("sync")
        setTaskStatus({
          id: "sync",
          status: "completed",
          progress: 100,
          message: data.message || `Ingested ${data.products_processed} products`,
        })
        setTimeout(onCreated, 1500)
      }
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
