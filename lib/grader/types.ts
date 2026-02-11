// ─── Grader Types ───────────────────────────────────────────

export interface StoreInfo {
  url: string
  name: string
  platform: Platform
  storeType: string
  vertical: string
  searchUrl: string | null
  productSamples: string[]
}

export type Platform =
  | "shopify"
  | "bigcommerce"
  | "woocommerce"
  | "magento"
  | "squarespace"
  | "custom"

export interface TestQuery {
  text: string
  category: QueryCategory
  expectedBehavior: string
}

export type QueryCategory =
  | "typo"
  | "synonym"
  | "natural_language"
  | "long_tail"
  | "category"
  | "null_test"

// ─── Search Results ─────────────────────────────────────────

export interface SearchResult {
  title: string
  price?: number
  url?: string
}

export interface QueryResult {
  query: string
  category: QueryCategory
  expectedBehavior: string
  resultCount: number
  topResults: SearchResult[]
  responseTime: number
  error?: string
}

// ─── Scoring ────────────────────────────────────────────────

export type DimensionKey =
  | "typo_tolerance"
  | "synonym_handling"
  | "natural_language"
  | "long_tail"
  | "null_rate"
  | "category_intelligence"
  | "result_relevance"
  | "response_speed"

export type Grade = "A" | "B" | "C" | "D" | "F"

export interface DimensionScore {
  key: DimensionKey
  label: string
  score: number
  grade: Grade
  weight: number
  failures: string[]
  explanation: string
  testQueries: {
    query: string
    resultCount: number
    topResults: string[]
    verdict: "pass" | "partial" | "fail"
  }[]
}

export interface RevenueImpact {
  monthlyLostRevenue: number
  annualLostRevenue: number
  improvementPotential: string
}

export interface Recommendation {
  dimension: DimensionKey
  dimensionLabel: string
  problem: string
  suggestion: string
  xtalAdvantage: string
}

// ─── Report ─────────────────────────────────────────────────

export interface GraderReport {
  id: string
  storeUrl: string
  storeName: string
  platform: Platform
  storeType: string
  vertical: string
  overallScore: number
  overallGrade: Grade
  dimensions: DimensionScore[]
  revenueImpact: RevenueImpact
  recommendations: Recommendation[]
  queriesTested?: TestQuery[]
  summary: string
  createdAt: string
  emailCaptured: boolean
}

// ─── Run Log (admin) ────────────────────────────────────────

export interface GraderRunLog {
  id: string
  storeUrl: string
  storeName: string
  platform: string
  status: "running" | "complete" | "failed"
  startedAt: string
  completedAt?: string
  source: "web" | "batch" | "admin"

  steps: {
    analyze?: AnalyzeStepLog
    search?: SearchStepLog
    evaluate?: EvaluateStepLog
  }

  report?: GraderReport
  emailCaptured?: boolean
  emailAddress?: string
}

export interface AnalyzeStepLog {
  input: {
    url: string
    homepageHtmlPreview: string
    productSamples: string[]
  }
  promptUsed: string
  rawResponse: string
  parsed: {
    platform: Platform
    storeType: string
    vertical: string
    queries: TestQuery[]
  } | null
  duration: number
  error?: string
}

export interface SearchStepLog {
  queries: (QueryResult & { screenshotKey?: string })[]
  totalDuration: number
  browserLaunchTime: number
}

export interface EvaluateStepLog {
  input: {
    storeInfo: Omit<StoreInfo, "productSamples">
    queryResultsSummary: string
  }
  promptUsed: string
  rawResponse: string
  parsed: {
    dimensions: DimensionScore[]
    overallScore: number
    recommendations: Recommendation[]
  } | null
  duration: number
  error?: string
}

// ─── Prompt Management ──────────────────────────────────────

export interface PromptEntry {
  key: "analyze" | "evaluate"
  content: string
  updatedAt: string
}

export interface PromptHistoryEntry {
  key: "analyze" | "evaluate"
  content: string
  timestamp: string
}
