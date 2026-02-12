import { Redis } from "@upstash/redis"

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

// ─── Keys ───────────────────────────────────────────────────

const KEY_QUERY_ENHANCEMENT = "admin:settings:query_enhancement"

// ─── Query Enhancement ─────────────────────────────────────

export async function getQueryEnhancement(): Promise<boolean> {
  try {
    const kv = getRedis()
    const stored = await kv.get<boolean>(KEY_QUERY_ENHANCEMENT)
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return true // default: enabled
}

export async function saveQueryEnhancement(
  enabled: boolean
): Promise<void> {
  const kv = getRedis()
  await kv.set(KEY_QUERY_ENHANCEMENT, enabled)
}
