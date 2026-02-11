import { NextResponse } from "next/server"
import { evaluateResults } from "@/lib/grader/llm"
import { computeOverallScore, scoreToGrade } from "@/lib/grader/scoring"
import { estimateRevenueImpact } from "@/lib/grader/revenue"
import { getRun, updateRun } from "@/lib/grader/logger"
import type { Platform, QueryResult, GraderReport } from "@/lib/grader/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      runId,
      storeUrl,
      storeName,
      storeType,
      vertical,
      platform,
      queryResults,
    } = body as {
      runId: string
      storeUrl: string
      storeName: string
      storeType: string
      vertical: string
      platform: Platform
      queryResults: QueryResult[]
    }

    if (!queryResults?.length) {
      return NextResponse.json(
        { error: "queryResults are required" },
        { status: 400 }
      )
    }

    // LLM evaluation
    const evaluation = await evaluateResults({
      storeUrl,
      storeName,
      storeType,
      vertical,
      platform,
      queryResults,
    })

    // Compute final score (use LLM's overall score, validated against weighted average)
    const computedScore = computeOverallScore(evaluation.dimensions)
    const overallScore = evaluation.overallScore || computedScore
    const overallGrade = scoreToGrade(overallScore)
    const revenueImpact = estimateRevenueImpact(overallScore)

    // Build report (without id -- save endpoint generates it)
    const reportData = {
      storeUrl,
      storeName,
      platform,
      storeType,
      vertical,
      overallScore,
      overallGrade,
      dimensions: evaluation.dimensions,
      revenueImpact,
      recommendations: evaluation.recommendations,
      summary: evaluation.summary,
    }

    // Update run log
    if (runId) {
      const run = await getRun(runId)
      if (run) {
        const queryResultsSummary = queryResults
          .map(
            (qr) =>
              `[${qr.category}] "${qr.query}" → ${qr.resultCount} results (${qr.responseTime}ms)`
          )
          .join("\n")

        run.steps.evaluate = {
          input: {
            storeInfo: { url: storeUrl, name: storeName, platform, storeType, vertical, searchUrl: null },
            queryResultsSummary,
          },
          promptUsed: evaluation.promptUsed,
          rawResponse: evaluation.rawResponse,
          parsed: {
            dimensions: evaluation.dimensions,
            overallScore,
            recommendations: evaluation.recommendations,
          },
          duration: 0,
        }
        await updateRun(run)
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Grader evaluate error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evaluation failed" },
      { status: 500 }
    )
  }
}
