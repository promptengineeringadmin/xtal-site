import { Redis } from "@upstash/redis"
import { COLLECTIONS, type CollectionConfig } from "./collections"

// ─── Redis client (lazy init) ───────────────────────────────

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

// ─── Redis key ──────────────────────────────────────────────

const KEY = "demo:collections"

// ─── Hardcoded collection IDs (immutable) ───────────────────

const HARDCODED_IDS = new Set(COLLECTIONS.map((c) => c.id))

// ─── Get all collections (hardcoded + dynamic) ─────────────

export async function getAllCollections(): Promise<CollectionConfig[]> {
  const dynamic = await getDynamicCollections()
  // Merge: hardcoded first, then dynamic (deduped)
  const seen = new Set(COLLECTIONS.map((c) => c.id))
  const merged = [...COLLECTIONS]
  for (const c of dynamic) {
    if (!seen.has(c.id)) {
      merged.push(c)
      seen.add(c.id)
    }
  }
  return merged
}

// ─── Get dynamic collections only ──────────────────────────

async function getDynamicCollections(): Promise<CollectionConfig[]> {
  try {
    const kv = getRedis()
    const stored = await kv.get<CollectionConfig[]>(KEY)
    return stored ?? []
  } catch {
    return []
  }
}

// ─── Add a dynamic collection ──────────────────────────────

export async function addDemoCollection(
  config: CollectionConfig
): Promise<void> {
  if (HARDCODED_IDS.has(config.id)) {
    throw new Error(`Collection '${config.id}' is built-in and cannot be re-added`)
  }
  const kv = getRedis()
  const current = (await kv.get<CollectionConfig[]>(KEY)) ?? []
  if (current.some((c) => c.id === config.id)) {
    throw new Error(`Collection '${config.id}' already exists`)
  }
  current.push(config)
  await kv.set(KEY, current)
}

// ─── Remove a dynamic collection ───────────────────────────

export async function removeDemoCollection(id: string): Promise<void> {
  if (HARDCODED_IDS.has(id)) {
    throw new Error(`Collection '${id}' is built-in and cannot be removed`)
  }
  const kv = getRedis()
  const current = (await kv.get<CollectionConfig[]>(KEY)) ?? []
  const filtered = current.filter((c) => c.id !== id)
  if (filtered.length === current.length) {
    throw new Error(`Collection '${id}' not found`)
  }
  await kv.set(KEY, filtered)
}

// ─── Check if a collection ID is valid ─────────────────────

export async function isValidCollection(id: string): Promise<boolean> {
  if (HARDCODED_IDS.has(id)) return true
  const dynamic = await getDynamicCollections()
  return dynamic.some((c) => c.id === id)
}
