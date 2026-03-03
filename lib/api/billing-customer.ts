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

  // Pricing
  billing_model: "usage" | "flat"
  price_per_search: number // default 0.10
  price_per_aspect_click: number // default 0.10
  price_per_explain: number // default 0.10
  flat_monthly_fee?: number // if billing_model === "flat"

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

export async function saveCustomer(
  customer: BillingCustomer
): Promise<void> {
  const kv = getRedis()
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
