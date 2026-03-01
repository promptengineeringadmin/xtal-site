#!/usr/bin/env npx tsx
/**
 * Bulk Store Setup — Register + Ingest + Optimize all prospect stores
 *
 * For each vendor with a downloaded catalog:
 *   1. Register collection in Redis (with full metadata)
 *   2. Ingest catalog via backend BatchPipeline
 *   3. Apply vertical preset (search dials + prompts)
 *   4. Verify search works
 *
 * Usage:
 *   npx tsx scripts/bulk-store-setup.ts                       # all vendors with catalogs
 *   npx tsx scripts/bulk-store-setup.ts --vendor sixpenny     # single vendor
 *   npx tsx scripts/bulk-store-setup.ts --step register       # registration only
 *   npx tsx scripts/bulk-store-setup.ts --step ingest         # ingestion only
 *   npx tsx scripts/bulk-store-setup.ts --step optimize       # presets + suggestions only
 *   npx tsx scripts/bulk-store-setup.ts --skip-ingest         # register + optimize (no ingest)
 *   npx tsx scripts/bulk-store-setup.ts --batch 5             # 5 concurrent ingests
 *   npx tsx scripts/bulk-store-setup.ts --dry-run             # show what would be done
 */

import * as fs from "fs"
import * as path from "path"
import { Redis } from "@upstash/redis"
import { ingestToXtal } from "./lib/ingest-to-xtal"
import { categoryToVertical } from "./lib/category-mapping"
import { VERTICAL_PRESETS } from "./lib/vertical-presets"
import { applySearchSettings, applyMarketingPrompt, applyBrandPrompt, applyAspectsEnabled } from "./lib/apply-settings"
import type { CollectionConfig, Vertical } from "../lib/admin/collections"

// ── Types ────────────────────────────────────────────────────

interface ProbeResult {
  slug: string
  domain: string
  name: string
  category: string
  site: string
  productsJsonAccessible: boolean
  totalProducts: number
  hasDescriptions: boolean
  hasImages: boolean
  searchUrl: string | null
  primaryColor: string
  teardownReady: boolean
  error?: string
}

type StepName = "register" | "ingest" | "optimize" | "verify"
type VendorStatus = "pending" | "registering" | "ingesting" | "optimizing" | "verifying" | "completed" | "failed" | "skipped"

interface VendorProgress {
  status: VendorStatus
  step?: StepName
  error?: string
  productsProcessed?: number
  taskId?: string
  completedAt?: string
}

interface BulkProgress {
  started: string
  lastUpdated: string
  vendors: Record<string, VendorProgress>
}

// ── Paths ────────────────────────────────────────────────────

const DATA_DIR = path.resolve(__dirname, "../data")
const PROBE_RESULTS_PATH = path.join(DATA_DIR, "prospect-probe-results.json")
const PROGRESS_PATH = path.join(DATA_DIR, "bulk-setup-progress.json")

// ── Logging ──────────────────────────────────────────────────

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

// ── CLI args ─────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = {
    vendor: null as string | null,
    step: null as StepName | null,
    skipIngest: false,
    batch: 1,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--vendor": opts.vendor = args[++i]; break
      case "--step": opts.step = args[++i] as StepName; break
      case "--skip-ingest": opts.skipIngest = true; break
      case "--batch": opts.batch = parseInt(args[++i], 10); break
      case "--dry-run": opts.dryRun = true; break
    }
  }

  return opts
}

// ── Progress tracking ────────────────────────────────────────

function loadProgress(): BulkProgress {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf-8"))
  }
  return { started: new Date().toISOString(), lastUpdated: new Date().toISOString(), vendors: {} }
}

function saveProgress(progress: BulkProgress): void {
  progress.lastUpdated = new Date().toISOString()
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2))
}

// ── Hardcoded collection IDs to skip ─────────────────────────

const SKIP_IDS = new Set(["xtaldemo", "shopify_products", "willow", "bestbuy", "goldcanna", "dennis"])

// ── Step: Register ───────────────────────────────────────────

async function stepRegister(
  vendor: ProbeResult,
  catalogPath: string,
  vertical: Vertical,
): Promise<void> {
  const lineCount = fs.readFileSync(catalogPath, "utf-8").split("\n").filter(Boolean).length

  const redis = new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
  })

  const KEY = "demo:collections"
  const current = (await redis.get<CollectionConfig[]>(KEY)) ?? []

  const config: CollectionConfig = {
    id: vendor.slug,
    label: vendor.name,
    description: `xtalsearch.com/${vendor.slug}`,
    vertical,
    productCount: lineCount,
    source: "shopify-import",
    sourceUrl: vendor.site,
  }

  const existing = current.findIndex((c) => c.id === vendor.slug)
  if (existing >= 0) {
    current[existing] = config
    log(`  Updated existing registration: ${vendor.slug}`)
  } else {
    current.push(config)
    log(`  Registered new collection: ${vendor.slug}`)
  }

  await redis.set(KEY, current)
  log(`  ${vendor.slug}: ${lineCount} products, vertical=${vertical}`)
}

// ── Step: Ingest ─────────────────────────────────────────────

async function stepIngest(
  vendor: ProbeResult,
  catalogPath: string,
  vertical: Vertical,
): Promise<{ productsProcessed?: number; taskId?: string }> {
  const result = await ingestToXtal({
    slug: vendor.slug,
    label: vendor.name,
    jsonlPath: catalogPath,
    vertical,
    source: "shopify-import",
    sourceUrl: vendor.site,
  })

  if (result.status === "failed") {
    throw new Error(result.error || "Ingestion failed")
  }

  return {
    productsProcessed: result.productsProcessed,
    taskId: result.taskId ?? undefined,
  }
}

// ── Step: Optimize ───────────────────────────────────────────

async function stepOptimize(vendor: ProbeResult, vertical: Vertical): Promise<void> {
  const preset = VERTICAL_PRESETS[vertical]

  // Apply search dials
  log(`  Applying ${vertical} preset settings...`)
  const settingsResult = await applySearchSettings(vendor.slug, preset.settings)
  log(`  Settings: ${settingsResult.source}`)

  // Apply marketing prompt
  if (preset.marketing_prompt) {
    const mpResult = await applyMarketingPrompt(vendor.slug, preset.marketing_prompt)
    log(`  Marketing prompt: ${mpResult.source}`)
  }

  // Apply brand prompt
  if (preset.brand_prompt) {
    const bpResult = await applyBrandPrompt(vendor.slug, preset.brand_prompt)
    log(`  Brand prompt: ${bpResult.source}`)
  }

  // Enable aspects
  await applyAspectsEnabled(vendor.slug, preset.settings.aspects_enabled)
  log(`  Aspects: ${preset.settings.aspects_enabled ? "enabled" : "disabled"}`)
}

// ── Step: Verify ─────────────────────────────────────────────

async function stepVerify(vendor: ProbeResult): Promise<boolean> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  if (!backendUrl) {
    log(`  Verify skipped (no XTAL_BACKEND_URL)`)
    return true
  }

  try {
    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "test", collection: vendor.slug, limit: 1 }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = await res.json()
    const count = data.results?.length ?? 0
    log(`  Verify: ${res.status} — ${count} results returned`)
    return res.ok && count > 0
  } catch (err) {
    log(`  Verify failed: ${err instanceof Error ? err.message : String(err)}`)
    return false
  }
}

// ── Process single vendor ────────────────────────────────────

async function processVendor(
  vendor: ProbeResult,
  catalogPath: string,
  vertical: Vertical,
  progress: BulkProgress,
  opts: ReturnType<typeof parseArgs>,
): Promise<void> {
  const steps: StepName[] = opts.step
    ? [opts.step]
    : opts.skipIngest
      ? ["register", "optimize", "verify"]
      : ["register", "ingest", "optimize", "verify"]

  for (const step of steps) {
    progress.vendors[vendor.slug] = {
      ...progress.vendors[vendor.slug],
      status: step === "register" ? "registering" : step === "ingest" ? "ingesting" : step === "optimize" ? "optimizing" : "verifying",
      step,
    }
    saveProgress(progress)

    switch (step) {
      case "register":
        await stepRegister(vendor, catalogPath, vertical)
        break
      case "ingest": {
        const result = await stepIngest(vendor, catalogPath, vertical)
        progress.vendors[vendor.slug].productsProcessed = result.productsProcessed
        progress.vendors[vendor.slug].taskId = result.taskId
        break
      }
      case "optimize":
        await stepOptimize(vendor, vertical)
        break
      case "verify":
        await stepVerify(vendor)
        break
    }
  }

  progress.vendors[vendor.slug] = {
    ...progress.vendors[vendor.slug],
    status: "completed",
    completedAt: new Date().toISOString(),
  }
  saveProgress(progress)
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs()
  log("═══════════════════════════════════════════")
  log("  XTAL Bulk Store Setup")
  log("═══════════════════════════════════════════")

  // Load probe results
  if (!fs.existsSync(PROBE_RESULTS_PATH)) {
    log("ERROR: No probe results found. Run prospect-probe.ts first.")
    process.exit(1)
  }

  const probes: ProbeResult[] = JSON.parse(fs.readFileSync(PROBE_RESULTS_PATH, "utf-8"))
  const ready = probes.filter((p) => p.teardownReady)
  log(`Probe results: ${probes.length} total, ${ready.length} teardown-ready`)

  // Find catalog files
  const catalogFiles = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith("-catalog.jsonl"))
  const catalogSlugs = new Set(catalogFiles.map((f) => f.replace("-catalog.jsonl", "")))

  // Build target list
  let targets = ready.filter((p) => {
    if (SKIP_IDS.has(p.slug)) return false
    if (!catalogSlugs.has(p.slug)) return false
    return true
  })

  if (opts.vendor) {
    targets = targets.filter((p) => p.slug === opts.vendor)
    if (targets.length === 0) {
      // Try to find even if not in probe results (manual catalog)
      const manualPath = path.join(DATA_DIR, `${opts.vendor}-catalog.jsonl`)
      if (fs.existsSync(manualPath)) {
        targets = [{
          slug: opts.vendor,
          domain: "",
          name: opts.vendor,
          category: "general",
          site: "",
          productsJsonAccessible: true,
          totalProducts: 0,
          hasDescriptions: false,
          hasImages: false,
          searchUrl: null,
          primaryColor: "#1a1a1a",
          teardownReady: true,
        }]
      } else {
        log(`ERROR: Vendor "${opts.vendor}" not found in probe results or catalog files.`)
        process.exit(1)
      }
    }
  }

  log(`Targets: ${targets.length} vendors`)

  if (opts.dryRun) {
    log("\n--- DRY RUN ---")
    for (const t of targets) {
      const v = categoryToVertical(t.category)
      const catalogPath = path.join(DATA_DIR, `${t.slug}-catalog.jsonl`)
      const lineCount = fs.existsSync(catalogPath)
        ? fs.readFileSync(catalogPath, "utf-8").split("\n").filter(Boolean).length
        : 0
      log(`  ${t.slug}: ${t.name} | ${t.category} → ${v} | ${lineCount} products`)
    }
    log(`\nWould process ${targets.length} vendors.`)
    return
  }

  // Load/init progress
  const progress = loadProgress()

  // Process vendors
  let completed = 0
  let failed = 0

  for (const vendor of targets) {
    // Skip already completed (unless specific step requested)
    if (!opts.step && progress.vendors[vendor.slug]?.status === "completed") {
      log(`\n[${vendor.slug}] Already completed, skipping`)
      completed++
      continue
    }

    const vertical = categoryToVertical(vendor.category)
    const catalogPath = path.join(DATA_DIR, `${vendor.slug}-catalog.jsonl`)

    log(`\n${"═".repeat(50)}`)
    log(`[${vendor.slug}] ${vendor.name}`)
    log(`  Category: ${vendor.category} → Vertical: ${vertical}`)
    log(`  Catalog: ${catalogPath}`)

    try {
      await processVendor(vendor, catalogPath, vertical, progress, opts)
      completed++
      log(`[${vendor.slug}] COMPLETED`)
      // Cooldown between vendors to let backend recover after AI processing
      log(`  Cooling down 15s before next vendor...`)
      await new Promise((r) => setTimeout(r, 15_000))
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      log(`[${vendor.slug}] FAILED: ${msg}`)
      progress.vendors[vendor.slug] = {
        ...progress.vendors[vendor.slug],
        status: "failed",
        error: msg,
      }
      saveProgress(progress)
      // Longer cooldown after failure (backend may be overwhelmed)
      log(`  Cooling down 30s after failure...`)
      await new Promise((r) => setTimeout(r, 30_000))
    }
  }

  log(`\n${"═".repeat(50)}`)
  log(`SUMMARY: ${completed} completed, ${failed} failed, ${targets.length} total`)
  log(`Progress saved to: ${PROGRESS_PATH}`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
