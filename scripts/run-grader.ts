/**
 * Standalone grader test script.
 * Runs the full grading pipeline on a store URL without needing Redis.
 * Output is saved to grader-output/ directory.
 *
 * Usage: npx tsx scripts/run-grader.ts <store-url>
 */

import { detectStore } from "../lib/grader/platform"
import { analyzeStore, evaluateResults } from "../lib/grader/llm"
import { runAllQueries } from "../lib/grader/search"
import {
  computeOverallScore,
  scoreToGrade,
  estimateRevenueImpact,
} from "../lib/grader/scoring"
import * as fs from "fs"
import * as path from "path"

async function main() {
  const url = process.argv[2]
  if (!url) {
    console.error("Usage: npx tsx scripts/run-grader.ts <store-url>")
    process.exit(1)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY not set. Add it to .env.local")
    process.exit(1)
  }

  const outputDir = path.join(process.cwd(), "grader-output")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const slug = url
    .replace(/https?:\/\//, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+$/, "")
  const storeDir = path.join(outputDir, slug)
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true })
  }

  const startTime = Date.now()

  try {
    // ── Step 1: Detect Platform ─────────────────────────────
    console.log(`\n[1/4] Detecting platform for ${url}...`)
    const detection = await detectStore(url)
    console.log(`  Platform: ${detection.platform}`)
    console.log(`  Store: ${detection.name}`)
    console.log(`  Search URL: ${detection.searchUrl || "(not found)"}`)
    console.log(`  Search Provider: ${detection.searchProvider}`)
    console.log(`  Product samples: ${detection.productSamples.length}`)

    fs.writeFileSync(
      path.join(storeDir, "01-detection.json"),
      JSON.stringify(detection, null, 2)
    )

    // ── Step 2: LLM Analysis ────────────────────────────────
    console.log(`\n[2/4] Analyzing store with Claude...`)
    const analysis = await analyzeStore({
      storeUrl: url,
      platform: detection.platform,
      storeName: detection.name,
      productSamples: detection.productSamples,
    })
    console.log(`  Store type: ${analysis.storeType}`)
    console.log(`  Vertical: ${analysis.vertical}`)
    console.log(`  Generated ${analysis.queries.length} test queries:`)
    analysis.queries.forEach((q, i) =>
      console.log(`    ${i + 1}. [${q.category}] "${q.text}"`)
    )

    fs.writeFileSync(
      path.join(storeDir, "02-analysis.json"),
      JSON.stringify(
        {
          storeType: analysis.storeType,
          vertical: analysis.vertical,
          queries: analysis.queries,
        },
        null,
        2
      )
    )
    fs.writeFileSync(
      path.join(storeDir, "02-analysis-prompt.txt"),
      analysis.promptUsed
    )
    fs.writeFileSync(
      path.join(storeDir, "02-analysis-raw-response.txt"),
      analysis.rawResponse
    )

    // ── Step 3: Search Execution ────────────────────────────
    console.log(`\n[3/4] Running ${analysis.queries.length} search queries...`)
    const queryResults = await runAllQueries(
      url,
      detection.platform,
      detection.searchUrl,
      analysis.queries,
      (progress) => {
        const status =
          progress.status === "running" ? "..." : progress.status === "complete" ? "OK" : "ERR"
        console.log(
          `  [${progress.queryIndex + 1}/${progress.totalQueries}] "${progress.query}" ${status}${
            progress.result ? ` (${progress.result.resultCount} results, ${progress.result.responseTime}ms)` : ""
          }`
        )
      }
    )

    fs.writeFileSync(
      path.join(storeDir, "03-search-results.json"),
      JSON.stringify(queryResults, null, 2)
    )

    // ── Step 4: LLM Evaluation ──────────────────────────────
    console.log(`\n[4/4] Evaluating results with Claude...`)
    const evaluation = await evaluateResults({
      storeUrl: url,
      storeName: detection.name,
      storeType: analysis.storeType,
      vertical: analysis.vertical,
      platform: detection.platform,
      queryResults,
    })

    // Compute final scores
    const overallScore = computeOverallScore(evaluation.dimensions)
    const overallGrade = scoreToGrade(overallScore)
    const revenueImpact = estimateRevenueImpact(overallScore)

    const report = {
      storeUrl: url,
      storeName: detection.name,
      platform: detection.platform,
      storeType: analysis.storeType,
      vertical: analysis.vertical,
      overallScore,
      overallGrade,
      dimensions: evaluation.dimensions,
      revenueImpact,
      recommendations: evaluation.recommendations,
      queriesTested: analysis.queries,
      summary: evaluation.summary,
      createdAt: new Date().toISOString(),
    }

    fs.writeFileSync(
      path.join(storeDir, "04-evaluation.json"),
      JSON.stringify(
        {
          dimensions: evaluation.dimensions,
          overallScore,
          overallGrade,
          summary: evaluation.summary,
          recommendations: evaluation.recommendations,
          revenueImpact,
        },
        null,
        2
      )
    )
    fs.writeFileSync(
      path.join(storeDir, "04-evaluation-prompt.txt"),
      evaluation.promptUsed
    )
    fs.writeFileSync(
      path.join(storeDir, "04-evaluation-raw-response.txt"),
      evaluation.rawResponse
    )

    // Write final report
    fs.writeFileSync(
      path.join(storeDir, "report.json"),
      JSON.stringify(report, null, 2)
    )

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    // ── Summary ─────────────────────────────────────────────
    console.log(`\n${"═".repeat(60)}`)
    console.log(`  SEARCH HEALTH REPORT: ${detection.name}`)
    console.log(`${"═".repeat(60)}`)
    console.log(`  Overall Score: ${overallScore}/100 (${overallGrade})`)
    console.log(`  Platform: ${detection.platform}`)
    console.log(`  Search Provider: ${detection.searchProvider}`)
    console.log(`  Duration: ${duration}s`)
    console.log(`\n  Dimensions:`)
    evaluation.dimensions.forEach((d) => {
      const bar = "█".repeat(Math.round(d.score / 5)) + "░".repeat(20 - Math.round(d.score / 5))
      console.log(`    ${d.label.padEnd(25)} ${bar} ${d.score}/100 (${d.grade})`)
    })
    console.log(`\n  Revenue Impact:`)
    console.log(`    Monthly lost: ~$${revenueImpact.monthlyLostRevenue.toLocaleString()}`)
    console.log(`    Annual lost:  ~$${revenueImpact.annualLostRevenue.toLocaleString()}`)
    console.log(`    Potential:    ${revenueImpact.improvementPotential}`)
    console.log(`\n  Summary: ${evaluation.summary}`)
    console.log(`\n  Output saved to: ${storeDir}`)
    console.log(`${"═".repeat(60)}\n`)
  } catch (error) {
    console.error("\nGrading failed:", error)
    fs.writeFileSync(
      path.join(storeDir, "error.json"),
      JSON.stringify(
        {
          url,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    )
    process.exit(1)
  }
}

main()
