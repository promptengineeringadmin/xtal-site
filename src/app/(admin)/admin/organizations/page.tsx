"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Building2,
  Plus,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react"
import { useCollection } from "@/lib/admin/CollectionContext"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrgMember {
  id: string
  name: string | null
  email: string
  role: string
}

interface Organization {
  id: string
  name: string
  slug: string
  collections: string[]
  members: OrgMember[]
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OrganizationsPage() {
  const { collections } = useCollection()

  /* ---- data state ---- */
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ---- ui state ---- */
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  /* ---- create form state ---- */
  const [newName, setNewName] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  /* ---- delete state ---- */
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  /* ---- remove member state ---- */
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  /* ---------------------------------------------------------------- */
  /*  Fetch organizations                                              */
  /* ---------------------------------------------------------------- */

  const fetchOrgs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/organizations")
      if (!res.ok) throw new Error(`Failed to fetch organizations (${res.status})`)
      const data = await res.json()
      setOrgs(data.organizations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrgs()
  }, [fetchOrgs])

  /* ---------------------------------------------------------------- */
  /*  Create organization                                              */
  /* ---------------------------------------------------------------- */

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: (newSlug || slugify(newName)).trim(),
          collections: selectedCollections,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Failed to create organization (${res.status})`)
      }
      setShowCreate(false)
      setNewName("")
      setNewSlug("")
      setSlugTouched(false)
      setSelectedCollections([])
      await fetchOrgs()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization")
    } finally {
      setCreating(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Delete organization                                              */
  /* ---------------------------------------------------------------- */

  async function handleDelete(orgId: string) {
    setDeletingId(orgId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`Failed to delete organization (${res.status})`)
      setConfirmDelete(null)
      if (expandedOrg === orgId) setExpandedOrg(null)
      await fetchOrgs()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete organization")
    } finally {
      setDeletingId(null)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Remove member                                                    */
  /* ---------------------------------------------------------------- */

  async function handleRemoveMember(orgId: string, userId: string) {
    setRemovingMember(userId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/members/${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`Failed to remove member (${res.status})`)
      await fetchOrgs()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member")
    } finally {
      setRemovingMember(null)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Collection toggle helper                                         */
  /* ---------------------------------------------------------------- */

  function toggleCollection(id: string) {
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="text-xtal-navy" size={28} />
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-xtal-navy text-white rounded-lg hover:bg-xtal-navy/90 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Organization
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Create Organization</h2>
            <button
              onClick={() => {
                setShowCreate(false)
                setNewName("")
                setNewSlug("")
                setSlugTouched(false)
                setSelectedCollections([])
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  if (!slugTouched) setNewSlug(slugify(e.target.value))
                }}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-xtal-navy/30 focus:border-xtal-navy"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
              <input
                type="text"
                value={newSlug || slugify(newName)}
                onChange={(e) => {
                  setNewSlug(e.target.value)
                  setSlugTouched(true)
                }}
                placeholder="acme-corp"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-xtal-navy/30 focus:border-xtal-navy"
              />
            </div>
          </div>

          {/* Collection picker */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Collections</label>
            <div className="flex flex-wrap gap-2">
              {collections.map((col) => {
                const active = selectedCollections.includes(col.id)
                return (
                  <button
                    key={col.id}
                    onClick={() => toggleCollection(col.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-xtal-navy text-white border-xtal-navy"
                        : "bg-white text-slate-600 border-slate-300 hover:border-xtal-navy/50"
                    }`}
                  >
                    {col.label}
                  </button>
                )
              })}
            </div>
            {collections.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">No collections available.</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowCreate(false)
                setNewName("")
                setNewSlug("")
                setSlugTouched(false)
                setSelectedCollections([])
              }}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 bg-xtal-navy text-white rounded-lg text-sm font-medium hover:bg-xtal-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? "Creating..." : "Create Organization"}
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orgs.length === 0 && (
        <div className="p-12 bg-white border border-slate-200 rounded-xl text-center">
          <Building2 className="mx-auto mb-3 text-slate-300" size={48} />
          <h3 className="text-lg font-medium text-slate-600 mb-1">No organizations yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            Create an organization to group collections and manage team access.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-xtal-navy text-white rounded-lg hover:bg-xtal-navy/90 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            New Organization
          </button>
        </div>
      )}

      {/* Organizations list */}
      {!loading && orgs.length > 0 && (
        <div className="space-y-3">
          {orgs.map((org) => {
            const isExpanded = expandedOrg === org.id
            return (
              <div
                key={org.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Org row */}
                <button
                  onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-xtal-navy/10 rounded-lg flex items-center justify-center">
                    <Building2 className="text-xtal-navy" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {org.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">{org.slug}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        {org.collections.length} collection{org.collections.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {org.members.length} member{org.members.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-slate-400">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                    {/* Collections */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Collections
                      </h4>
                      {org.collections.length === 0 ? (
                        <p className="text-xs text-slate-400">No collections assigned.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {org.collections.map((colId) => {
                            const col = collections.find((c) => c.id === colId)
                            return (
                              <span
                                key={colId}
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-xtal-navy/10 text-xtal-navy"
                              >
                                {col?.label ?? colId}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Members */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Members
                      </h4>
                      {org.members.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          No members yet. Invite users from the Users page.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {org.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                                  {(member.name ?? member.email)?.[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {member.name ?? "Unnamed"}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveMember(org.id, member.id)}
                                disabled={removingMember === member.id}
                                className="ml-3 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Remove member"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delete org */}
                    <div className="pt-3 border-t border-slate-200">
                      {confirmDelete === org.id ? (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-red-600">
                            Delete &ldquo;{org.name}&rdquo;? This cannot be undone.
                          </span>
                          <button
                            onClick={() => handleDelete(org.id)}
                            disabled={deletingId === org.id}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {deletingId === org.id ? "Deleting..." : "Confirm Delete"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(org.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete Organization
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
