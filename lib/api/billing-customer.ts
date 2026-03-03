import { Redis } from "@upstash/redis"

// ─── Redis client (lazy init) ──────────────────────────────────────

let redis: Redis | null = null
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
      token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
    })
  }
  return redis
}

// ─── Constants ──────────────────────────────────────────────────────

const CUSTOMER_PREFIX = "billing:customer:"
const CUSTOMER_INDEX = "billing:customers" // SET of all customer slugs

function customerKey(slug: string): string {
  return `${CUSTOMER_PREFIX}${slug}`
}

// ─── Types ──────────────────────────────────────────────────────────

export interface PricingChange {
  effective_date: string // ISO date
  price_per_search: number
  price_per_aspect_click: number
  price_per_explain: number
  flat_monthly_fee?: number
  billing_model: "usage" | "flat"
  changed_by?: string // admin email
}

export interface BillingCustomer {
  slug: string
  company_name: string
  display_name: string
  primary_contact_name?: string
  primary_contact_email?: string
  billing_email: string

  collections: string[]

  customer_type: "demo" | "trial" | "paying"
  status: "prospect" | "active" | "paused" | "churned"
  billing_start?: string // ISO date
  billing_end?: string

  // Deployment info
  website?: string // e.g. "www.willowgroupltd.com"
  deployment_method?: "gtm" | "direct" | "shopify_app" | "other"
  launch_date?: string // ISO date — when SDK went live

  // Pricing
  billing_model: "usage" | "flat"
  price_per_search: number // default 0.10
  price_per_aspect_click: number // default 0.10
  price_per_explain: number // default 0.10
  flat_monthly_fee?: number // if billing_model === "flat"

  // Rate versioning
  pricing_history?: PricingChange[]

  notes?: string
  created_at: string
  updated_at: string
}

export const DEFAULT_PRICING = {
  price_per_search: 0.1,
  price_per_aspect_click: 0.1,
  price_per_explain: 0.1,
}

// ─── CRUD ───────────────────────────────────────────────────────────

export async function getCustomer(
  slug: string
): Promise<BillingCustomer | null> {
  try {
    const kv = getRedis()
    const data = await kv.get<BillingCustomer>(customerKey(slug))
    return data ?? null
  } catch {
    return null
  }
}

function ratesChanged(a: BillingCustomer, b: BillingCustomer): boolean {
  return (
    a.price_per_search !== b.price_per_search ||
    a.price_per_aspect_click !== b.price_per_aspect_click ||
    a.price_per_explain !== b.price_per_explain ||
    a.flat_monthly_fee !== b.flat_monthly_fee ||
    a.billing_model !== b.billing_model
  )
}

export async function saveCustomer(
  customer: BillingCustomer
): Promise<void> {
  const kv = getRedis()

  // Auto-version pricing if rates changed
  const existing = await kv.get<BillingCustomer>(customerKey(customer.slug))
  if (existing && ratesChanged(existing, customer)) {
    customer.pricing_history = [
      ...(existing.pricing_history || []),
      {
        effective_date: (existing.updated_at || existing.created_at).split("T")[0],
        price_per_search: existing.price_per_search,
        price_per_aspect_click: existing.price_per_aspect_click,
        price_per_explain: existing.price_per_explain,
        flat_monthly_fee: existing.flat_monthly_fee,
        billing_model: existing.billing_model,
      },
    ]
  }

  customer.updated_at = new Date().toISOString()
  if (!customer.created_at) {
    customer.created_at = customer.updated_at
  }
  await kv
    .pipeline()
    .set(customerKey(customer.slug), customer)
    .sadd(CUSTOMER_INDEX, customer.slug)
    .exec()
}

export async function deleteCustomer(slug: string): Promise<void> {
  const kv = getRedis()
  await kv
    .pipeline()
    .del(customerKey(slug))
    .srem(CUSTOMER_INDEX, slug)
    .exec()
}

export async function getAllCustomers(): Promise<BillingCustomer[]> {
  try {
    const kv = getRedis()
    const slugs = await kv.smembers(CUSTOMER_INDEX)
    if (!slugs.length) return []

    const pipeline = kv.pipeline()
    for (const slug of slugs) {
      pipeline.get(customerKey(slug as string))
    }
    const results = await pipeline.exec()
    return results.filter(Boolean) as BillingCustomer[]
  } catch {
    return []
  }
}

export async function getActiveCustomers(): Promise<BillingCustomer[]> {
  const all = await getAllCustomers()
  return all.filter((c) => c.status === "active")
}

// ─── Rate lookup for invoicing ───────────────────────────────────────

interface RateSnapshot {
  price_per_search: number
  price_per_aspect_click: number
  price_per_explain: number
  flat_monthly_fee?: number
  billing_model: "usage" | "flat"
}

/** Returns the rates that were effective during a given billing month (YYYY-MM). */
export function getRatesForMonth(
  customer: BillingCustomer,
  month: string
): RateSnapshot {
  const history = customer.pricing_history
  if (!history || history.length === 0) {
    return {
      price_per_search: customer.price_per_search,
      price_per_aspect_click: customer.price_per_aspect_click,
      price_per_explain: customer.price_per_explain,
      flat_monthly_fee: customer.flat_monthly_fee,
      billing_model: customer.billing_model,
    }
  }

  // Find the last pricing change whose effective_date is <= end of the billing month
  // History is ordered chronologically (oldest first)
  const monthEnd = month + "-31" // safe upper bound
  let applicable: RateSnapshot = {
    price_per_search: history[0].price_per_search,
    price_per_aspect_click: history[0].price_per_aspect_click,
    price_per_explain: history[0].price_per_explain,
    flat_monthly_fee: history[0].flat_monthly_fee,
    billing_model: history[0].billing_model,
  }

  for (const change of history) {
    if (change.effective_date <= monthEnd) {
      applicable = {
        price_per_search: change.price_per_search,
        price_per_aspect_click: change.price_per_aspect_click,
        price_per_explain: change.price_per_explain,
        flat_monthly_fee: change.flat_monthly_fee,
        billing_model: change.billing_model,
      }
    }
  }

  // If the last history entry is before the month, current rates apply
  const lastChange = history[history.length - 1]
  if (lastChange.effective_date <= monthEnd) {
    // Current rates took effect after the last history entry
    return {
      price_per_search: customer.price_per_search,
      price_per_aspect_click: customer.price_per_aspect_click,
      price_per_explain: customer.price_per_explain,
      flat_monthly_fee: customer.flat_monthly_fee,
      billing_model: customer.billing_model,
    }
  }

  return applicable
}

// ─── Activate / Deactivate ──────────────────────────────────────────

export async function activateBilling(slug: string): Promise<boolean> {
  const customer = await getCustomer(slug)
  if (!customer) return false

  customer.status = "active"
  customer.customer_type = "paying"
  customer.billing_start = customer.billing_start || new Date().toISOString().split("T")[0]
  customer.billing_end = undefined
  await saveCustomer(customer)
  return true
}

export async function deactivateBilling(
  slug: string,
  status: "paused" | "churned" = "paused"
): Promise<boolean> {
  const customer = await getCustomer(slug)
  if (!customer) return false

  customer.status = status
  customer.billing_end = new Date().toISOString().split("T")[0]
  await saveCustomer(customer)
  return true
}
