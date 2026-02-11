import { Redis } from "@upstash/redis"
import { nanoid } from "nanoid"
import type { GraderRunLog, GraderReport } from "./types"

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

const TTL_RUN = 90 * 24 * 60 * 60       // 90 days
const TTL_REPORT = 90 * 24 * 60 * 60    // 90 days
const TTL_URL_CACHE = 7 * 24 * 60 * 60  // 7 days
const TTL_RATE_LIMIT = 60 * 60          // 1 hour

// ─── Create a new run ───────────────────────────────────────

export async function createRun(
  storeUrl: string,
  source: "web" | "batch" | "admin" = "web"
): Promise<GraderRunLog> {
  const id = nanoid(12)
  const run: GraderRunLog = {
    id,
    storeUrl,
    storeName: "",
    platform: "custom",
    status: "running",
    startedAt: new Date().toISOString(),
    source,
    steps: {},
  }

  const kv = getRedis()
  await kv.set(`grader:run:${id}`, JSON.stringify(run), { ex: TTL_RUN })

  // Add to runs index (sorted by time, newest first)
  await kv.lpush("grader:runs:index", id)
  await kv.ltrim("grader:runs:index", 0, 999) // Keep last 1000

  return run
}

// ─── Update a run ───────────────────────────────────────────

export async function updateRun(run: GraderRunLog): Promise<void> {
  const kv = getRedis()
  await kv.set(`grader:run:${run.id}`, JSON.stringify(run), { ex: TTL_RUN })
}

// ─── Complete a run ─────────────────────────────────────────

export async function completeRun(
  run: GraderRunLog,
  report: GraderReport
): Promise<void> {
  run.status = "complete"
  run.completedAt = new Date().toISOString()
  run.report = report

  const kv = getRedis()
  await Promise.all([
    kv.set(`grader:run:${run.id}`, JSON.stringify(run), { ex: TTL_RUN }),
    kv.set(`grader:report:${report.id}`, JSON.stringify(report), { ex: TTL_REPORT }),
  ])

  // Cache by URL hash
  const urlHash = hashUrl(run.storeUrl)
  await kv.set(`grader:url:${urlHash}`, report.id, { ex: TTL_URL_CACHE })
}

// ─── Fail a run ─────────────────────────────────────────────

export async function failRun(
  run: GraderRunLog,
  error: string
): Promise<void> {
  run.status = "failed"
  run.completedAt = new Date().toISOString()

  // Add error to the last step that was being processed
  if (run.steps.evaluate) run.steps.evaluate.error = error
  else if (run.steps.search) run.steps.search.queries.push({
    query: "(pipeline error)",
    category: "null_test",
    expectedBehavior: "",
    resultCount: 0,
    topResults: [],
    responseTime: 0,
    error,
  })
  else if (run.steps.analyze && !run.steps.analyze.error) run.steps.analyze.error = error

  await updateRun(run)
}

// ─── Get a run ──────────────────────────────────────────────

export async function getRun(id: string): Promise<GraderRunLog | null> {
  const kv = getRedis()
  const data = await kv.get<string>(`grader:run:${id}`)
  if (!data) return null
  return typeof data === "string" ? JSON.parse(data) : data
}

// ─── Get a report ───────────────────────────────────────────

export async function getReport(id: string): Promise<GraderReport | null> {
  const kv = getRedis()
  const data = await kv.get<string>(`grader:report:${id}`)
  if (!data) return null
  return typeof data === "string" ? JSON.parse(data) : data
}

// ─── List runs ──────────────────────────────────────────────

export async function listRuns(
  offset = 0,
  limit = 50
): Promise<{ runs: GraderRunLog[]; total: number }> {
  const kv = getRedis()
  const ids = await kv.lrange<string>("grader:runs:index", offset, offset + limit - 1)
  const total = await kv.llen("grader:runs:index")

  const runs: GraderRunLog[] = []
  for (const id of ids) {
    const run = await getRun(id)
    if (run) runs.push(run)
  }

  return { runs, total }
}

// ─── Check URL cache ────────────────────────────────────────

export async function getCachedReportId(storeUrl: string): Promise<string | null> {
  const kv = getRedis()
  const urlHash = hashUrl(storeUrl)
  return kv.get<string>(`grader:url:${urlHash}`)
}

// ─── Rate limiting ──────────────────────────────────────────

export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean
  remaining: number
}> {
  const kv = getRedis()
  const key = `grader:ratelimit:${ip}`
  const count = await kv.incr(key)

  if (count === 1) {
    await kv.expire(key, TTL_RATE_LIMIT)
  }

  const limit = 5
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  }
}

// ─── Mark email captured ────────────────────────────────────

export async function markEmailCaptured(
  reportId: string,
  email: string
): Promise<void> {
  const kv = getRedis()

  // Update report
  const report = await getReport(reportId)
  if (report) {
    report.emailCaptured = true
    await kv.set(`grader:report:${reportId}`, JSON.stringify(report), { ex: TTL_REPORT })
  }

  // Find and update the run
  const ids = await kv.lrange<string>("grader:runs:index", 0, 100)
  for (const id of ids) {
    const run = await getRun(id)
    if (run?.report?.id === reportId) {
      run.emailCaptured = true
      run.emailAddress = email
      await updateRun(run)
      break
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────

function hashUrl(url: string): string {
  // Simple hash for URL caching
  const normalized = url.toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "")
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
