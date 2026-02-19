/**
 * One-time script: set willow's results_per_page to 120 in Redis.
 *
 * Run with:
 *   npx tsx scripts/set-willow-results-per-page.ts
 *
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
 * (loaded from .env.local automatically by tsx).
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { Redis } from "@upstash/redis"

// Load .env.local manually (no dotenv dependency)
try {
  const envPath = resolve(process.cwd(), ".env.local")
  const envContent = readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env.local not found — rely on existing env vars
}

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN")
    process.exit(1)
  }

  const redis = new Redis({ url: url.trim(), token: token.trim() })
  const key = "admin:settings:willow:results_per_page"

  await redis.set(key, 120)
  const stored = await redis.get<number>(key)
  console.log(`Set ${key} = ${stored}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
