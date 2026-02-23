/**
 * Multi-tenant admin storage audit test suite.
 *
 * Tests that marketing prompt, brand prompt, and settings saves
 * all sync successfully to the backend for EVERY collection.
 *
 * Usage:
 *   npx tsx scripts/test-multitenant-audit.ts [base-url]
 *
 * Fetches the live collection list from /api/admin/collections,
 * then tests each one plus "default".
 */

const BASE = process.argv[2] || "https://xtalsearch.com"

interface TestResult {
  collection: string
  endpoint: string
  passed: boolean
  source?: string
  warning?: string
  error?: string
}

const results: TestResult[] = []

function qs(collection: string) {
  return `?collection=${encodeURIComponent(collection)}`
}

async function testMarketingPrompt(collection: string) {
  const endpoint = "Marketing prompt save"
  try {
    const getRes = await fetch(`${BASE}/api/admin/prompts/marketing${qs(collection)}`)
    const getCurrent = await getRes.json()
    const original = getCurrent.marketing_prompt || ""

    const putRes = await fetch(`${BASE}/api/admin/prompts/marketing${qs(collection)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketing_prompt: original }),
    })
    const data = await putRes.json()

    results.push({
      collection,
      endpoint,
      passed: data._source === "redis+backend",
      source: data._source,
      warning: data.backendWarning,
    })
  } catch (err) {
    results.push({ collection, endpoint, passed: false, error: String(err) })
  }
}

async function testBrandPrompt(collection: string) {
  const endpoint = "Brand prompt save"
  try {
    const getRes = await fetch(`${BASE}/api/admin/prompts/brand${qs(collection)}`)
    const getCurrent = await getRes.json()
    const original = getCurrent.brand_prompt || ""

    const putRes = await fetch(`${BASE}/api/admin/prompts/brand${qs(collection)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_prompt: original }),
    })
    const data = await putRes.json()

    results.push({
      collection,
      endpoint,
      passed: data._source === "redis+backend",
      source: data._source,
      warning: data.backendWarning,
    })
  } catch (err) {
    results.push({ collection, endpoint, passed: false, error: String(err) })
  }
}

async function testSettingsSave(collection: string) {
  const endpoint = "Settings save"
  try {
    const getRes = await fetch(`${BASE}/api/admin/settings${qs(collection)}`)
    const getCurrent = await getRes.json()
    const currentValue = getCurrent.merch_rerank_strength ?? 0.25

    const putRes = await fetch(`${BASE}/api/admin/settings${qs(collection)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merch_rerank_strength: currentValue }),
    })
    const data = await putRes.json()

    const passed = data._source !== "redis_fallback"

    results.push({
      collection,
      endpoint,
      passed,
      source: data._source || "(backend direct)",
      warning: data.backendWarning,
    })
  } catch (err) {
    results.push({ collection, endpoint, passed: false, error: String(err) })
  }
}

async function testSettingsLoad(collection: string) {
  const endpoint = "Settings load"
  try {
    const res = await fetch(`${BASE}/api/admin/settings${qs(collection)}`)
    const data = await res.json()

    const passed = data._source !== "redis_fallback"

    results.push({
      collection,
      endpoint,
      passed,
      source: data._source || "(backend direct)",
      warning: data.backendWarning,
    })
  } catch (err) {
    results.push({ collection, endpoint, passed: false, error: String(err) })
  }
}

async function getCollections(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/api/admin/collections`)
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    // data is an array of { value, label } objects
    return data.map((c: { value: string }) => c.value)
  } catch (err) {
    console.error(`Failed to fetch collections: ${err}`)
    console.log("Falling back to known collections\n")
    return ["default", "willow", "bestbuy"]
  }
}

async function main() {
  console.log(`\nMulti-tenant audit test suite`)
  console.log(`Base: ${BASE}`)
  console.log(`${"─".repeat(70)}\n`)

  const collections = await getCollections()
  // Ensure "default" is included
  if (!collections.includes("default")) collections.unshift("default")

  console.log(`Collections to test: ${collections.join(", ")}\n`)

  for (const collection of collections) {
    console.log(`Testing: ${collection} ...`)
    await testSettingsLoad(collection)
    await testMarketingPrompt(collection)
    await testBrandPrompt(collection)
    await testSettingsSave(collection)
  }

  // Print results grouped by collection
  console.log(`\n${"─".repeat(70)}`)
  console.log("RESULTS")
  console.log(`${"─".repeat(70)}`)

  let currentCollection = ""
  for (const r of results) {
    if (r.collection !== currentCollection) {
      currentCollection = r.collection
      console.log(`\n  ${currentCollection}`)
    }
    const icon = r.passed ? "PASS" : "FAIL"
    const srcInfo = r.source ? ` [${r.source}]` : ""
    console.log(`    [${icon}] ${r.endpoint}${srcInfo}`)
    if (r.warning) console.log(`           warning: ${r.warning}`)
    if (r.error) console.log(`           error:   ${r.error}`)
  }

  console.log(`\n${"─".repeat(70)}`)
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  const failed = results.filter((r) => !r.passed)
  console.log(`${passed}/${total} passed`)

  if (failed.length > 0) {
    console.log(`\nFailed tests:`)
    for (const f of failed) {
      console.log(`  - ${f.collection} / ${f.endpoint}: ${f.warning || f.error || f.source}`)
    }
  }

  console.log()
  if (failed.length > 0) process.exit(1)
}

main()
