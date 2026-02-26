#!/usr/bin/env node
/**
 * Apply search settings (dials + prompts) to the XTAL backend directly via Cognito auth.
 * Also writes to Upstash Redis for frontend fallback.
 *
 * Usage: node scripts/apply-search-settings.mjs <command> [args]
 *
 * Commands:
 *   read-settings <collection>          Read current backend settings
 *   read-prompts <collection>           Read current backend prompts
 *   apply-settings <collection> <json>  Apply dial settings
 *   apply-marketing <collection> <text> Apply marketing prompt
 *   apply-brand <collection> <text>     Apply brand prompt
 *   apply-all <collection>              Apply all recommended settings from config below
 */

import { readFileSync } from "fs"
import { resolve } from "path"

// ─── Load env from .env.local ───────────────────────────────

const envPath = resolve(import.meta.dirname, "../.env.local")
const envLines = readFileSync(envPath, "utf-8").replace(/\r/g, "").split("\n")
const env = {}
for (const line of envLines) {
  const match = line.match(/^([^#=]+?)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const BACKEND_URL = env.XTAL_BACKEND_URL
const COGNITO_URL = env.COGNITO_URL
const COGNITO_CLIENT_ID = env.COGNITO_CLIENT_ID
const COGNITO_CLIENT_SECRET = env.COGNITO_CLIENT_SECRET
const COGNITO_SCOPE = env.COGNITO_SCOPE
const REDIS_URL = env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = env.UPSTASH_REDIS_REST_TOKEN

// ─── Cognito auth ───────────────────────────────────────────

let cachedToken = null
let tokenExpiresAt = 0

async function getCognitoToken() {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && now < tokenExpiresAt - 30) return cachedToken

  const basicAuth = Buffer.from(`${COGNITO_CLIENT_ID}:${COGNITO_CLIENT_SECRET}`).toString("base64")
  const resp = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(COGNITO_SCOPE)}`,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Cognito auth failed (${resp.status}): ${text}`)
  }

  const data = await resp.json()
  cachedToken = data.access_token
  tokenExpiresAt = now + Number(data.expires_in ?? 300)
  return cachedToken
}

async function backendFetch(path, init = {}) {
  const token = await getCognitoToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...init.headers,
  }
  const url = `${BACKEND_URL}${path}`
  console.log(`  → ${init.method || "GET"} ${url}`)
  const res = await fetch(url, { ...init, headers })
  return res
}

// ─── Redis writes ───────────────────────────────────────────

async function redisSet(key, value) {
  const resp = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  })
  if (!resp.ok) {
    console.warn(`  ⚠ Redis SET ${key} failed: ${resp.status}`)
  } else {
    console.log(`  ✓ Redis SET ${key}`)
  }
}

async function redisGet(key) {
  const resp = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  })
  if (!resp.ok) return null
  const data = await resp.json()
  return data.result
}

// ─── Read operations ────────────────────────────────────────

async function readSettings(collection) {
  console.log(`\nReading backend settings for "${collection}"...`)
  const res = await backendFetch(`/api/vendor/settings?collection=${collection}`)
  if (res.ok) {
    const data = await res.json()
    console.log("Backend settings:", JSON.stringify(data, null, 2))
    return data
  } else {
    const text = await res.text()
    console.log(`Backend returned ${res.status}: ${text}`)

    // Try Redis fallback
    console.log("Trying Redis fallback...")
    const keys = ["bm25_weight", "merch_rerank_strength", "keyword_rerank_strength", "query_enhancement_enabled", "store_type"]
    const result = {}
    for (const k of keys) {
      result[k] = await redisGet(`admin:settings:${collection}:${k}`)
    }
    console.log("Redis settings:", JSON.stringify(result, null, 2))
    return result
  }
}

async function readPrompts(collection) {
  console.log(`\nReading backend prompts for "${collection}"...`)

  // Marketing prompt
  let marketingRes = await backendFetch(`/api/vendor/marketing-prompt?collection=${collection}`)
  let marketing = null
  if (marketingRes.ok) {
    const data = await marketingRes.json()
    marketing = data.marketing_prompt
    console.log("Backend marketing prompt:", marketing ? `"${marketing.substring(0, 100)}..."` : "(empty)")
  } else {
    console.log(`Marketing prompt backend ${marketingRes.status}`)
    marketing = await redisGet(`prompt:marketing:${collection}`)
    console.log("Redis marketing prompt:", marketing ? `"${String(marketing).substring(0, 100)}..."` : "(empty)")
  }

  // Brand prompt
  let brandRes = await backendFetch(`/api/vendor/brand-prompt?collection=${collection}`)
  let brand = null
  if (brandRes.ok) {
    const data = await brandRes.json()
    brand = data.brand_prompt
    console.log("Backend brand prompt:", brand ? `"${brand.substring(0, 100)}..."` : "(empty)")
  } else {
    console.log(`Brand prompt backend ${brandRes.status}`)
    brand = await redisGet(`prompt:brand:${collection}`)
    console.log("Redis brand prompt:", brand ? `"${String(brand).substring(0, 100)}..."` : "(empty)")
  }

  return { marketing, brand }
}

// ─── Write operations ───────────────────────────────────────

async function applySettings(collection, settings) {
  console.log(`\nApplying settings to "${collection}":`, JSON.stringify(settings))

  // 1. Write to Redis
  const redisKeys = {
    bm25_weight: `admin:settings:${collection}:bm25_weight`,
    merch_rerank_strength: `admin:settings:${collection}:merch_rerank_strength`,
    keyword_rerank_strength: `admin:settings:${collection}:keyword_rerank_strength`,
    query_enhancement_enabled: `admin:settings:${collection}:query_enhancement_enabled`,
    store_type: `admin:settings:${collection}:store_type`,
    results_per_page: `admin:settings:${collection}:results_per_page`,
  }
  for (const [key, redisKey] of Object.entries(redisKeys)) {
    if (settings[key] !== undefined) {
      await redisSet(redisKey, settings[key])
    }
  }

  // 2. Write to backend PostgreSQL
  const res = await backendFetch(`/api/vendor/settings?collection=${collection}`, {
    method: "PUT",
    body: JSON.stringify(settings),
  })
  if (res.ok) {
    const data = await res.json()
    console.log(`  ✓ Backend settings synced:`, JSON.stringify(data))
    return { success: true, source: "redis+backend", data }
  } else {
    const text = await res.text()
    console.warn(`  ⚠ Backend sync failed (${res.status}): ${text}`)
    return { success: false, source: "redis_only", error: text }
  }
}

async function applyMarketingPrompt(collection, prompt) {
  console.log(`\nApplying marketing prompt to "${collection}" (${prompt.length} chars)...`)

  // 1. Redis
  await redisSet(`prompt:marketing:${collection}`, prompt)

  // 2. Backend — try PUT then POST
  let res = await backendFetch(`/api/vendor/marketing-prompt?collection=${collection}`, {
    method: "PUT",
    body: JSON.stringify({ marketing_prompt: prompt }),
  })
  if (res.status === 404) {
    console.log("  PUT returned 404, trying POST...")
    res = await backendFetch(`/api/vendor/marketing-prompt?collection=${collection}`, {
      method: "POST",
      body: JSON.stringify({ marketing_prompt: prompt }),
    })
  }
  if (res.ok) {
    console.log("  ✓ Marketing prompt synced to backend")
    return { success: true, source: "redis+backend" }
  } else {
    const text = await res.text()
    console.warn(`  ⚠ Backend sync failed (${res.status}): ${text}`)
    return { success: false, source: "redis_only", error: text }
  }
}

async function applyBrandPrompt(collection, prompt) {
  console.log(`\nApplying brand prompt to "${collection}" (${prompt.length} chars)...`)

  // 1. Redis
  await redisSet(`prompt:brand:${collection}`, prompt)

  // 2. Backend — try PUT then POST
  let res = await backendFetch(`/api/vendor/brand-prompt?collection=${collection}`, {
    method: "PUT",
    body: JSON.stringify({ brand_prompt: prompt }),
  })
  if (res.status === 404) {
    console.log("  PUT returned 404, trying POST...")
    res = await backendFetch(`/api/vendor/brand-prompt?collection=${collection}`, {
      method: "POST",
      body: JSON.stringify({ brand_prompt: prompt }),
    })
  }
  if (res.ok) {
    console.log("  ✓ Brand prompt synced to backend")
    return { success: true, source: "redis+backend" }
  } else {
    const text = await res.text()
    console.warn(`  ⚠ Backend sync failed (${res.status}): ${text}`)
    return { success: false, source: "redis_only", error: text }
  }
}

// ─── Recommended configurations ─────────────────────────────

const BESTBUY_MARKETING_PROMPT = `Expand the user's intent toward specific product categories, technical specifications, and use-case scenarios.

Product descriptions already contain domain-specific terms. BM25 handles exact keyword matching.
Your job is to enrich semantic meaning so vector search finds products whose descriptions match the user's intent.

CRITICAL RULES:
1. NEVER expand toward: gift cards, e-gift cards, digital currency, warranties, protection plans,
   Geek Squad services, Best Buy memberships, store merchandise, or product accessories (cases,
   cables, mounts, stands, adapters) unless the user explicitly asks for accessories.
2. ALWAYS expand toward: the primary electronics product category, key technical specifications,
   use case scenarios, compatible product ecosystems, and performance attributes.
3. When the user describes a PROBLEM (e.g., "WiFi doesn't reach backyard"), expand toward the
   solution CATEGORY (mesh WiFi, WiFi range extenders, outdoor access points) — not lifestyle terms.
4. When the user says "gaming," expand toward gaming-specific HARDWARE: gaming consoles (PlayStation,
   Xbox, Nintendo Switch), gaming headsets (Turtle Beach, SteelSeries, HyperX), gaming keyboards
   (Razer, Corsair, SteelSeries), gaming mice, gaming monitors, gaming chairs, gaming PCs.
   Do NOT expand toward game titles, gift cards, toys, collectibles, or game merchandise.
5. When the user mentions "budget" or "under $X," preserve the price constraint signal —
   do not expand toward premium products.
6. Honor brand modifiers (Sony, Apple, Samsung, LG) — keep results brand-focused when specified.
7. When the user searches for a DEVICE CATEGORY (e.g., "tablet", "laptop", "TV"), prioritize
   the complete device/product over accessories, cases, screen protectors, cables, and add-ons.
   The primary product should dominate results; accessories should only appear if specifically requested.
8. For "gift for [person]" queries, identify the person's likely product interests and expand toward
   those HARDWARE categories. "Gift for a gamer" = gaming consoles, controllers, headsets, gaming chairs.
   "Gift for a student" = laptops, tablets, noise-cancelling headphones. NEVER expand toward gift cards.

Merchandising goals for this catalog:
- Surface flagship and best-reviewed products in the relevant category first
- For vague intent queries, bias toward mid-range products ($100–$500) as the "sweet spot"
- Prefer products with "Wireless" features over wired equivalents when intent is ambiguous
- For gift queries about people (teenager, gamer, student, mom), return actual physical electronics
  products they would use — NOT gift cards, toys, or digital products
- When the query implies a product category, surface actual products in that category before any accessories`

const BESTBUY_BRAND_PROMPT = `Best Buy is North America's largest consumer electronics retailer, carrying
products across: TVs, laptops, tablets, smartphones, headphones, speakers,
cameras, gaming hardware, smart home devices, appliances, and computer accessories.

Key catalog characteristics:
- Products span budget to premium: $10 accessories to $5,000+ professional gear
- Major brands: Apple, Samsung, Sony, LG, Microsoft, Dell, HP, ASUS, Lenovo, Bose,
  JBL, Sennheiser, Logitech, NVIDIA, AMD, NETGEAR, Ring, Philips Hue, Nest
- Categories with deep inventory: laptops (hundreds of SKUs), TVs (100+ SKUs),
  headphones (200+ SKUs), smart home (200+ SKUs)
- Many color/storage/configuration variants exist for the same base model
- Refurbished/Geek Squad certified products are legitimate search results
- Protection plans and accessories exist but should NOT dominate results

When augmenting queries, prioritize hardware products over software,
accessories, gift cards, and services.`

const XTALDEMO_MARKETING_PROMPT = `Expand the user's intent with vibes, aesthetics, use cases, and feelings.

Product descriptions already contain domain-specific terms. BM25 handles exact keyword matching.
Your job is to enrich semantic meaning so vector search finds products whose descriptions match the user's intent.

Emphasize the following merchandiser goals for this catalog:
- When the user names a specific product (e.g., "Instant Pot", "yoga mat"), prioritize complete standalone products over accessories, replacement parts, and compatibility items.
- For occasion queries (dinner party, birthday, holiday), identify the occasion's audience (adults vs. children) and match products accordingly. "Dinner party" means adult entertaining.
- For budget adjectives like "affordable" or "cheap", treat them as constraints, not product names. Focus on the product category intent.
- When results could span multiple product categories, ensure category diversity. Avoid flooding from a single sub-category (especially electronics accessories like cables, remotes, and earbuds).
- Preserve specific product-type terms in your augmentation (e.g., "sheets", "yoga mat", "hiking boots") rather than replacing them with generic attributes.`

const XTALDEMO_BRAND_PROMPT = `This is a mixed general merchandise catalog with products from Amazon across home goods, electronics, clothing, kitchen, sports, and more. When expanding search queries:
- Preserve exact product names and model numbers verbatim.
- For direct product lookups (e.g., "Instant Pot", "yoga mat"), do not substitute synonyms or related categories.
- For use-case queries, expand with specific product types (not just vibes): "home office setup" → "desk, monitor, chair, keyboard, mouse, webcam, desk lamp".
- For occasion queries, identify the context: "dinner party" is adults with fine dining products; "birthday party" context depends on "kids" being mentioned.`

// ─── CLI ────────────────────────────────────────────────────

const [,, command, collection, ...rest] = process.argv

async function main() {
  if (!command) {
    console.log("Usage: node apply-search-settings.mjs <command> <collection> [args]")
    console.log("Commands: read-settings, read-prompts, apply-settings, apply-marketing, apply-brand, apply-all")
    process.exit(1)
  }

  switch (command) {
    case "read-settings":
      await readSettings(collection)
      break

    case "read-prompts":
      await readPrompts(collection)
      break

    case "apply-settings": {
      const settings = JSON.parse(rest.join(" "))
      await applySettings(collection, settings)
      break
    }

    case "apply-marketing":
      await applyMarketingPrompt(collection, rest.join(" "))
      break

    case "apply-brand":
      await applyBrandPrompt(collection, rest.join(" "))
      break

    case "apply-all": {
      if (collection === "bestbuy") {
        await applySettings(collection, {
          bm25_weight: 2.5,
          keyword_rerank_strength: 0.6,
          merch_rerank_strength: 0.15,
          store_type: "electronics retailer",
        })
        await applyMarketingPrompt(collection, BESTBUY_MARKETING_PROMPT)
        await applyBrandPrompt(collection, BESTBUY_BRAND_PROMPT)
      } else if (collection === "xtaldemo") {
        await applySettings(collection, {
          bm25_weight: 2.0,
          keyword_rerank_strength: 0.5,
          merch_rerank_strength: 0.25,
          store_type: "online retailer",
        })
        await applyMarketingPrompt(collection, XTALDEMO_MARKETING_PROMPT)
        await applyBrandPrompt(collection, XTALDEMO_BRAND_PROMPT)
      } else {
        console.error(`No preset config for collection "${collection}". Use apply-settings/apply-marketing/apply-brand individually.`)
        process.exit(1)
      }
      console.log(`\n✅ All settings applied for "${collection}"`)
      break
    }

    default:
      console.error(`Unknown command: ${command}`)
      process.exit(1)
  }
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
