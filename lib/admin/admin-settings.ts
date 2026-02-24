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
function snippetDisplayModeKey(collection: string) {
  return `admin:settings:${collection}:snippet_display_mode`
}
function snippetResultsSelectorKey(collection: string) {
  return `admin:settings:${collection}:snippet_results_selector`
}
function cardTemplateKey(collection: string) {
  return `admin:settings:${collection}:card_template`
}
function productUrlPatternKey(collection: string) {
  return `admin:settings:${collection}:product_url_pattern`
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

// ─── Snippet: Enabled ────────────────────────────────────

export async function getSnippetEnabled(collection: string): Promise<boolean> {
  try {
    const kv = getRedis()
    const stored = await kv.get<boolean>(snippetEnabledKey(collection))
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // Redis unavailable
  }
  return false // default: disabled
}

export async function saveSnippetEnabled(
  collection: string,
  enabled: boolean
): Promise<void> {
  const kv = getRedis()
  await kv.set(snippetEnabledKey(collection), enabled)
}

// ─── Snippet: Site URL ───────────────────────────────────

export async function getSnippetSiteUrl(collection: string): Promise<string> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(snippetSiteUrlKey(collection))
    if (stored) return stored
  } catch {
    // Redis unavailable
  }
  return "" // default: empty
}

export async function saveSnippetSiteUrl(
  collection: string,
  url: string
): Promise<void> {
  const kv = getRedis()
  await kv.set(snippetSiteUrlKey(collection), url)
}

// ─── Snippet: Search Selector ────────────────────────────

export async function getSnippetSearchSelector(collection: string): Promise<string> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(snippetSearchSelectorKey(collection))
    if (stored) return stored
  } catch {
    // Redis unavailable
  }
  return 'input[type="search"]' // default
}

export async function saveSnippetSearchSelector(
  collection: string,
  selector: string
): Promise<void> {
  const kv = getRedis()
  await kv.set(snippetSearchSelectorKey(collection), selector)
}

// ─── Snippet: Display Mode ──────────────────────────────

export async function getSnippetDisplayMode(collection: string): Promise<string> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(snippetDisplayModeKey(collection))
    if (stored) return stored
  } catch {
    // Redis unavailable
  }
  return "overlay" // default
}

export async function saveSnippetDisplayMode(
  collection: string,
  mode: string
): Promise<void> {
  const kv = getRedis()
  await kv.set(snippetDisplayModeKey(collection), mode)
}

// ─── Snippet: Results Selector ──────────────────────────

export async function getSnippetResultsSelector(collection: string): Promise<string> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(snippetResultsSelectorKey(collection))
    if (stored) return stored
  } catch {
    // Redis unavailable
  }
  return "" // default: empty (no inline target)
}

export async function saveSnippetResultsSelector(
  collection: string,
  selector: string
): Promise<void> {
  const kv = getRedis()
  await kv.set(snippetResultsSelectorKey(collection), selector)
}

// ─── Card Template ───────────────────────────────────────

export interface CardTemplate {
  html: string
  css: string
}

export async function getCardTemplate(
  collection: string
): Promise<CardTemplate | null> {
  try {
    const kv = getRedis()
    const stored = await kv.get<CardTemplate>(cardTemplateKey(collection))
    if (stored?.html && stored?.css) return stored
  } catch {
    // Redis unavailable
  }
  return null
}

export async function saveCardTemplate(
  collection: string,
  template: CardTemplate
): Promise<void> {
  const kv = getRedis()
  await kv.set(cardTemplateKey(collection), template)
}

// ─── Product URL Pattern ────────────────────────────────

export async function getProductUrlPattern(collection: string): Promise<string> {
  try {
    const kv = getRedis()
    const stored = await kv.get<string>(productUrlPatternKey(collection))
    if (stored) return stored
  } catch {
    // Redis unavailable
  }
  return "" // default: empty (use product_url as-is)
}

export async function saveProductUrlPattern(
  collection: string,
  pattern: string
): Promise<void> {
  const kv = getRedis()
  await kv.set(productUrlPatternKey(collection), pattern)
}
