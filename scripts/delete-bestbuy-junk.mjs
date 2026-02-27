#!/usr/bin/env node
/**
 * Delete gift cards and warranties from the bestbuy Qdrant collection.
 * Uses exact match.value filters — no regex, no fuzzy matching.
 *
 * Usage:
 *   node scripts/delete-bestbuy-junk.mjs preview    # Count matches, don't delete
 *   node scripts/delete-bestbuy-junk.mjs delete     # Delete + verify
 */

const QDRANT_URL = "http://dewine-dev-alb-687752695.us-east-1.elb.amazonaws.com:6333"
const COLLECTION = "bestbuy"

const GIFT_CARD_TYPES = [
  "All Specialty Gift Cards",
  "Best Buy Gift Cards",
  "Gaming Gift Cards",
  "VR Gift Cards",
  "Retail Gift Cards",
  "Restaurant Gift Cards",
  "TV & Movie Gift Cards",
  "Travel Gift Cards",
  "Netflix Gift Cards",
  "Music Gift Cards",
  "Hulu Gift Cards",
]

const WARRANTY_TYPES = [
  "AppleCare Warranties",
  "Geek Squad TV & Home Theater Warranties",
  "Geek Squad Camera & Camcorder Warranties",
  "Geek Squad Appliance Warranties",
  "Geek Squad Computer & Tablet Warranties",
  "Geek Squad Gaming Console & Handhelds Warranties",
  "Geek Squad Car Electronics Warranties",
  "Geek Squad Cell Phone Warranties",
  "Geek Squad Portable Audio Warranties",
  "Geek Squad Wearable Technology Warranties",
]

const ALL_JUNK_TYPES = [...GIFT_CARD_TYPES, ...WARRANTY_TYPES]

function buildFilter() {
  return {
    should: ALL_JUNK_TYPES.map(t => ({
      key: "product_type",
      match: { value: t },
    })),
  }
}

async function countMatches() {
  // Scroll with filter to count matches by product_type
  const counts = {}
  let total = 0
  let offset = null

  while (true) {
    const body = {
      filter: buildFilter(),
      limit: 100,
      with_payload: { include: ["product_type", "title"] },
      with_vector: false,
    }
    if (offset) body.offset = offset

    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points/scroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Scroll failed (${res.status}): ${text}`)
    }

    const data = await res.json()
    const points = data.result.points

    for (const p of points) {
      const pt = p.payload?.product_type || "(unknown)"
      counts[pt] = (counts[pt] || 0) + 1
      total++
    }

    offset = data.result.next_page_offset
    if (!offset || points.length === 0) break
  }

  return { counts, total }
}

async function deleteMatches() {
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filter: buildFilter() }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Delete failed (${res.status}): ${text}`)
  }

  return await res.json()
}

async function main() {
  const command = process.argv[2]

  if (!command || !["preview", "delete"].includes(command)) {
    console.log("Usage: node scripts/delete-bestbuy-junk.mjs <preview|delete>")
    process.exit(1)
  }

  // Step 1: Preview
  console.log("Counting gift cards + warranties in bestbuy collection...\n")
  const { counts, total } = await countMatches()

  console.log("Product type breakdown:")
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  for (const [type, count] of sorted) {
    const category = GIFT_CARD_TYPES.includes(type) ? "GIFT CARD" : "WARRANTY"
    console.log(`  [${category}] ${type}: ${count}`)
  }
  console.log(`\nTotal to delete: ${total}`)

  if (command === "preview") {
    console.log("\nDry run — no deletions made. Run with 'delete' to proceed.")
    return
  }

  // Step 2: Delete
  console.log("\nDeleting...")
  const result = await deleteMatches()
  console.log("Delete response:", JSON.stringify(result))

  // Step 3: Verify
  console.log("\nVerifying deletion...")
  const { total: remaining } = await countMatches()
  if (remaining === 0) {
    console.log("✓ Verified: 0 gift cards/warranties remain in collection.")
  } else {
    console.error(`✗ WARNING: ${remaining} products still match the filter!`)
  }

  // Step 4: Collection info
  const infoRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`)
  if (infoRes.ok) {
    const info = await infoRes.json()
    console.log(`\nCollection size after deletion: ${info.result.points_count} products`)
  }
}

main().catch(err => {
  console.error("Fatal:", err)
  process.exit(1)
})
