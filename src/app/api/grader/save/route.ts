import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getRun, completeRun, failRun } from "@/lib/grader/logger"
import type { GraderReport } from "@/lib/grader/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { runId, ...reportData } = body as { runId: string } & Omit<
      GraderReport,
      "id" | "createdAt" | "emailCaptured"
    >

    if (!runId || !reportData.storeUrl) {
      return NextResponse.json(
        { error: "runId and report data are required" },
        { status: 400 }
      )
    }

    const reportId = nanoid(12)
    const report: GraderReport = {
      ...reportData,
      id: reportId,
      createdAt: new Date().toISOString(),
      emailCaptured: false,
    }

    // Complete the run
    const run = await getRun(runId)
    if (run) {
      await completeRun(run, report)
    }

    const origin = request.headers.get("origin") || "https://xtalsearch.com"
    const shareUrl = `${origin}/grade/${reportId}`

    return NextResponse.json({
      reportId,
      shareUrl,
      report,
    })
  } catch (error) {
    console.error("Grader save error:", error)

    // Try to fail the run gracefully
    const body = await request.clone().json().catch(() => null)
    if (body?.runId) {
      const run = await getRun(body.runId).catch(() => null)
      if (run) {
        await failRun(
          run,
          error instanceof Error ? error.message : "Save failed"
        ).catch(() => {})
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed" },
      { status: 500 }
    )
  }
}
