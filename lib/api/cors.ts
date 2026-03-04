import { getAllowedOrigins } from "@/lib/admin/admin-settings"

// ─── In-memory cache for allowed origins (60s TTL) ──────

interface CacheEntry {
  origins: string[]
  expiresAt: number
}

const originCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000

async function getCachedOrigins(collection: string): Promise<string[]> {
  const now = Date.now()
  const cached = originCache.get(collection)
  if (cached && cached.expiresAt > now) return cached.origins

  const origins = await getAllowedOrigins(collection)
  originCache.set(collection, { origins, expiresAt: now + CACHE_TTL_MS })
  return origins
}

// ─── CORS headers ──────────────────────────────────────

const XTAL_ORIGIN_SUFFIX = "xtalsearch.com"

function isXtalOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname
    return host === XTAL_ORIGIN_SUFFIX || host.endsWith(`.${XTAL_ORIGIN_SUFFIX}`)
  } catch {
    return false
  }
}

/**
 * Build CORS headers for a given collection + incoming Origin.
 * - If the collection has an allowlist: only allow matching or xtalsearch.com origins.
 * - If the collection has no allowlist (empty): allow all (*) for backwards compat.
 */
export async function corsHeaders(
  collection?: string,
  requestOrigin?: string | null
): Promise<HeadersInit> {
  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Access-Control-Max-Age": "3600",
  }

  if (!collection) {
    base["Access-Control-Allow-Origin"] = "*"
    return base
  }

  const allowedOrigins = await getCachedOrigins(collection)

  if (allowedOrigins.length === 0) {
    // No allowlist configured — backwards-compatible wildcard
    base["Access-Control-Allow-Origin"] = "*"
    return base
  }

  // Allowlist exists — check incoming origin
  const origin = requestOrigin || ""

  if (
    allowedOrigins.includes(origin) ||
    isXtalOrigin(origin)
  ) {
    base["Access-Control-Allow-Origin"] = origin
    base["Vary"] = "Origin"
    return base
  }

  // Origin not allowed — omit Access-Control-Allow-Origin (browser will block)
  base["Vary"] = "Origin"
  return base
}

export async function handleOptions(
  collection?: string,
  requestOrigin?: string | null
): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: await corsHeaders(collection, requestOrigin),
  })
}
