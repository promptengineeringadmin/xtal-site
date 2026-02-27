/**
 * Ingest helper — Upload a JSONL catalog to XTAL backend
 *
 * Reads a JSONL catalog file, converts to CSV (the format the backend expects),
 * authenticates via Cognito, uploads via POST /api/demo/ingest, and polls
 * until the background task completes.
 *
 * Optionally registers the collection in Redis with metadata.
 */

import * as fs from "fs"
import * as path from "path"
import { Redis } from "@upstash/redis"
import type { Vertical, CollectionSource, CollectionConfig } from "../../lib/admin/collections"

// ── Types ────────────────────────────────────────────────────

interface JnlProduct {
  id: string
  title: string
  description: string
  vendor: string
  product_type: string
  tags: string[]
  price: number
  compare_at_price?: number | null
  image_url: string | null
  product_url: string
  handle: string
  available: boolean
  sku: string
}

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

// ── JSONL → CSV conversion ───────────────────────────────────

function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

function jsonlToCsv(jsonlPath: string): string {
  const lines = fs
    .readFileSync(jsonlPath, "utf-8")
    .split("\n")
    .filter(Boolean)

  const headers = [
    "Title",
    "URL handle",
    "Vendor",
    "Type",
    "Tags",
    "Body (HTML)",
    "Variant SKU",
    "Variant Price",
    "Image Src",
  ]

  const rows = [headers.join(",")]

  for (const line of lines) {
    const p: JnlProduct = JSON.parse(line)
    rows.push(
      [
        escapeCsvField(p.title),
        escapeCsvField(p.handle),
        escapeCsvField(p.vendor),
        escapeCsvField(p.product_type),
        escapeCsvField(p.tags.join(", ")),
        escapeCsvField(p.description),
        escapeCsvField(p.sku),
        String(p.price),
        escapeCsvField(p.image_url || ""),
      ].join(","),
    )
  }

  return rows.join("\n")
}

// ── Upload to backend ────────────────────────────────────────

async function uploadCsv(
  csvContent: string,
  collectionName: string,
  label: string,
): Promise<string> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  if (!backendUrl) {
    throw new Error("Missing env var: XTAL_BACKEND_URL")
  }

  const token = await getCognitoToken()

  // Create a Blob/File from CSV content
  const csvBlob = new Blob([csvContent], { type: "text/csv" })

  const form = new FormData()
  form.append("file", csvBlob, `${collectionName}.csv`)
  form.append("collection_name", collectionName)
  form.append("label", label)

  log(`Uploading to ${backendUrl}/api/demo/ingest (collection: ${collectionName})...`)

  const res = await fetch(`${backendUrl}/api/demo/ingest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
    signal: AbortSignal.timeout(60_000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Backend ingest error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.task_id
}

// ── Poll task status ─────────────────────────────────────────

async function pollTaskStatus(
  taskId: string,
  timeoutMs: number = 30 * 60 * 1000,
): Promise<{ status: string; productsProcessed?: number }> {
  const backendUrl = process.env.XTAL_BACKEND_URL!
  const startTime = Date.now()
  const pollInterval = 30_000 // 30 seconds

  while (Date.now() - startTime < timeoutMs) {
    const token = await getCognitoToken()

    const res = await fetch(`${backendUrl}/api/demo/task/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      log(`  Task poll error: HTTP ${res.status}`)
      await new Promise((r) => setTimeout(r, pollInterval))
      continue
    }

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

export async function ingestToXtal(opts: IngestOptions): Promise<IngestResult> {
  log(`Ingesting ${opts.slug} from ${opts.jsonlPath}`)

  // Validate
  if (!fs.existsSync(opts.jsonlPath)) {
    throw new Error(`JSONL file not found: ${opts.jsonlPath}`)
  }

  const lineCount = fs
    .readFileSync(opts.jsonlPath, "utf-8")
    .split("\n")
    .filter(Boolean).length
  log(`  ${lineCount} products in JSONL`)

  // Convert JSONL → CSV
  log(`  Converting JSONL to CSV...`)
  const csvContent = jsonlToCsv(opts.jsonlPath)

  // Save CSV for debugging
  const csvPath = opts.jsonlPath.replace(/\.jsonl$/, ".csv")
  fs.writeFileSync(csvPath, csvContent)
  log(`  CSV saved to ${csvPath}`)

  // Upload
  const taskId = await uploadCsv(csvContent, opts.slug, opts.label)
  log(`  Upload accepted, task ID: ${taskId}`)

  // Poll until complete
  try {
    const result = await pollTaskStatus(taskId)
    log(
      `  Ingestion complete: ${result.productsProcessed ?? "?"} products processed`,
    )

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
