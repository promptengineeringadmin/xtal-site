import { Redis } from "@upstash/redis"
import { randomBytes } from "crypto"

// ─── Redis client (lazy init, same pattern as proxy-timing.ts) ───

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

// ─── Types ──────────────────────────────────────────────────────────

export interface ApiKeyMeta {
  [key: string]: unknown
  client: string
  collection: string
  created_at: string
  created_by: string
  revoked: boolean
}

export interface ValidateResult {
  valid: true
  client: string
  collection: string
}

export interface ValidateFailure {
  valid: false
}

// ─── Key prefix ─────────────────────────────────────────────────────

const KEY_PREFIX = "apikey:"

function redisKey(token: string): string {
  return `${KEY_PREFIX}${token}`
}

// ─── Validate ───────────────────────────────────────────────────────

/**
 * Validate an API key from the X-API-Key header.
 * Returns client/collection on success, { valid: false } otherwise.
 */
export async function validateApiKey(
  request: Request
): Promise<ValidateResult | ValidateFailure> {
  const token = request.headers.get("X-API-Key")
  if (!token) return { valid: false }

  try {
    const kv = getRedis()
    const meta = await kv.hgetall<ApiKeyMeta>(redisKey(token))
    if (!meta || !meta.client) return { valid: false }
    if (meta.revoked) return { valid: false }

    return { valid: true, client: meta.client, collection: meta.collection }
  } catch {
    return { valid: false }
  }
}

// ─── Create ─────────────────────────────────────────────────────────

/**
 * Generate a new API key, store in Redis, return the token (shown once).
 */
export async function createApiKey(
  client: string,
  collection: string,
  createdBy: string
): Promise<string> {
  const token = `xtal_${randomBytes(24).toString("hex")}`
  const kv = getRedis()

  await kv.hset(redisKey(token), {
    client,
    collection,
    created_at: new Date().toISOString(),
    created_by: createdBy,
    revoked: false,
  } satisfies ApiKeyMeta)

  return token
}

// ─── Revoke ─────────────────────────────────────────────────────────

/**
 * Revoke an API key by setting revoked: true.
 */
export async function revokeApiKey(token: string): Promise<void> {
  const kv = getRedis()
  await kv.hset(redisKey(token), { revoked: true })
}

// ─── List ───────────────────────────────────────────────────────────

export interface ApiKeyListItem {
  token_suffix: string
  token_full: string // only used server-side for revocation lookups
  client: string
  collection: string
  created_at: string
  created_by: string
  revoked: boolean
}

/**
 * List all API keys, optionally filtered by collection.
 * Returns metadata with only the last 4 chars of each token visible.
 */
export async function listApiKeys(
  collection?: string
): Promise<Omit<ApiKeyListItem, "token_full">[]> {
  const kv = getRedis()
  const results: ApiKeyListItem[] = []

  let cursor = 0
  do {
    const [nextCursor, keys] = await kv.scan(cursor, {
      match: `${KEY_PREFIX}*`,
      count: 100,
    })
    cursor = typeof nextCursor === "string" ? parseInt(nextCursor, 10) : nextCursor

    for (const key of keys) {
      const meta = await kv.hgetall<ApiKeyMeta>(key)
      if (!meta || !meta.client) continue
      if (collection && meta.collection !== collection) continue

      const rawToken = (key as string).slice(KEY_PREFIX.length)
      results.push({
        token_suffix: rawToken.slice(-4),
        token_full: rawToken,
        client: meta.client,
        collection: meta.collection,
        created_at: meta.created_at,
        created_by: meta.created_by,
        revoked: meta.revoked === true || (meta.revoked as unknown) === "true",
      })
    }
  } while (cursor !== 0)

  // Sort newest first
  results.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Strip token_full before returning
  return results.map(({ token_full: _, ...rest }) => rest)
}

/**
 * Find the full token by suffix + client (for revocation from admin UI).
 */
export async function findTokenBySuffix(
  tokenSuffix: string,
  client: string
): Promise<string | null> {
  const kv = getRedis()

  let cursor = 0
  do {
    const [nextCursor, keys] = await kv.scan(cursor, {
      match: `${KEY_PREFIX}*`,
      count: 100,
    })
    cursor = typeof nextCursor === "string" ? parseInt(nextCursor, 10) : nextCursor

    for (const key of keys) {
      const rawToken = (key as string).slice(KEY_PREFIX.length)
      if (!rawToken.endsWith(tokenSuffix)) continue

      const meta = await kv.hgetall<ApiKeyMeta>(key)
      if (meta && meta.client === client) return rawToken
    }
  } while (cursor !== 0)

  return null
}
