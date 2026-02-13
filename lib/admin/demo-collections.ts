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

  // Merge hardcoded suggestions onto built-in collections
  const merged: CollectionConfig[] = await Promise.all(
    COLLECTIONS.map(async (c) => {
      const suggestions = await getHardcodedSuggestions(c.id)
      return suggestions ? { ...c, suggestions } : c
    })
  )

  // Append dynamic (deduped)
  const seen = new Set(COLLECTIONS.map((c) => c.id))
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

// ─── Update a collection (dynamic or hardcoded suggestions) ─

const SUGGESTIONS_KEY_PREFIX = "demo:suggestions:"

export async function updateDemoCollection(
  id: string,
  updates: Partial<Omit<CollectionConfig, "id">>
): Promise<void> {
  const kv = getRedis()

  // For hardcoded collections, only allow updating suggestions via separate KV key
  if (HARDCODED_IDS.has(id)) {
    if (updates.suggestions) {
      await kv.set(`${SUGGESTIONS_KEY_PREFIX}${id}`, updates.suggestions)
    }
    return
  }

  const current = (await kv.get<CollectionConfig[]>(KEY)) ?? []
  const idx = current.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error(`Collection '${id}' not found`)
  current[idx] = { ...current[idx], ...updates }
  await kv.set(KEY, current)
}

// ─── Get suggestions for a hardcoded collection ─────────────

async function getHardcodedSuggestions(id: string): Promise<string[] | undefined> {
  try {
    const kv = getRedis()
    const suggestions = await kv.get<string[]>(`${SUGGESTIONS_KEY_PREFIX}${id}`)
    return suggestions ?? undefined
  } catch {
    return undefined
  }
}

// ─── Check if a collection ID is valid ─────────────────────

export async function isValidCollection(id: string): Promise<boolean> {
  if (HARDCODED_IDS.has(id)) return true
  const dynamic = await getDynamicCollections()
  return dynamic.some((c) => c.id === id)
}
