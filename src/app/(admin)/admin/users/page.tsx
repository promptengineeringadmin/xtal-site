"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users as UsersIcon,
  Mail,
  Shield,
  UserCircle,
  Send,
  Trash2,
  X,
  Clock,
  Check,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserRecord {
  id: string
  name: string | null
  email: string
  image: string | null
  role: "internal" | "client"
  organizationId: string | null
  organizationName: string | null
}

interface Invitation {
  id: string
  email: string
  organizationId: string | null
  organizationName: string | null
  status: "pending" | "accepted" | "revoked"
  createdAt: string
  acceptedAt: string | null
}

interface OrgOption {
  id: string
  name: string
  slug: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function UsersPage() {
  /* ---- data state ---- */
  const [users, setUsers] = useState<UserRecord[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ---- ui state ---- */
  const [activeTab, setActiveTab] = useState<"users" | "invitations">("users")
  const [showInvite, setShowInvite] = useState(false)

  /* ---- invite form state ---- */
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteOrgId, setInviteOrgId] = useState("")
  const [sending, setSending] = useState(false)

  /* ---- role change state ---- */
  const [roleChangeUser, setRoleChangeUser] = useState<UserRecord | null>(null)
  const [pendingRole, setPendingRole] = useState<"internal" | "client" | null>(null)
  const [changingRole, setChangingRole] = useState(false)

  /* ---- revoke state ---- */
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const pendingCount = invitations.filter((inv) => inv.status === "pending").length

  /* ---------------------------------------------------------------- */
  /*  Fetch data                                                       */
  /* ---------------------------------------------------------------- */

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, invRes, orgsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/invitations"),
        fetch("/api/admin/organizations"),
      ])
      if (!usersRes.ok) throw new Error(`Failed to fetch users (${usersRes.status})`)
      if (!invRes.ok) throw new Error(`Failed to fetch invitations (${invRes.status})`)
      if (!orgsRes.ok) throw new Error(`Failed to fetch organizations (${orgsRes.status})`)

      const [usersData, invData, orgsData] = await Promise.all([
        usersRes.json(),
        invRes.json(),
        orgsRes.json(),
      ])

      setUsers(usersData.users ?? [])
      setInvitations(invData.invitations ?? [])
      setOrgs(orgsData.organizations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  /* ---------------------------------------------------------------- */
  /*  Invite user                                                      */
  /* ---------------------------------------------------------------- */

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          organizationId: inviteOrgId || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Failed to send invitation (${res.status})`)
      }
      setShowInvite(false)
      setInviteEmail("")
      setInviteOrgId("")
      await fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setSending(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Change role                                                      */
  /* ---------------------------------------------------------------- */

  async function handleRoleChange() {
    if (!roleChangeUser || !pendingRole) return
    setChangingRole(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${roleChangeUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pendingRole }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Failed to change role (${res.status})`)
      }
      setRoleChangeUser(null)
      setPendingRole(null)
      await fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setChangingRole(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Revoke invitation                                                */
  /* ---------------------------------------------------------------- */

  async function handleRevoke(invId: string) {
    setRevokingId(invId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/invitations/${invId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`Failed to revoke invitation (${res.status})`)
      await fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invitation")
    } finally {
      setRevokingId(null)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon className="text-xtal-navy" size={28} />
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-xtal-navy text-white rounded-lg hover:bg-xtal-navy/90 transition-colors text-sm font-medium"
        >
          <Send size={16} />
          Invite User
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

      {/* Role change confirmation dialog */}
      {roleChangeUser && pendingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-xtal-navy" size={24} />
              <h2 className="text-lg font-semibold text-slate-900">Change User Role</h2>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Change <strong>{roleChangeUser.name ?? roleChangeUser.email}</strong>&apos;s role
              from{" "}
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  roleChangeUser.role === "internal"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {roleChangeUser.role}
              </span>{" "}
              to{" "}
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  pendingRole === "internal"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {pendingRole}
              </span>
              ?
            </p>
            <p className="text-xs text-slate-400 mb-5">
              {pendingRole === "internal"
                ? "Internal users have full access to all collections and admin features."
                : "Client users can only access collections assigned to their organization."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRoleChangeUser(null)
                  setPendingRole(null)
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={changingRole}
                className="px-4 py-2 bg-xtal-navy text-white rounded-lg text-sm font-medium hover:bg-xtal-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {changingRole ? "Updating..." : "Confirm Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Invite User</h2>
            <button
              onClick={() => {
                setShowInvite(false)
                setInviteEmail("")
                setInviteOrgId("")
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-xtal-navy/30 focus:border-xtal-navy"
                />
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
              <select
                value={inviteOrgId}
                onChange={(e) => setInviteOrgId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-xtal-navy/30 focus:border-xtal-navy bg-white"
              >
                <option value="">No organization (internal)</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowInvite(false)
                setInviteEmail("")
                setInviteOrgId("")
              }}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={sending || !inviteEmail.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-xtal-navy text-white rounded-lg text-sm font-medium hover:bg-xtal-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={14} />
              {sending ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "users"
              ? "border-xtal-navy text-xtal-navy"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <UsersIcon size={16} />
            Users
          </span>
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "invitations"
              ? "border-xtal-navy text-xtal-navy"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <Mail size={16} />
            Invitations
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 min-w-[20px]">
                {pendingCount} pending
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0 animate-pulse">
              <div className="w-9 h-9 bg-slate-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-48 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/*  Users Tab                                                    */}
      {/* ============================================================ */}

      {!loading && activeTab === "users" && (
        <>
          {users.length === 0 ? (
            <div className="p-12 bg-white border border-slate-200 rounded-xl text-center">
              <UserCircle className="mx-auto mb-3 text-slate-300" size={48} />
              <h3 className="text-lg font-medium text-slate-600 mb-1">No users yet</h3>
              <p className="text-sm text-slate-400 mb-4">
                Send invitations to add users to the admin panel.
              </p>
              <button
                onClick={() => setShowInvite(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-xtal-navy text-white rounded-lg hover:bg-xtal-navy/90 transition-colors text-sm font-medium"
              >
                <Send size={16} />
                Invite User
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid md:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="w-9" />
                <div>Name</div>
                <div>Email</div>
                <div>Organization</div>
                <div>Role</div>
              </div>

              {/* User rows */}
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col md:grid md:grid-cols-[auto_1fr_1fr_auto_auto] gap-2 md:gap-4 items-start md:items-center px-5 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                        {(user.name ?? user.email)?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.name ?? "Unnamed User"}
                    </p>
                    <p className="text-xs text-slate-400 md:hidden truncate">{user.email}</p>
                  </div>

                  {/* Email (desktop) */}
                  <div className="hidden md:block min-w-0">
                    <p className="text-sm text-slate-600 truncate">{user.email}</p>
                  </div>

                  {/* Organization */}
                  <div className="text-xs text-slate-500">
                    {user.organizationName ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md">
                        {user.organizationName}
                      </span>
                    ) : (
                      <span className="text-slate-300">&mdash;</span>
                    )}
                  </div>

                  {/* Role selector */}
                  <div>
                    <select
                      value={user.role}
                      onChange={(e) => {
                        const newRole = e.target.value as "internal" | "client"
                        if (newRole !== user.role) {
                          setRoleChangeUser(user)
                          setPendingRole(newRole)
                        }
                      }}
                      className={`appearance-none cursor-pointer rounded-full px-3 py-1 text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        user.role === "internal"
                          ? "bg-purple-100 text-purple-700 focus:ring-purple-300"
                          : "bg-blue-100 text-blue-700 focus:ring-blue-300"
                      }`}
                    >
                      <option value="internal">internal</option>
                      <option value="client">client</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  Invitations Tab                                              */}
      {/* ============================================================ */}

      {!loading && activeTab === "invitations" && (
        <>
          {invitations.length === 0 ? (
            <div className="p-12 bg-white border border-slate-200 rounded-xl text-center">
              <Mail className="mx-auto mb-3 text-slate-300" size={48} />
              <h3 className="text-lg font-medium text-slate-600 mb-1">No invitations</h3>
              <p className="text-sm text-slate-400 mb-4">
                Invite users to give them access to the admin panel.
              </p>
              <button
                onClick={() => setShowInvite(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-xtal-navy text-white rounded-lg hover:bg-xtal-navy/90 transition-colors text-sm font-medium"
              >
                <Send size={16} />
                Invite User
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => {
                const isPending = inv.status === "pending"
                const isAccepted = inv.status === "accepted"
                const isRevoked = inv.status === "revoked"

                return (
                  <div
                    key={inv.id}
                    className={`bg-white border rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                      isRevoked
                        ? "border-slate-200 opacity-60"
                        : "border-slate-200 shadow-sm"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                        isPending
                          ? "bg-amber-100 text-amber-600"
                          : isAccepted
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isPending ? (
                        <Clock size={16} />
                      ) : isAccepted ? (
                        <Check size={16} />
                      ) : (
                        <X size={16} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-900">{inv.email}</p>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-100 text-amber-700"
                              : isAccepted
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        {inv.organizationName && <span>Org: {inv.organizationName}</span>}
                        <span>
                          Sent{" "}
                          {new Date(inv.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {inv.acceptedAt && (
                          <span>
                            Accepted{" "}
                            {new Date(inv.acceptedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {isPending && (
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        disabled={revokingId === inv.id}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        {revokingId === inv.id ? "Revoking..." : "Revoke"}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
