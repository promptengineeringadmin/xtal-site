#!/usr/bin/env npx tsx
import { Redis } from "@upstash/redis"

const r = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL || "").trim(),
  token: (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim(),
})

async function main() {
  // Check current pool
  const v = await r.get("explain:prompts:pool")
  if (!v) {
    console.log("KEY IS EMPTY/NULL — code defaults already in use")
  } else {
    const pool = typeof v === "string" ? JSON.parse(v) : v
    if (Array.isArray(pool)) {
      console.log(`REDIS POOL HAS ${pool.length} ENTRIES:`)
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i] as any
        console.log(`  [${i}] id=${p.id} name=${p.name} enabled=${p.enabled}`)
        console.log(`      first 120 chars: ${(p.content || "").slice(0, 120)}`)
      }
    } else {
      console.log("  RAW VALUE:", JSON.stringify(v).slice(0, 500))
    }
  }

  // Delete both keys
  console.log("\nDeleting explain:prompts:pool and explain:prompt:system...")
  await r.del("explain:prompts:pool")
  await r.del("explain:prompt:system")

  // Verify
  const after = await r.get("explain:prompts:pool")
  console.log(
    "After delete:",
    after === null ? "NULL (good — code defaults will be used)" : "STILL HAS DATA"
  )
}

main().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
