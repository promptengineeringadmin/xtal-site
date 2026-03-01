/**
 * Ingest helper — Upload a JSONL catalog to XTAL backend
 *
 * Reads a JSONL catalog file, authenticates via Cognito, uploads directly
 * via POST /api/demo/ingest, and polls until the background task completes.
 *
 * Optionally registers the collection in Redis with metadata.
 */

import * as fs from "fs"
import * as path from "path"
import { Redis } from "@upstash/redis"
import type { Vertical, CollectionSource, CollectionConfig } from "../../lib/admin/collections"

// ── Types ────────────────────────────────────────────────────

interface IngestOptions {
  slug: string
  label: string
  jsonlPath: string
  vertical?: Vertical
  source?: CollectionSource
  sourceUrl?: string
}

interface IngestResult {
  taskId: string | null
  status: "completed" | "failed" | "timeout"
  productsProcessed?: number
  error?: string
}

// ── Logging ──────────────────────────────────────────────────

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] [ingest] ${msg}`)
}

// ── Cognito auth (standalone, no Next.js imports) ────────────

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getCognitoToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && now < tokenExpiresAt - 30) {
    return cachedToken
  }

  const tokenUrl = process.env.COGNITO_URL
  const clientId = process.env.COGNITO_CLIENT_ID
  const clientSecret = process.env.COGNITO_CLIENT_SECRET
  const scope = process.env.COGNITO_SCOPE || ""

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error(
      "Missing Cognito env vars (COGNITO_URL, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET)",
    )
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  )

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(scope)}`,
    signal: AbortSignal.timeout(10_000),
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

// ── Upload JSONL to backend ──────────────────────────────────

async function uploadJsonl(
  jsonlPath: string,
  collectionName: string,
  label: string,
): Promise<string> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  if (!backendUrl) {
    throw new Error("Missing env var: XTAL_BACKEND_URL")
  }

  const MAX_RETRIES = 5
  const BACKOFF_MS = [30_000, 60_000, 120_000, 180_000, 300_000]

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const token = await getCognitoToken()

      const content = fs.readFileSync(jsonlPath, "utf-8")
      const jsonlBlob = new Blob([content], { type: "application/x-ndjson" })
      const form = new FormData()
      form.append("file", jsonlBlob, `${collectionName}.jsonl`)
      form.append("collection_name", collectionName)
      form.append("label", label)

      log(`Uploading JSONL to ${backendUrl}/api/demo/ingest (collection: ${collectionName}, attempt ${attempt + 1}/${MAX_RETRIES})...`)

      const res = await fetch(`${backendUrl}/api/demo/ingest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
        signal: AbortSignal.timeout(300_000),
      })

      if (!res.ok) {
        const text = await res.text()
        const status = res.status
        // Retry on 502/503/504 (transient backend errors)
        if ((status === 502 || status === 503 || status === 504) && attempt < MAX_RETRIES - 1) {
          const delay = BACKOFF_MS[attempt]
          log(`  Upload got ${status}, retrying in ${delay / 1000}s...`)
          await new Promise((r) => setTimeout(r, delay))
          continue
        }
        throw new Error(`Backend ingest error ${status}: ${text}`)
      }

      const data = await res.json()
      return data.task_id
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Retry on timeout or network errors
      if (attempt < MAX_RETRIES - 1 && (msg.includes("timeout") || msg.includes("ECONNREFUSED") || msg.includes("fetch failed"))) {
        const delay = BACKOFF_MS[attempt]
        log(`  Upload failed (${msg}), retrying in ${delay / 1000}s...`)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }

  throw new Error(`Upload failed after ${MAX_RETRIES} attempts`)
}

// ── Poll task status ─────────────────────────────────────────

async function pollTaskStatus(
  taskId: string,
  timeoutMs: number = 120 * 60 * 1000,
): Promise<{ status: string; productsProcessed?: number }> {
  const backendUrl = process.env.XTAL_BACKEND_URL!
  const startTime = Date.now()
  const pollInterval = 60_000 // 60 seconds (backend is slow under AI load)

  let consecutiveErrors = 0

  while (Date.now() - startTime < timeoutMs) {
    try {
      const token = await getCognitoToken()

      const res = await fetch(`${backendUrl}/api/demo/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(30_000),
      })

      if (!res.ok) {
        // 404 = backend cleaned up the task entry (likely completed)
        if (res.status === 404) {
          log(`  Task ${taskId} returned 404 — task entry cleaned up, treating as completed`)
          return { status: "completed", productsProcessed: undefined }
        }
        consecutiveErrors++
        log(`  Task poll error: HTTP ${res.status} (${consecutiveErrors} consecutive errors)`)
        if (consecutiveErrors >= 20) {
          throw new Error(`Task poll failed ${consecutiveErrors} consecutive times, giving up`)
        }
        await new Promise((r) => setTimeout(r, pollInterval))
        continue
      }

      consecutiveErrors = 0
      const data = await res.json()
      const status = data.status || data.state || "unknown"

      if (status === "completed" || status === "SUCCESS") {
        return {
          status: "completed",
          productsProcessed: data.products_processed || data.result?.products_processed,
        }
      }

      if (status === "failed" || status === "FAILURE") {
        throw new Error(`Task failed: ${data.error || data.result?.error || "unknown"}`)
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000)
      log(`  Task ${taskId}: ${status} (${elapsed}s elapsed)`)
    } catch (err) {
      // Re-throw genuine task failures
      if (err instanceof Error && err.message.startsWith("Task failed:")) throw err
      if (err instanceof Error && err.message.includes("consecutive times")) throw err

      consecutiveErrors++
      const msg = err instanceof Error ? err.message : String(err)
      log(`  Poll error (attempt will retry): ${msg} (${consecutiveErrors} consecutive)`)
      if (consecutiveErrors >= 20) {
        throw new Error(`Task poll failed ${consecutiveErrors} consecutive times: ${msg}`)
      }
    }

    await new Promise((r) => setTimeout(r, pollInterval))
  }

  throw new Error(`Task timed out after ${Math.round(timeoutMs / 60_000)} minutes`)
}

// ── Register collection in Redis ─────────────────────────────

async function registerCollection(opts: IngestOptions): Promise<void> {
  const lineCount = fs
    .readFileSync(opts.jsonlPath, "utf-8")
    .split("\n")
    .filter(Boolean).length

  const redis = new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
  })

  const KEY = "demo:collections"
  const current = (await redis.get<CollectionConfig[]>(KEY)) ?? []

  const config: CollectionConfig = {
    id: opts.slug,
    label: opts.label,
    description: `xtalsearch.com/${opts.slug}`,
    vertical: opts.vertical || "general",
    productCount: lineCount,
    source: opts.source || "shopify-import",
    sourceUrl: opts.sourceUrl,
  }

  const existing = current.findIndex((c) => c.id === opts.slug)
  if (existing >= 0) {
    current[existing] = config
  } else {
    current.push(config)
  }

  await redis.set(KEY, current)
  log(`  Registered collection: ${opts.slug} (${lineCount} products, vertical: ${config.vertical})`)
}

// ── Main export ──────────────────────────────────────────────

async function collectionAlreadyIngested(slug: string): Promise<boolean> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  if (!backendUrl) return false

  try {
    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "*", collection: slug, limit: 1 }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return false
    const data = await res.json()
    return (data.results?.length ?? 0) > 0
  } catch {
    return false
  }
}

export async function ingestToXtal(opts: IngestOptions): Promise<IngestResult> {
  log(`Ingesting ${opts.slug} from ${opts.jsonlPath}`)

  // Check if already ingested (saves BatchPipeline AI costs)
  const alreadyExists = await collectionAlreadyIngested(opts.slug)
  if (alreadyExists) {
    log(`  Collection ${opts.slug} already has data — skipping ingest`)
    await registerCollection(opts)
    return { taskId: null, status: "completed", productsProcessed: 0 }
  }

  // Validate
  if (!fs.existsSync(opts.jsonlPath)) {
    throw new Error(`JSONL file not found: ${opts.jsonlPath}`)
  }

  const lineCount = fs
    .readFileSync(opts.jsonlPath, "utf-8")
    .split("\n")
    .filter(Boolean).length
  log(`  ${lineCount} products in JSONL`)

  // Upload JSONL directly (no CSV conversion — backend handles JSONL natively)
  const taskId = await uploadJsonl(opts.jsonlPath, opts.slug, opts.label)
  log(`  Upload accepted, task ID: ${taskId}`)

  // Poll until complete
  try {
    const result = await pollTaskStatus(taskId)
    log(
      `  Ingestion complete: ${result.productsProcessed ?? "?"} products processed`,
    )

    // Verify data actually landed in Qdrant (catches silent task failures)
    log(`  Verifying data in collection...`)
    await new Promise((r) => setTimeout(r, 5_000)) // brief wait for Qdrant sync
    const verified = await collectionAlreadyIngested(opts.slug)
    if (!verified) {
      log(`  WARNING: Task reported complete but no data found in collection`)
      return { taskId, status: "failed", error: "Task completed but no data found — backend may have failed silently" }
    }

    // Register collection metadata
    await registerCollection(opts)

    return {
      taskId,
      status: "completed",
      productsProcessed: result.productsProcessed,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log(`  Ingestion failed: ${msg}`)
    return { taskId, status: "failed", error: msg }
  }
}
