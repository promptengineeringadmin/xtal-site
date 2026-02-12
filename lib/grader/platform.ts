import type { Platform, StoreInfo } from "./types"

interface PlatformDetectionResult {
  platform: Platform
  name: string
  searchUrl: string | null
  productSamples: string[]
}

// ─── Platform signatures ────────────────────────────────────

const PLATFORM_SIGNALS: { platform: Platform; patterns: RegExp[] }[] = [
  {
    platform: "shopify",
    patterns: [/cdn\.shopify\.com/i, /Shopify\.theme/i, /shopify-section/i],
  },
  {
    platform: "bigcommerce",
    patterns: [/bigcommerce\.com/i, /data-stencil/i, /bc-sf-filter/i],
  },
  {
    platform: "woocommerce",
    patterns: [/woocommerce/i, /wp-content/i, /wc-block/i],
  },
  {
    platform: "magento",
    patterns: [/mage\/cookies/i, /magento/i, /Magento_Ui/i],
  },
  {
    platform: "squarespace",
    patterns: [/squarespace\.com/i, /static\.squarespace/i],
  },
]

// ─── Search URL patterns per platform ───────────────────────

const SEARCH_PATHS: Partial<Record<Platform, string>> = {
  shopify: "/search?q=",
  bigcommerce: "/search.php?search_query=",
  woocommerce: "/?s=",
  magento: "/catalogsearch/result/?q=",
  squarespace: "/search?q=",
}

// ─── Detect platform from HTML ──────────────────────────────

export function detectPlatform(html: string): Platform {
  for (const { platform, patterns } of PLATFORM_SIGNALS) {
    if (patterns.some((p) => p.test(html))) return platform
  }
  return "custom"
}

// ─── Decode common HTML entities ────────────────────────────

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
}

// ─── Extract store name ─────────────────────────────────────

export function extractStoreName(html: string, url: string): string {
  // Try OG title
  const ogMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i)
  if (ogMatch) return decodeHtmlEntities(ogMatch[1].trim())

  // Try <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    // Strip common suffixes like " – Online Store" or " | Home"
    const raw = decodeHtmlEntities(titleMatch[1].trim())
    const cleaned = raw.split(/\s*[–|—|-]\s*/)[0].trim()
    if (cleaned.length > 0 && cleaned.length < 60) return cleaned
  }

  // Fallback: hostname
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

// ─── Extract sample product titles from HTML ────────────────

export function extractProductSamples(html: string): string[] {
  const samples: string[] = []

  // JSON-LD Product data
  const jsonLdMatches = Array.from(html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  ))
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1])
      if (data["@type"] === "Product" && data.name) {
        samples.push(data.name)
      }
      if (Array.isArray(data["@graph"])) {
        for (const item of data["@graph"]) {
          if (item["@type"] === "Product" && item.name) {
            samples.push(item.name)
          }
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }

  // Fallback: common product title selectors in raw HTML
  if (samples.length < 5) {
    const titlePatterns = [
      /class="[^"]*product[_-]?title[^"]*"[^>]*>([^<]{3,80})</gi,
      /class="[^"]*product[_-]?name[^"]*"[^>]*>([^<]{3,80})</gi,
      /class="[^"]*card[_-]?title[^"]*"[^>]*>([^<]{3,80})</gi,
      // WooCommerce: <a href="/product/slug/">Product Title</a>
      /href="[^"]*\/product\/[^"]*"[^>]*>([^<]{3,80})</gi,
    ]
    for (const pattern of titlePatterns) {
      for (const match of Array.from(html.matchAll(pattern))) {
        const title = match[1].trim()
        if (title && !samples.includes(title)) {
          samples.push(title)
        }
      }
      if (samples.length >= 10) break
    }
  }

  return samples.slice(0, 15)
}

// ─── Shopify products.json fallback for age-gated stores ────

async function fetchShopifyProducts(origin: string): Promise<string[]> {
  try {
    const res = await fetch(`${origin}/products.json?limit=15`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const products = data?.products ?? []
    return products
      .map((p: Record<string, unknown>) => String(p.title ?? ""))
      .filter((t: string) => t.length > 0)
      .slice(0, 15)
  } catch {
    return []
  }
}

// ─── Full detection pipeline ────────────────────────────────

export async function detectStore(url: string): Promise<PlatformDetectionResult> {
  // Normalize URL
  let normalizedUrl = url.trim()
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = `https://${normalizedUrl}`
  }

  const res = await fetch(normalizedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch store: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const platform = detectPlatform(html)
  const name = extractStoreName(html, normalizedUrl)
  let productSamples = extractProductSamples(html)

  // Build search URL
  const origin = new URL(res.url).origin
  const searchPath = SEARCH_PATHS[platform] ?? null
  const searchUrl = searchPath ? `${origin}${searchPath}` : null

  // For Shopify stores with few product samples (e.g., age-gated sites),
  // try the /products.json API as a fallback
  if (platform === "shopify" && productSamples.length < 3) {
    const apiProducts = await fetchShopifyProducts(origin)
    if (apiProducts.length > productSamples.length) {
      productSamples = apiProducts
    }
  }

  return { platform, name, searchUrl, productSamples }
}

// ─── Build full StoreInfo (called after LLM analysis) ───────

export function buildStoreInfo(
  url: string,
  detection: PlatformDetectionResult,
  llmAnalysis: { storeType: string; vertical: string }
): StoreInfo {
  return {
    url,
    name: detection.name,
    platform: detection.platform,
    storeType: llmAnalysis.storeType,
    vertical: llmAnalysis.vertical,
    searchUrl: detection.searchUrl,
    productSamples: detection.productSamples,
  }
}
