import { describe, it, expect } from "vitest"
import type {
  StoreInfo,
  Platform,
  TestQuery,
  QueryCategory,
  SearchResult,
  QueryResult,
  DimensionKey,
  Grade,
  DimensionScore,
  RevenueImpact,
  Recommendation,
  GraderReport,
  GraderRunLog,
  AnalyzeStepLog,
  SearchStepLog,
  EvaluateStepLog,
  PromptEntry,
  PromptHistoryEntry,
} from "../../lib/grader/types"

// These tests validate that the TypeScript interfaces compile correctly
// and that objects conforming to the interfaces satisfy their contracts.
// If any interface changes in a breaking way, these tests will fail at compile time.

describe("Grader Types (compile-time validation)", () => {
  describe("Platform type", () => {
    it("accepts all valid platform values", () => {
      const platforms: Platform[] = [
        "shopify",
        "bigcommerce",
        "woocommerce",
        "magento",
        "squarespace",
        "custom",
      ]
      expect(platforms).toHaveLength(6)
    })
  })

  describe("QueryCategory type", () => {
    it("accepts all valid query categories", () => {
      const categories: QueryCategory[] = [
        "typo",
        "synonym",
        "natural_language",
        "long_tail",
        "category",
        "null_test",
      ]
      expect(categories).toHaveLength(6)
    })
  })

  describe("Grade type", () => {
    it("accepts all valid grades", () => {
      const grades: Grade[] = ["A", "B", "C", "D", "F"]
      expect(grades).toHaveLength(5)
    })
  })

  describe("DimensionKey type", () => {
    it("accepts all valid dimension keys", () => {
      const keys: DimensionKey[] = [
        "typo_tolerance",
        "synonym_handling",
        "natural_language",
        "long_tail",
        "null_rate",
        "category_intelligence",
        "result_relevance",
        "response_speed",
      ]
      expect(keys).toHaveLength(8)
    })
  })

  describe("StoreInfo interface", () => {
    it("constructs a valid StoreInfo object", () => {
      const store: StoreInfo = {
        url: "https://example.com",
        name: "Example Store",
        platform: "shopify",
        storeType: "DTC brand",
        vertical: "fashion",
        searchUrl: "/search?q=",
        productSamples: ["Product A", "Product B"],
        searchProvider: "shopify-native",
      }
      expect(store.url).toBe("https://example.com")
      expect(store.platform).toBe("shopify")
      expect(store.productSamples).toHaveLength(2)
    })

    it("allows null searchUrl", () => {
      const store: StoreInfo = {
        url: "https://example.com",
        name: "Example",
        platform: "custom",
        storeType: "marketplace",
        vertical: "electronics",
        searchUrl: null,
        productSamples: [],
        searchProvider: "unknown",
      }
      expect(store.searchUrl).toBeNull()
    })
  })

  describe("TestQuery interface", () => {
    it("constructs a valid TestQuery", () => {
      const query: TestQuery = {
        text: "blue running shoes",
        category: "long_tail",
        expectedBehavior: "Should return running shoes in blue color",
      }
      expect(query.text).toBe("blue running shoes")
      expect(query.category).toBe("long_tail")
    })
  })

  describe("SearchResult interface", () => {
    it("constructs with all optional fields", () => {
      const result: SearchResult = {
        title: "Cool Product",
        price: 29.99,
        url: "/products/cool-product",
      }
      expect(result.title).toBe("Cool Product")
      expect(result.price).toBe(29.99)
    })

    it("constructs with only required fields", () => {
      const result: SearchResult = {
        title: "Minimal Product",
      }
      expect(result.title).toBe("Minimal Product")
      expect(result.price).toBeUndefined()
      expect(result.url).toBeUndefined()
    })
  })

  describe("QueryResult interface", () => {
    it("constructs a valid QueryResult", () => {
      const result: QueryResult = {
        query: "test query",
        category: "typo",
        expectedBehavior: "Should handle typos",
        resultCount: 5,
        topResults: [{ title: "Result 1" }],
        responseTime: 250,
      }
      expect(result.resultCount).toBe(5)
      expect(result.error).toBeUndefined()
    })

    it("includes optional error field", () => {
      const result: QueryResult = {
        query: "fail query",
        category: "synonym",
        expectedBehavior: "Should fail gracefully",
        resultCount: 0,
        topResults: [],
        responseTime: 5000,
        error: "Timeout",
      }
      expect(result.error).toBe("Timeout")
    })
  })

  describe("DimensionScore interface", () => {
    it("constructs a valid DimensionScore", () => {
      const dim: DimensionScore = {
        key: "typo_tolerance",
        label: "Typo Tolerance",
        score: 75,
        grade: "C",
        weight: 0.15,
        failures: ["Failed on 'runnign shoes'"],
        explanation: "Store handles some typos but misses others",
        testQueries: [
          {
            query: "runnign shoes",
            resultCount: 0,
            topResults: [],
            verdict: "fail",
          },
          {
            query: "sneekers",
            resultCount: 3,
            topResults: ["Nike Sneaker", "Adidas Sneaker"],
            verdict: "pass",
          },
        ],
      }
      expect(dim.testQueries).toHaveLength(2)
      expect(dim.testQueries[0].verdict).toBe("fail")
      expect(dim.testQueries[1].verdict).toBe("pass")
    })

    it("supports partial verdict", () => {
      const dim: DimensionScore = {
        key: "synonym_handling",
        label: "Synonym Handling",
        score: 60,
        grade: "D",
        weight: 0.15,
        failures: [],
        explanation: "Partial synonym support",
        testQueries: [
          {
            query: "couch",
            resultCount: 2,
            topResults: ["Sofa"],
            verdict: "partial",
          },
        ],
      }
      expect(dim.testQueries[0].verdict).toBe("partial")
    })
  })

  describe("RevenueImpact interface", () => {
    it("constructs a valid RevenueImpact", () => {
      const impact: RevenueImpact = {
        monthlyLostRevenue: 1530,
        annualLostRevenue: 18360,
        improvementPotential: "15%",
      }
      expect(impact.annualLostRevenue).toBe(impact.monthlyLostRevenue * 12)
    })
  })

  describe("Recommendation interface", () => {
    it("constructs a valid Recommendation", () => {
      const rec: Recommendation = {
        dimension: "typo_tolerance",
        dimensionLabel: "Typo Tolerance",
        problem: "Search returns zero results for common misspellings",
        suggestion: "Implement fuzzy matching",
        xtalAdvantage: "XTAL handles typos automatically via neural search",
      }
      expect(rec.dimension).toBe("typo_tolerance")
    })
  })

  describe("GraderReport interface", () => {
    it("constructs a valid GraderReport", () => {
      const report: GraderReport = {
        id: "rpt_abc123",
        storeUrl: "https://example.com",
        storeName: "Example Store",
        platform: "shopify",
        storeType: "DTC brand",
        vertical: "fashion",
        overallScore: 72,
        overallGrade: "C",
        dimensions: [],
        revenueImpact: {
          monthlyLostRevenue: 510,
          annualLostRevenue: 6120,
          improvementPotential: "5%",
        },
        recommendations: [],
        summary: "Your store search needs improvement.",
        createdAt: "2026-02-11T00:00:00Z",
        emailCaptured: false,
      }
      expect(report.overallGrade).toBe("C")
      expect(report.id).toMatch(/^rpt_/)
    })
  })

  describe("GraderRunLog interface", () => {
    it("constructs a valid GraderRunLog", () => {
      const runLog: GraderRunLog = {
        id: "run_xyz",
        storeUrl: "https://example.com",
        storeName: "Example",
        platform: "shopify",
        status: "complete",
        startedAt: "2026-02-11T00:00:00Z",
        completedAt: "2026-02-11T00:01:00Z",
        source: "web",
        steps: {},
      }
      expect(runLog.status).toBe("complete")
      expect(runLog.source).toBe("web")
    })

    it("accepts all valid source values", () => {
      const sources: GraderRunLog["source"][] = ["web", "batch", "admin"]
      expect(sources).toHaveLength(3)
    })

    it("accepts all valid status values", () => {
      const statuses: GraderRunLog["status"][] = [
        "running",
        "complete",
        "failed",
      ]
      expect(statuses).toHaveLength(3)
    })

    it("allows optional steps", () => {
      const runLog: GraderRunLog = {
        id: "run_minimal",
        storeUrl: "https://example.com",
        storeName: "Example",
        platform: "shopify",
        status: "running",
        startedAt: "2026-02-11T00:00:00Z",
        source: "web",
        steps: {},
      }
      expect(runLog.completedAt).toBeUndefined()
      expect(runLog.steps.analyze).toBeUndefined()
    })
  })

  describe("AnalyzeStepLog interface", () => {
    it("constructs a valid AnalyzeStepLog", () => {
      const step: AnalyzeStepLog = {
        input: {
          url: "https://example.com",
          homepageHtmlPreview: "<html>...</html>",
          productSamples: ["Product A"],
        },
        promptUsed: "Analyze this store...",
        rawResponse: '{"platform":"shopify"}',
        parsed: {
          platform: "shopify",
          storeType: "DTC brand",
          vertical: "fashion",
          queries: [
            {
              text: "blue dress",
              category: "long_tail",
              expectedBehavior: "Return blue dresses",
            },
          ],
        },
        duration: 3500,
      }
      expect(step.parsed?.platform).toBe("shopify")
    })

    it("allows null parsed field on error", () => {
      const step: AnalyzeStepLog = {
        input: {
          url: "https://example.com",
          homepageHtmlPreview: "",
          productSamples: [],
        },
        promptUsed: "...",
        rawResponse: "",
        parsed: null,
        duration: 1000,
        error: "LLM returned invalid JSON",
      }
      expect(step.parsed).toBeNull()
      expect(step.error).toBeDefined()
    })
  })

  describe("SearchStepLog interface", () => {
    it("constructs a valid SearchStepLog", () => {
      const step: SearchStepLog = {
        queries: [
          {
            query: "test",
            category: "typo",
            expectedBehavior: "handle typo",
            resultCount: 5,
            topResults: [{ title: "Result 1" }],
            responseTime: 200,
          },
        ],
        totalDuration: 5000,
        browserLaunchTime: 1200,
      }
      expect(step.queries).toHaveLength(1)
    })
  })

  describe("EvaluateStepLog interface", () => {
    it("constructs a valid EvaluateStepLog", () => {
      const step: EvaluateStepLog = {
        input: {
          storeInfo: {
            url: "https://example.com",
            name: "Example",
            platform: "shopify",
            storeType: "DTC",
            vertical: "fashion",
            searchUrl: "/search?q=",
            searchProvider: "shopify-native",
          },
          queryResultsSummary: "5 queries tested...",
        },
        promptUsed: "Evaluate these results...",
        rawResponse: '{"dimensions":[]}',
        parsed: {
          dimensions: [],
          overallScore: 72,
          recommendations: [],
        },
        duration: 4000,
      }
      expect(step.parsed?.overallScore).toBe(72)
    })
  })

  describe("PromptEntry interface", () => {
    it("accepts analyze and evaluate keys", () => {
      const analyze: PromptEntry = {
        key: "analyze",
        content: "You are analyzing...",
        updatedAt: "2026-02-11T00:00:00Z",
      }
      const evaluate: PromptEntry = {
        key: "evaluate",
        content: "You are evaluating...",
        updatedAt: "2026-02-11T00:00:00Z",
      }
      expect(analyze.key).toBe("analyze")
      expect(evaluate.key).toBe("evaluate")
    })
  })

  describe("PromptHistoryEntry interface", () => {
    it("constructs a valid PromptHistoryEntry", () => {
      const entry: PromptHistoryEntry = {
        key: "analyze",
        content: "Previous version of prompt...",
        timestamp: "2026-02-10T12:00:00Z",
      }
      expect(entry.timestamp).toBeDefined()
    })
  })
})
