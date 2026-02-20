import { Redis } from "@upstash/redis"

// ─── Redis client (lazy init) ───────────────────────────────

let redis: Redis | null = null
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
      token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
    })
  }
  return redis
}

// ─── Keys (scoped by collection) ─────────────────────────────

function queryEnhancementKey(collection: string) {
  return `admin:settings:${collection}:query_enhancement`
}
function merchRerankKey(collection: string) {
  return `admin:settings:${collection}:merch_rerank_strength`
}
function bm25WeightKey(collection: string) {
  return `admin:settings:${collection}:bm25_weight`
}
function keywordRerankKey(collection: string) {
  return `admin:settings:${collection}:keyword_rerank_strength`
}
function storeTypeKey(collection: string) {
  return `admin:settings:${collection}:store_type`
}
function aspectsEnabledKey(collection: string) {
  return `admin:settings:${collection}:aspects_enabled`
}
function resultsPerPageKey(collection: string) {
  return `admin:settings:${collection}:results_per_page`
}
function snippetEnabledKey(collection: string) {
  return `admin:settings:${collection}:snippet_enabled`
}
function snippetSiteUrlKey(collection: string) {
  return `admin:settings:${collection}:snippet_site_url`
}
function snippetSearchSelectorKey(collection: string) {
  return `admin:settings:${collection}:snippet_search_selector`
}
function snippetResultsSelectorKey(collection: string) {
  return `admin:settings:${collection}:snippet_results_selector`
}
function snippetDisplayModeKey(collection: string) {
  return `admin:settings:${collection}:snippet_display_mode`
}
function snippetStyleConfigKey(collection: string) {
  return `admin:settings:${collection}:snippet_style_config`
}

// ─── Query Enhancement ─────────────────────────────────────

export async function getQueryEnhancement(collection: string): Promise<boolean> {
  try {
    const kv = getRedis()
    const stored = await kv.get<boolean>(queryEnhancementKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return true // default: enabled
}

export async function saveQueryEnhancement(
  collection: string,
  enabled: boolean
): Promise<void> {
  const kv = getRedis()
  await kv.set(queryEnhancementKey(collection), enabled)
}

// ─── Merch Re-rank Strength ────────────────────────────────

export async function getMerchRerankStrength(collection: string): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(merchRerankKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 0.25 // default
}

export async function saveMerchRerankStrength(
  collection: string,
  strength: number
): Promise<void> {
  const kv = getRedis()
  await kv.set(merchRerankKey(collection), strength)
}

// ─── BM25 Weight ─────────────────────────────────────────

export async function getBm25Weight(collection: string): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(bm25WeightKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 1.0 // default
}

export async function saveBm25Weight(collection: string, weight: number): Promise<void> {
  const kv = getRedis()
  await kv.set(bm25WeightKey(collection), weight)
}

// ─── Keyword Re-rank Strength ────────────────────────────

export async function getKeywordRerankStrength(collection: string): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(keywordRerankKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 0.3 // default
}

export async function saveKeywordRerankStrength(
  collection: string,
  strength: number
): Promise<void> {
  const kv = getRedis()
  await kv.set(keywordRerankKey(collection), strength)
}

// ─── Store Type ─────────────────────────────────────────────

export async function getStoreType(collection: string): Promise<string> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(storeTypeKey(collection))
    if (stored) return stored
  } catch {
    // Redis unavailable
  }
  return "online retailer" // default
}

export async function saveStoreType(
  collection: string,
  storeType: string
): Promise<void> {
  const kv = getRedis()
  await kv.set(storeTypeKey(collection), storeType)
}

// ─── Aspects Enabled ──────────────────────────────────────

export async function getAspectsEnabled(collection: string): Promise<boolean> {
  try {
    const kv = getRedis()
    const stored = await kv.get<boolean>(aspectsEnabledKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return true // default: enabled
}

export async function saveAspectsEnabled(
  collection: string,
  enabled: boolean
): Promise<void> {
  const kv = getRedis()
  await kv.set(aspectsEnabledKey(collection), enabled)
}

// ─── Results Per Page ──────────────────────────────────────

export async function getResultsPerPage(collection: string): Promise<number> {
  try {
    const kv = getRedis()
    const stored = await kv.get<number>(resultsPerPageKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return 48 // default
}

export async function saveResultsPerPage(
  collection: string,
  value: number
): Promise<void> {
  const kv = getRedis()
  await kv.set(resultsPerPageKey(collection), value)
}

// ─── Snippet Settings ────────────────────────────────────

export interface SnippetSettings {
  enabled: boolean
  siteUrl: string
  searchSelector: string
  resultsSelector: string
  displayMode: string
  styleConfig: string
}

export async function getSnippetSettings(collection: string): Promise<SnippetSettings> {
  try {
    const kv = getRedis()
    const [enabled, siteUrl, searchSelector, resultsSelector, displayMode, styleConfig] = await Promise.all([
      kv.get<boolean>(snippetEnabledKey(collection)),
      kv.get<string>(snippetSiteUrlKey(collection)),
      kv.get<string>(snippetSearchSelectorKey(collection)),
      kv.get<string>(snippetResultsSelectorKey(collection)),
      kv.get<string>(snippetDisplayModeKey(collection)),
      kv.get<string>(snippetStyleConfigKey(collection)),
    ])
    return {
      enabled: enabled ?? false,
      siteUrl: siteUrl ?? "",
      searchSelector: searchSelector ?? 'input[type="search"]',
      resultsSelector: resultsSelector ?? "",
      displayMode: displayMode ?? "overlay",
      styleConfig: styleConfig ?? "{}",
    }
  } catch {
    return {
      enabled: false,
      siteUrl: "",
      searchSelector: 'input[type="search"]',
      resultsSelector: "",
      displayMode: "overlay",
      styleConfig: "{}",
    }
  }
}

export async function saveSnippetSettings(
  collection: string,
  settings: Partial<SnippetSettings>
): Promise<void> {
  const kv = getRedis()
  const ops: Promise<unknown>[] = []
  if (settings.enabled !== undefined) ops.push(kv.set(snippetEnabledKey(collection), settings.enabled))
  if (settings.siteUrl !== undefined) ops.push(kv.set(snippetSiteUrlKey(collection), settings.siteUrl))
  if (settings.searchSelector !== undefined) ops.push(kv.set(snippetSearchSelectorKey(collection), settings.searchSelector))
  if (settings.resultsSelector !== undefined) ops.push(kv.set(snippetResultsSelectorKey(collection), settings.resultsSelector))
  if (settings.displayMode !== undefined) ops.push(kv.set(snippetDisplayModeKey(collection), settings.displayMode))
  if (settings.styleConfig !== undefined) ops.push(kv.set(snippetStyleConfigKey(collection), settings.styleConfig))
  await Promise.all(ops)
}
