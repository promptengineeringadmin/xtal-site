/**
 * One-time migration: rename budtender:* Redis keys → api:*
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
 *   npx tsx scripts/migrate-usage-keys.ts
 *
 * Safe to run multiple times — skips keys that have already been renamed.
 */

import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
  token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
})

async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = []
  let cursor = 0
  do {
    const [next, batch] = await redis.scan(cursor, { match: pattern, count: 100 })
    cursor = typeof next === "string" ? parseInt(next, 10) : next
    keys.push(...(batch as string[]))
  } while (cursor !== 0)
  return keys
}

async function main() {
  // Find all budtender:usage:* and budtender:log:* keys
  const usageKeys = await scanKeys("budtender:usage:*")
  const logKeys = await scanKeys("budtender:log:*")
  const allKeys = [...usageKeys, ...logKeys]

  if (allKeys.length === 0) {
    console.log("No budtender:* keys found — nothing to migrate.")
    return
  }

  console.log(`Found ${allKeys.length} keys to migrate:`)
  for (const key of allKeys) {
    console.log(`  ${key}`)
  }

  let migrated = 0
  let skipped = 0

  for (const oldKey of allKeys) {
    const newKey = oldKey.replace(/^budtender:/, "api:")

    // Check if new key already exists (idempotent)
    const exists = await redis.exists(newKey)
    if (exists) {
      console.log(`  SKIP ${oldKey} → ${newKey} (already exists)`)
      skipped++
      continue
    }

    // RENAME is atomic
    await redis.rename(oldKey, newKey)
    console.log(`  OK   ${oldKey} → ${newKey}`)
    migrated++
  }

  console.log(`\nDone: ${migrated} migrated, ${skipped} skipped.`)
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
