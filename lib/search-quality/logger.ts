import { Redis } from "@upstash/redis"
import { nanoid } from "nanoid"
import type { SearchQualityEntry } from "./types"

// ─── Redis client (lazy init) ───────────────────────────────

let redis: Redis | null = null
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

// ─── TTLs ───────────────────────────────────────────────────

const TTL_ENTRY = 90 * 24 * 60 * 60 // 90 days

// ─── Create feedback entry ──────────────────────────────────

export async function createFeedback(
  data: Omit<SearchQualityEntry, "id" | "timestamp" | "note">
): Promise<SearchQualityEntry> {
  const id = nanoid(12)
  const entry: SearchQualityEntry = {
    ...data,
    id,
    timestamp: new Date().toISOString(),
    note: null,
  }

  const kv = getRedis()
  await kv.set(`sq:feedback:${id}`, JSON.stringify(entry), { ex: TTL_ENTRY })
  await kv.lpush("sq:feedback:index", id)
  await kv.ltrim("sq:feedback:index", 0, 1999)

  return entry
}

// ─── Get a single entry ─────────────────────────────────────

export async function getFeedback(
  id: string
): Promise<SearchQualityEntry | null> {
  const kv = getRedis()
  const data = await kv.get<string>(`sq:feedback:${id}`)
  if (!data) return null
  return typeof data === "string" ? JSON.parse(data) : data
}

// ─── List entries (paginated) ───────────────────────────────

export async function listFeedback(
  offset = 0,
  limit = 50
): Promise<{ entries: SearchQualityEntry[]; total: number }> {
  const kv = getRedis()
  const ids = await kv.lrange<string>(
    "sq:feedback:index",
    offset,
    offset + limit - 1
  )
  const total = await kv.llen("sq:feedback:index")

  const entries: SearchQualityEntry[] = []
  for (const id of ids) {
    const entry = await getFeedback(id)
    if (entry) entries.push(entry)
  }

  return { entries, total }
}

// ─── Update note on an entry ────────────────────────────────

export async function updateNote(id: string, note: string): Promise<void> {
  const kv = getRedis()
  const entry = await getFeedback(id)
  if (!entry) throw new Error(`Feedback entry ${id} not found`)

  entry.note = note
  await kv.set(`sq:feedback:${id}`, JSON.stringify(entry), { ex: TTL_ENTRY })
}
