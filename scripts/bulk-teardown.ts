#!/usr/bin/env npx tsx
/**
 * Bulk Teardown Runner — batch-generate teardown PDFs for all prospects.
 *
 * Loads prospect-probe-results.json, registers each as a Shopify merchant,
 * and runs search-teardown.ts in priority order (smallest catalog first).
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
 *
 *   npx tsx scripts/bulk-teardown.ts --dry-run          # Show queue without running
 *   npx tsx scripts/bulk-teardown.ts                    # Run all eligible
 *   npx tsx scripts/bulk-teardown.ts --vendor kosas     # Single vendor
 *   npx tsx scripts/bulk-teardown.ts --reuse-data       # Re-analyze + re-render only
 *   npx tsx scripts/bulk-teardown.ts --force             # Re-run even if completed
 *   npx tsx scripts/bulk-teardown.ts --include-truncated # Include truncated collections
 */

import * as fs from "fs"
import * as path from "path"
import { registerMerchant, buildShopifyMerchantConfig } from "./teardown/merchants"
import { runTeardown } from "./search-teardown"

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

type VendorStatus = "pending" | "running" | "completed" | "failed" | "skipped"

interface VendorProgress {
  status: VendorStatus
  error?: string
  pdfPath?: string
  overallScore?: number
  overallGrade?: string
  completedAt?: string
}

interface BulkProgress {
  started: string
  lastUpdated: string
  vendors: Record<string, VendorProgress>
}

// ── Config ───────────────────────────────────────────────────

const DATA_DIR = path.resolve(__dirname, "../data")
const PROBE_RESULTS_PATH = path.join(DATA_DIR, "prospect-probe-results.json")
const PROGRESS_PATH = path.join(DATA_DIR, "bulk-teardown-progress.json")

// Collections that already have manual tuning or aren't prospect stores
const SKIP_COLLECTIONS = new Set([
  "bestbuy", "xtaldemo", "goldcanna", "willow",
])

// Empty collections (0 Qdrant points) — can't teardown
const EMPTY_COLLECTIONS = new Set([
  "revival", "lulu-and-georgia", "micas",
])

// Truncated collections (points % 500 === 0) — skip unless --include-truncated
const TRUNCATED_COLLECTIONS = new Set([
  "maiden-home", "lola-and-the-boys", "nine-west", "headphones-com",
  "abc-carpet-and-home", "fenty-beauty-kendo-brands", "jenni-kayne",
  "westinghouse", "threadheads", "pair-eyewear", "dania-furniture",
  "260-sample-sale", "gspawn", "supermarket-italy", "heirloom-roses", "arhaus",
])

// ── Helpers ──────────────────────────────────────────────────

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

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

// ── CLI args ─────────────────────────────────────────────────

interface CliArgs {
  vendor?: string
  dryRun: boolean
  force: boolean
  reuseData: boolean
  includeTruncated: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: CliArgs = {
    dryRun: false,
    force: false,
    reuseData: false,
    includeTruncated: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--vendor": parsed.vendor = args[++i]; break
      case "--dry-run": parsed.dryRun = true; break
      case "--force": parsed.force = true; break
      case "--reuse-data": parsed.reuseData = true; break
      case "--include-truncated": parsed.includeTruncated = true; break
    }
  }

  return parsed
}

// ── Qdrant point counts (for priority ordering) ──────────────

async function getPointCounts(): Promise<Record<string, number>> {
  const qdrantUrl = process.env.QDRANT_URL
  if (!qdrantUrl) {
    log("QDRANT_URL not set — using totalProducts from probe for ordering")
    return {}
  }

  try {
    const listRes = await fetch(`${qdrantUrl}/collections`)
    if (!listRes.ok) return {}
    const { result } = await listRes.json() as { result: { collections: { name: string }[] } }

    const counts: Record<string, number> = {}
    await Promise.all(
      result.collections.map(async (c: { name: string }) => {
        const res = await fetch(`${qdrantUrl}/collections/${c.name}`)
        if (res.ok) {
          const { result: r } = await res.json() as { result: { points_count?: number; vectors_count?: number } }
          counts[c.name] = r.points_count ?? r.vectors_count ?? 0
        }
      }),
    )
    return counts
  } catch {
    return {}
  }
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const args = parseArgs()

  // Validate env
  if (!args.dryRun) {
    for (const key of ["XTAL_BACKEND_URL", "ANTHROPIC_API_KEY"]) {
      if (!process.env[key]) {
        console.error(`Missing env var: ${key}`)
        process.exit(1)
      }
    }
  }

  // Load probe results
  if (!fs.existsSync(PROBE_RESULTS_PATH)) {
    console.error(`Probe results not found: ${PROBE_RESULTS_PATH}`)
    process.exit(1)
  }
  const probes: ProbeResult[] = JSON.parse(fs.readFileSync(PROBE_RESULTS_PATH, "utf-8"))
  log(`Loaded ${probes.length} probe results`)

  // Get Qdrant point counts for ordering
  const pointCounts = await getPointCounts()

  // Filter eligible vendors
  let eligible = probes.filter((p) => {
    if (SKIP_COLLECTIONS.has(p.slug)) return false
    if (EMPTY_COLLECTIONS.has(p.slug)) return false
    if (!args.includeTruncated && TRUNCATED_COLLECTIONS.has(p.slug)) return false
    if (!p.teardownReady) return false
    return true
  })

  // Single vendor mode
  if (args.vendor) {
    eligible = eligible.filter((p) => p.slug === args.vendor)
    if (eligible.length === 0) {
      console.error(`Vendor "${args.vendor}" not found or not eligible`)
      process.exit(1)
    }
  }

  // Sort by point count ascending (smallest catalogs first — faster teardowns)
  eligible.sort((a, b) => {
    const pa = pointCounts[a.slug] ?? a.totalProducts
    const pb = pointCounts[b.slug] ?? b.totalProducts
    return pa - pb
  })

  // Load progress
  const progress = loadProgress()

  // Filter already-completed (unless --force)
  if (!args.force) {
    eligible = eligible.filter((p) => {
      const vp = progress.vendors[p.slug]
      return !vp || vp.status !== "completed"
    })
  }

  log(`${eligible.length} vendors queued for teardown`)

  if (args.dryRun) {
    console.log("")
    console.log("DRY RUN — would process in this order:")
    console.log("─".repeat(70))
    for (let i = 0; i < eligible.length; i++) {
      const p = eligible[i]
      const pts = pointCounts[p.slug] ?? p.totalProducts
      const status = progress.vendors[p.slug]?.status ?? "new"
      console.log(`  ${String(i + 1).padStart(3)}. ${p.slug.padEnd(35)} ${String(pts).padStart(6)} pts  [${status}]`)
    }
    console.log("─".repeat(70))
    console.log(`Total: ${eligible.length} teardowns`)
    return
  }

  // Run teardowns
  let completed = 0
  let failed = 0

  for (let i = 0; i < eligible.length; i++) {
    const probe = eligible[i]
    const pts = pointCounts[probe.slug] ?? probe.totalProducts
    log("")
    log(`═══ [${i + 1}/${eligible.length}] ${probe.name} (${pts} pts) ═══`)

    // Register merchant
    registerMerchant(
      buildShopifyMerchantConfig({
        slug: probe.slug,
        name: probe.name,
        domain: probe.domain,
        primaryColor: probe.primaryColor !== "#FFFFFF" ? probe.primaryColor : undefined,
      }),
    )

    // Update progress
    progress.vendors[probe.slug] = { status: "running" }
    saveProgress(progress)

    try {
      const report = await runTeardown(probe.slug, {
        reuseData: args.reuseData,
        collection: probe.slug,
      })

      progress.vendors[probe.slug] = {
        status: "completed",
        overallScore: report.summary.overallScore,
        overallGrade: report.summary.overallGrade,
        completedAt: new Date().toISOString(),
      }
      saveProgress(progress)
      completed++
      log(`  Completed: ${report.summary.overallGrade} (${report.summary.overallScore}/100)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      progress.vendors[probe.slug] = {
        status: "failed",
        error: msg,
      }
      saveProgress(progress)
      failed++
      log(`  FAILED: ${msg}`)
    }
  }

  // Final summary
  log("")
  log("═══════════════════════════════════════════")
  log(`  Bulk teardown complete`)
  log(`  Completed: ${completed}`)
  log(`  Failed: ${failed}`)
  log(`  Skipped: ${eligible.length - completed - failed}`)
  log(`  Progress: ${PROGRESS_PATH}`)
  log("═══════════════════════════════════════════")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
