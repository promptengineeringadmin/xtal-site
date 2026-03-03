"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users,
  Plus,
  Pencil,
  BarChart3,
  Download,
  Power,
  PowerOff,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface PricingChange {
  effective_date: string
  price_per_search: number
  price_per_aspect_click: number
  price_per_explain: number
  flat_monthly_fee?: number
  billing_model: "usage" | "flat"
  changed_by?: string
}

interface BillingCustomer {
  slug: string
  company_name: string
  display_name: string
  primary_contact_name?: string
  primary_contact_email?: string
  billing_email: string
  collections: string[]
  customer_type: "demo" | "trial" | "paying"
  status: "prospect" | "active" | "paused" | "churned"
  billing_start?: string
  billing_end?: string
  website?: string
  deployment_method?: "gtm" | "direct" | "shopify_app" | "other"
  launch_date?: string
  billing_model: "usage" | "flat"
  price_per_search: number
  price_per_aspect_click: number
  price_per_explain: number
  flat_monthly_fee?: number
  pricing_history?: PricingChange[]
  notes?: string
  created_at: string
  updated_at: string
  total_this_month?: number
}

interface UsageMonth {
  month: string
  usage: { search: number; aspect_click: number; explain: number }
}

const STATUS_BADGES: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-50", text: "text-green-700" },
  prospect: { bg: "bg-blue-50", text: "text-blue-700" },
  paused: { bg: "bg-amber-50", text: "text-amber-700" },
  churned: { bg: "bg-red-50", text: "text-red-700" },
}

const TYPE_BADGES: Record<string, { bg: string; text: string }> = {
  paying: { bg: "bg-green-50", text: "text-green-700" },
  trial: { bg: "bg-purple-50", text: "text-purple-700" },
  demo: { bg: "bg-slate-50", text: "text-slate-600" },
}

// ─── Page ───────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<BillingCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<BillingCustomer | null>(null)
  const [saving, setSaving] = useState(false)

  // Usage
  const [usageSlug, setUsageSlug] = useState<string | null>(null)
  const [usageData, setUsageData] = useState<UsageMonth[]>([])
  const [usageLoading, setUsageLoading] = useState(false)

  // Invoice
  const [invoiceSlug, setInvoiceSlug] = useState<string | null>(null)
  const [invoiceMonth, setInvoiceMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  // ─── Fetch ─────────────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/admin/customers")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch {
      setError("Failed to load customers")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // ─── Usage toggle ──────────────────────────────────────────────────

  async function toggleUsage(slug: string, collections: string[]) {
    if (usageSlug === slug) {
      setUsageSlug(null)
      return
    }
    setUsageSlug(slug)
    setUsageLoading(true)
    try {
      // Fetch usage for first collection (most customers have one)
      const col = collections[0]
      if (!col) {
        setUsageData([])
        return
      }
      const res = await fetch(`/api/admin/customers/usage?collection=${col}&months=6`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setUsageData(data.usage || [])
    } catch {
      setUsageData([])
    } finally {
      setUsageLoading(false)
    }
  }

  // ─── Invoice download ─────────────────────────────────────────────

  async function downloadInvoice(slug: string) {
    setInvoiceLoading(true)
    try {
      const res = await fetch("/api/admin/customers/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, month: invoiceMonth }),
      })
      if (!res.ok) throw new Error("Failed to generate invoice")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `xtal-invoice-${slug}-${invoiceMonth}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setInvoiceSlug(null)
    } catch {
      setError("Failed to generate invoice")
    } finally {
      setInvoiceLoading(false)
    }
  }

  // ─── Activate / Deactivate ────────────────────────────────────────

  async function handleToggleStatus(customer: BillingCustomer) {
    const newStatus = customer.status === "active" ? "paused" : "active"
    const newType = newStatus === "active" ? "paying" : customer.customer_type
    try {
      await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customer,
          status: newStatus,
          customer_type: newType,
          billing_start:
            newStatus === "active"
              ? customer.billing_start || new Date().toISOString().split("T")[0]
              : customer.billing_start,
          billing_end:
            newStatus !== "active"
              ? new Date().toISOString().split("T")[0]
              : undefined,
        }),
      })
      fetchCustomers()
    } catch {
      setError("Failed to update customer status")
    }
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage billing customers and generate invoices
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
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

      {/* Customer table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No customers yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Add a customer to get started with billing
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left font-medium text-slate-500 px-4 py-3">
                  Company
                </th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">
                  Type
                </th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">
                  Status
                </th>
                <th className="text-left font-medium text-slate-500 px-4 py-3">
                  Collections
                </th>
                <th className="text-right font-medium text-slate-500 px-4 py-3">
                  This Month
                </th>
                <th className="text-right font-medium text-slate-500 px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <>
                  <tr
                    key={c.slug}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {c.display_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {c.company_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGES[c.customer_type]?.bg || ""} ${TYPE_BADGES[c.customer_type]?.text || ""}`}
                      >
                        {c.customer_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[c.status]?.bg || ""} ${STATUS_BADGES[c.status]?.text || ""}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {c.collections.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {c.total_this_month !== undefined
                        ? `$${c.total_this_month.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleUsage(c.slug, c.collections)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Usage details"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setInvoiceSlug(
                              invoiceSlug === c.slug ? null : c.slug
                            )
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Generate invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCustomer(c)
                            setShowModal(true)
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Edit customer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`p-1.5 rounded transition-colors ${
                            c.status === "active"
                              ? "text-green-500 hover:text-amber-600"
                              : "text-slate-400 hover:text-green-600"
                          }`}
                          title={
                            c.status === "active"
                              ? "Deactivate billing"
                              : "Activate billing"
                          }
                        >
                          {c.status === "active" ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Invoice download row */}
                  {invoiceSlug === c.slug && (
                    <tr key={c.slug + "-invoice"}>
                      <td colSpan={6} className="px-4 py-3 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-medium text-slate-500">
                            Month:
                          </label>
                          <input
                            type="month"
                            value={invoiceMonth}
                            onChange={(e) => setInvoiceMonth(e.target.value)}
                            className="px-2 py-1 text-sm border border-slate-300 rounded"
                          />
                          <button
                            onClick={() => downloadInvoice(c.slug)}
                            disabled={invoiceLoading}
                            className="px-3 py-1 bg-slate-900 text-white text-sm rounded hover:bg-slate-800 disabled:opacity-50"
                          >
                            {invoiceLoading
                              ? "Generating..."
                              : "Download XLSX"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Usage detail row */}
                  {usageSlug === c.slug && (
                    <tr key={c.slug + "-usage"}>
                      <td colSpan={6} className="px-4 py-4 bg-slate-50">
                        <UsageChart
                          loading={usageLoading}
                          data={usageData}
                          customer={c}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onSave={async (data) => {
            setSaving(true)
            try {
              const res = await fetch("/api/admin/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              })
              if (!res.ok) throw new Error("Failed to save")
              setShowModal(false)
              setEditingCustomer(null)
              fetchCustomers()
            } catch {
              setError("Failed to save customer")
            } finally {
              setSaving(false)
            }
          }}
          onClose={() => {
            setShowModal(false)
            setEditingCustomer(null)
          }}
          saving={saving}
        />
      )}
    </div>
  )
}

// ─── Usage chart ────────────────────────────────────────────────────

function UsageChart({
  loading,
  data,
  customer,
}: {
  loading: boolean
  data: UsageMonth[]
  customer: BillingCustomer
}) {
  if (loading) {
    return <div className="text-sm text-slate-400">Loading usage data...</div>
  }

  if (data.length === 0) {
    return <div className="text-sm text-slate-400">No usage data available</div>
  }

  const maxTotal = Math.max(
    ...data.map((d) => d.usage.search + d.usage.aspect_click + d.usage.explain),
    1
  )

  return (
    <div>
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
        Monthly Usage — {customer.display_name}
      </h3>
      <div className="flex items-end gap-2 h-28">
        {data.map((d) => {
          const total = d.usage.search + d.usage.aspect_click + d.usage.explain
          const barH = Math.max((total / maxTotal) * 80, 2)
          const searchH = total > 0 ? (d.usage.search / total) * barH : 0
          const aspectH = total > 0 ? (d.usage.aspect_click / total) * barH : 0
          const explainH = total > 0 ? (d.usage.explain / total) * barH : 0

          return (
            <div
              key={d.month}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-xs font-medium text-slate-600 tabular-nums">
                {total > 0 ? total.toLocaleString() : "—"}
              </span>
              <div className="w-full flex flex-col-reverse" style={{ height: `${barH}px` }}>
                <div
                  className="w-full bg-slate-900 rounded-b"
                  style={{ height: `${searchH}px` }}
                  title={`Search: ${d.usage.search}`}
                />
                <div
                  className="w-full bg-slate-600"
                  style={{ height: `${aspectH}px` }}
                  title={`Aspect clicks: ${d.usage.aspect_click}`}
                />
                <div
                  className="w-full bg-slate-400 rounded-t"
                  style={{ height: `${explainH}px` }}
                  title={`Explain: ${d.usage.explain}`}
                />
              </div>
              <span className="text-[10px] text-slate-400">
                {d.month.slice(5)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-slate-900 rounded-sm" /> Search
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-slate-600 rounded-sm" /> Aspect Click
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-slate-400 rounded-sm" /> Explain
        </span>
      </div>
    </div>
  )
}

// ─── Customer modal ─────────────────────────────────────────────────

function CustomerModal({
  customer,
  onSave,
  onClose,
  saving,
}: {
  customer: BillingCustomer | null
  onSave: (data: Partial<BillingCustomer>) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({
    slug: customer?.slug || "",
    company_name: customer?.company_name || "",
    display_name: customer?.display_name || "",
    primary_contact_name: customer?.primary_contact_name || "",
    primary_contact_email: customer?.primary_contact_email || "",
    billing_email: customer?.billing_email || "",
    collections: customer?.collections?.join(", ") || "",
    customer_type: customer?.customer_type || "demo",
    status: customer?.status || "prospect",
    website: customer?.website || "",
    deployment_method: customer?.deployment_method || "",
    launch_date: customer?.launch_date || "",
    billing_model: customer?.billing_model || "usage",
    price_per_search: customer?.price_per_search ?? 0.1,
    price_per_aspect_click: customer?.price_per_aspect_click ?? 0.1,
    price_per_explain: customer?.price_per_explain ?? 0.1,
    flat_monthly_fee: customer?.flat_monthly_fee ?? 0,
    notes: customer?.notes || "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      ...form,
      collections: form.collections
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      deployment_method: (form.deployment_method || undefined) as BillingCustomer["deployment_method"],
      launch_date: form.launch_date || undefined,
      website: form.website || undefined,
      price_per_search: Number(form.price_per_search),
      price_per_aspect_click: Number(form.price_per_aspect_click),
      price_per_explain: Number(form.price_per_explain),
      flat_monthly_fee: Number(form.flat_monthly_fee),
    })
  }

  const isEdit = !!customer

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {isEdit ? "Edit Customer" : "Add Customer"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Slug"
              value={form.slug}
              onChange={(v) => setForm({ ...form, slug: v })}
              placeholder="willow"
              disabled={isEdit}
            />
            <Field
              label="Company Name"
              value={form.company_name}
              onChange={(v) => setForm({ ...form, company_name: v })}
              placeholder="Willow Group Ltd"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Display Name"
              value={form.display_name}
              onChange={(v) => setForm({ ...form, display_name: v })}
              placeholder="Willow"
            />
            <Field
              label="Billing Email"
              value={form.billing_email}
              onChange={(v) => setForm({ ...form, billing_email: v })}
              placeholder="billing@willow.com"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Contact Name"
              value={form.primary_contact_name}
              onChange={(v) => setForm({ ...form, primary_contact_name: v })}
            />
            <Field
              label="Contact Email"
              value={form.primary_contact_email}
              onChange={(v) => setForm({ ...form, primary_contact_email: v })}
            />
          </div>

          {/* Collections */}
          <Field
            label="Collections (comma-separated)"
            value={form.collections}
            onChange={(v) => setForm({ ...form, collections: v })}
            placeholder="willow"
          />

          {/* Deployment */}
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Website"
              value={form.website}
              onChange={(v) => setForm({ ...form, website: v })}
              placeholder="www.example.com"
            />
            <Select
              label="Deploy Method"
              value={form.deployment_method}
              onChange={(v) => setForm({ ...form, deployment_method: v })}
              options={["", "gtm", "direct", "shopify_app", "other"]}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Launch Date
              </label>
              <input
                type="date"
                value={form.launch_date}
                onChange={(e) => setForm({ ...form, launch_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>
          </div>

          {/* Status/Type */}
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Type"
              value={form.customer_type}
              onChange={(v) => setForm({ ...form, customer_type: v as BillingCustomer["customer_type"] })}
              options={["demo", "trial", "paying"]}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as BillingCustomer["status"] })}
              options={["prospect", "active", "paused", "churned"]}
            />
            <Select
              label="Billing Model"
              value={form.billing_model}
              onChange={(v) => setForm({ ...form, billing_model: v as "usage" | "flat" })}
              options={["usage", "flat"]}
            />
          </div>

          {/* Pricing */}
          {form.billing_model === "usage" ? (
            <div className="grid grid-cols-3 gap-3">
              <NumberField
                label="$/Search"
                value={form.price_per_search}
                onChange={(v) => setForm({ ...form, price_per_search: v })}
              />
              <NumberField
                label="$/Aspect Click"
                value={form.price_per_aspect_click}
                onChange={(v) => setForm({ ...form, price_per_aspect_click: v })}
              />
              <NumberField
                label="$/Explain"
                value={form.price_per_explain}
                onChange={(v) => setForm({ ...form, price_per_explain: v })}
              />
            </div>
          ) : (
            <NumberField
              label="Flat Monthly Fee ($)"
              value={form.flat_monthly_fee}
              onChange={(v) => setForm({ ...form, flat_monthly_fee: v })}
            />
          )}

          {/* Pricing History */}
          {customer?.pricing_history && customer.pricing_history.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Rate History
              </h3>
              <div className="space-y-1.5">
                {customer.pricing_history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs text-slate-500"
                  >
                    <span>{h.effective_date}</span>
                    <span>
                      {h.billing_model === "flat"
                        ? `Flat $${h.flat_monthly_fee?.toFixed(2)}/mo`
                        : `$${h.price_per_search.toFixed(2)} / $${h.price_per_aspect_click.toFixed(2)} / $${h.price_per_explain.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.slug || !form.company_name}
              className="flex-1 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Form helpers ───────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
      />
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
