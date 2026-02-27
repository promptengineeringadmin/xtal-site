export interface MerchantConfig {
  id: string
  name: string
  url: string
  searchUrl: string | null
  shopifyDomain?: string
  searchApi?: {
    type: "bestbuy-api" | "shopify" | "scrape"
    baseUrl: string
    apiKeyEnv: string
    searchParam: string
  }
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
}

export interface TeardownQuery {
  text: string
  category:
    | "natural_language"
    | "typo"
    | "synonym"
    | "long_tail"
    | "category"
    | "use_case"
    | "budget"
    | "gift"
  intent: string
}

export interface MerchantResult {
  title: string
  price?: number
  imageUrl?: string
  url?: string
  rating?: number
  reviewCount?: number
}

export interface XtalResult {
  title: string
  price: number | number[]
  imageUrl: string | null
  productUrl: string
  vendor: string
  tags: string[]
  agentReasoning?: string
}

export interface QueryComparison {
  query: string
  category: string
  intent: string
  merchant: {
    results: MerchantResult[]
    resultCount: number
    responseTime: number
    error?: string
  }
  xtal: {
    results: XtalResult[]
    resultCount: number
    responseTime: number
    searchMode?: string
    agentReasoning?: string
  }
  grade?: {
    letter: "A" | "B" | "C" | "D" | "F"
    score: number
    reason: string
  }
}

export interface TeardownReport {
  merchantId: string
  merchantName: string
  date: string
  comparisons: QueryComparison[]
  summary: {
    totalQueries: number
    merchantAvgResults: number
    xtalAvgResults: number
    merchantAvgTime: number
    xtalAvgTime: number
    overallScore?: number
    overallGrade?: string
    dimensionScores?: Record<string, { avgScore: number; grade: string; queryCount: number }>
    revenueImpact?: { monthlyLost: number; annualLost: number }
  }
}

// ─── Prospect Pipeline Types ─────────────────────────────────

export interface ProbeResult {
  slug: string
  domain: string
  name: string
  category: string
  site: string
  productsJsonAccessible: boolean
  totalProducts: number
  hasDescriptions: boolean
  hasImages: boolean
  searchUrl: string | null
  primaryColor: string
  teardownReady: boolean
  error?: string
}

export interface ProspectContact {
  vendor: string
  name: string
  title: string
  linkedin: string
  real: boolean
  good: boolean
  hook: string
  strength?: string
}
