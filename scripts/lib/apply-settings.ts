/**
 * Programmatic search settings writer (Redis + Backend PostgreSQL)
 *
 * Ported from scripts/apply-search-settings.mjs as an importable TS module.
 * Writes to both Redis and backend to avoid split-brain.
 */

import * as fs from "fs"
import * as path from "path"

// ── Load env ─────────────────────────────────────────────────

function loadEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../../.env.local")
  const lines = fs.readFileSync(envPath, "utf-8").replace(/\r/g, "").split("\n")
  const env: Record<string, string> = {}
  for (const line of lines) {
    const match = line.match(/^([^#=]+?)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim()
  }
  return env
}

const ENV = loadEnv()
const BACKEND_URL = ENV.XTAL_BACKEND_URL
const REDIS_URL = ENV.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = ENV.UPSTASH_REDIS_REST_TOKEN

// ── Cognito auth ─────────────────────────────────────────────

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getCognitoToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && now < tokenExpiresAt - 30) return cachedToken

  const clientId = ENV.COGNITO_CLIENT_ID
  const clientSecret = ENV.COGNITO_CLIENT_SECRET
  const tokenUrl = ENV.COGNITO_URL
  const scope = ENV.COGNITO_SCOPE || ""

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error("Missing Cognito env vars")
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(scope)}`,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Cognito auth ${resp.status}: ${text}`)
  }

  const data = await resp.json()
  cachedToken = data.access_token
  tokenExpiresAt = now + Number(data.expires_in ?? 300)
  return cachedToken!
}

async function backendFetch(urlPath: string, init: RequestInit = {}): Promise<Response> {
  const token = await getCognitoToken()
  return fetch(`${BACKEND_URL}${urlPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    },
  })
}

// ── Redis ────────────────────────────────────────────────────

async function redisSet(key: string, value: unknown): Promise<void> {
  await fetch(
    `${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`,
    { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } },
  )
}

// ── Public API ───────────────────────────────────────────────

export interface SettingsPayload {
  bm25_weight?: number
  merch_rerank_strength?: number
  keyword_rerank_strength?: number
  query_enhancement_enabled?: boolean
  store_type?: string
}

export async function applySearchSettings(
  collection: string,
  settings: SettingsPayload,
): Promise<{ success: boolean; source: string }> {
  // 1. Redis
  const redisKeys: Record<string, string> = {
    bm25_weight: `admin:settings:${collection}:bm25_weight`,
    merch_rerank_strength: `admin:settings:${collection}:merch_rerank_strength`,
    keyword_rerank_strength: `admin:settings:${collection}:keyword_rerank_strength`,
    query_enhancement_enabled: `admin:settings:${collection}:query_enhancement_enabled`,
    store_type: `admin:settings:${collection}:store_type`,
  }
  for (const [key, redisKey] of Object.entries(redisKeys)) {
    if ((settings as Record<string, unknown>)[key] !== undefined) {
      await redisSet(redisKey, (settings as Record<string, unknown>)[key])
    }
  }

  // 2. Backend PostgreSQL
  const res = await backendFetch(`/api/vendor/settings?collection=${collection}`, {
    method: "PUT",
    body: JSON.stringify(settings),
  })

  if (res.ok) {
    return { success: true, source: "redis+backend" }
  }
  return { success: false, source: "redis_only" }
}

export async function applyMarketingPrompt(
  collection: string,
  prompt: string,
): Promise<{ success: boolean; source: string }> {
  await redisSet(`prompt:marketing:${collection}`, prompt)

  let res = await backendFetch(`/api/vendor/marketing-prompt?collection=${collection}`, {
    method: "PUT",
    body: JSON.stringify({ marketing_prompt: prompt }),
  })
  if (res.status === 404) {
    res = await backendFetch(`/api/vendor/marketing-prompt?collection=${collection}`, {
      method: "POST",
      body: JSON.stringify({ marketing_prompt: prompt }),
    })
  }

  return res.ok
    ? { success: true, source: "redis+backend" }
    : { success: false, source: "redis_only" }
}

export async function applyBrandPrompt(
  collection: string,
  prompt: string,
): Promise<{ success: boolean; source: string }> {
  await redisSet(`prompt:brand:${collection}`, prompt)

  let res = await backendFetch(`/api/vendor/brand-prompt?collection=${collection}`, {
    method: "PUT",
    body: JSON.stringify({ brand_prompt: prompt }),
  })
  if (res.status === 404) {
    res = await backendFetch(`/api/vendor/brand-prompt?collection=${collection}`, {
      method: "POST",
      body: JSON.stringify({ brand_prompt: prompt }),
    })
  }

  return res.ok
    ? { success: true, source: "redis+backend" }
    : { success: false, source: "redis_only" }
}

export async function applyAspectsEnabled(
  collection: string,
  enabled: boolean,
): Promise<void> {
  await redisSet(`admin:settings:${collection}:aspects_enabled`, enabled)
}
