import { NextResponse } from "next/server"
import { runAllQueries } from "@/lib/grader/search"
import { getRun, updateRun } from "@/lib/grader/logger"
import type { Platform, TestQuery } from "@/lib/grader/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      runId,
      storeUrl,
      platform,
      searchUrl,
      queries,
    } = body as {
      runId: string
      storeUrl: string
      platform: Platform
      searchUrl: string | null
      queries: TestQuery[]
    }

    if (!storeUrl || !queries?.length) {
      return NextResponse.json(
        { error: "storeUrl and queries are required" },
        { status: 400 }
      )
    }

    const browserLaunchStart = Date.now()

    // Run all queries sequentially
    const queryResults = await runAllQueries(
      storeUrl,
      platform,
      searchUrl,
      queries
    )

    const totalDuration = Date.now() - browserLaunchStart

    // Update run log
    if (runId) {
      const run = await getRun(runId)
      if (run) {
        run.steps.search = {
          queries: queryResults,
          totalDuration,
          browserLaunchTime: 0, // no browser launch in HTTP mode
        }
        await updateRun(run)
      }
    }

    return NextResponse.json({
      queryResults,
      totalDuration,
    })
  } catch (error) {
    console.error("Grader search error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search execution failed" },
      { status: 500 }
    )
  }
}
