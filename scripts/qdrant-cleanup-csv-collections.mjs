#!/usr/bin/env node
/**
 * Cleanup script: remove stale CSV-format products from Qdrant collections
 * that were ingested from CSV (sequential IDs 1..N) but now need JSONL IDs.
 *
 * Strategy:
 * - headphones-com: delete points where payload.id is a short integer string (<= 6 chars)
 *   (CSV IDs are 1-500, JSONL IDs are 12-13 digit Shopify IDs)
 * - Other CSV collections: delete the entire Qdrant collection (backend recreates on next ingest)
 *
 * Usage:
 *   node scripts/qdrant-cleanup-csv-collections.mjs [--dry-run]
 *   node scripts/qdrant-cleanup-csv-collections.mjs --collection headphones-com [--dry-run]
 */

const QDRANT_BASE = "http://dewine-dev-alb-687752695.us-east-1.elb.amazonaws.com:6333"

const isDryRun = process.argv.includes("--dry-run")
const targetCollection = process.argv.includes("--collection")
  ? process.argv[process.argv.indexOf("--collection") + 1]
  : null

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)
}

// Collections to WIPE entirely (delete collection → backend recreates on ingest)
const WIPE_COLLECTIONS = [
  "fenty-beauty-kendo-brands",  // 500/894 — CSV IDs
  "abc-carpet-and-home",         // 500/17272 — CSV IDs
  "maiden-home",                 // 500/7328 — CSV IDs
  "arhaus",                      // 3000/8048 — CSV IDs (id=2431)
]

// headphones-com: delete only the CSV-format points (short ID strings)
async function cleanupHeadphones() {
  const col = "headphones-com"
  log(`Checking ${col} Qdrant state...`)

  const countResp = await fetch(`${QDRANT_BASE}/collections/${col}`)
  const countData = await countResp.json()
  const totalPoints = countData.result?.points_count ?? 0
  log(`  ${col}: ${totalPoints} total points`)

  if (totalPoints === 0) {
    log(`  ${col}: empty, nothing to clean`)
    return
  }

  // Scroll all points and collect point IDs for CSV-format products (short numeric strings)
  log(`  Scrolling all points to find CSV-format products...`)
  const csvPointIds = []
  let offset = null
  let batch = 0

  do {
    const body = {
      limit: 500,
      with_payload: true,
      with_vector: false,
    }
    if (offset !== null) body.offset = offset

    const scrollResp = await fetch(`${QDRANT_BASE}/collections/${col}/points/scroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const scrollData = await scrollResp.json()
    const points = scrollData.result?.points ?? []
    const nextOffset = scrollData.result?.next_page_offset ?? null
    batch++

    for (const point of points) {
      const payloadId = point.payload?.id
      // CSV IDs are short integers ("1".."500"), JSONL/Shopify IDs are 12-13 digit numbers
      if (payloadId && String(payloadId).length <= 6 && !isNaN(Number(payloadId))) {
        csvPointIds.push(point.id) // Qdrant point ID (bigint/number)
      }
    }

    log(`  Batch ${batch}: ${points.length} points, ${csvPointIds.length} CSV-format found so far`)
    offset = nextOffset
  } while (offset !== null)

  log(`  Found ${csvPointIds.length} CSV-format stale points to delete`)

  if (csvPointIds.length === 0) {
    log(`  ${col}: no stale CSV points found, skipping cleanup`)
    return
  }

  if (isDryRun) {
    log(`  [DRY RUN] Would delete ${csvPointIds.length} points from ${col}`)
    log(`  [DRY RUN] Sample IDs: ${csvPointIds.slice(0, 5).join(", ")}`)
    return
  }

  // Delete in batches of 100
  const BATCH_SIZE = 100
  let deleted = 0
  for (let i = 0; i < csvPointIds.length; i += BATCH_SIZE) {
    const batch = csvPointIds.slice(i, i + BATCH_SIZE)
    const deleteResp = await fetch(`${QDRANT_BASE}/collections/${col}/points/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: batch }),
    })
    const deleteData = await deleteResp.json()
    if (deleteData.status !== "ok" && deleteData.result?.status !== "acknowledged") {
      log(`  ERROR: Delete batch failed: ${JSON.stringify(deleteData)}`)
    } else {
      deleted += batch.length
      log(`  Deleted ${deleted}/${csvPointIds.length} CSV points`)
    }
  }

  const finalCountResp = await fetch(`${QDRANT_BASE}/collections/${col}`)
  const finalCount = (await finalCountResp.json()).result?.points_count ?? 0
  log(`  ${col} cleanup complete: ${totalPoints} → ${finalCount} points`)
}

// Wipe an entire collection (it will be recreated on next ingest)
async function wipeCollection(col) {
  log(`Wiping collection: ${col}`)

  const countResp = await fetch(`${QDRANT_BASE}/collections/${col}`)
  if (!countResp.ok) {
    log(`  ${col}: collection doesn't exist, nothing to wipe`)
    return
  }
  const countData = await countResp.json()
  const totalPoints = countData.result?.points_count ?? 0
  log(`  ${col}: has ${totalPoints} points`)

  if (isDryRun) {
    log(`  [DRY RUN] Would DELETE collection ${col} (${totalPoints} points)`)
    return
  }

  const deleteResp = await fetch(`${QDRANT_BASE}/collections/${col}`, {
    method: "DELETE",
  })
  const deleteData = await deleteResp.json()
  if (deleteData.result === true) {
    log(`  ${col}: collection deleted successfully`)
  } else {
    log(`  ${col}: delete response: ${JSON.stringify(deleteData)}`)
  }
}

async function main() {
  log(`Qdrant CSV Cleanup ${isDryRun ? "[DRY RUN] " : ""}`)
  log(`Target: ${targetCollection ?? "all CSV collections"}`)
  log("═".repeat(50))

  if (!targetCollection || targetCollection === "headphones-com") {
    await cleanupHeadphones()
  }

  const collectionsToWipe = targetCollection
    ? WIPE_COLLECTIONS.filter((c) => c === targetCollection)
    : WIPE_COLLECTIONS

  for (const col of collectionsToWipe) {
    await wipeCollection(col)
  }

  log("═".repeat(50))
  log("Done")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
