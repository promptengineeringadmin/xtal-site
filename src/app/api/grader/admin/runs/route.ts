import { NextResponse } from "next/server"
import { listRuns } from "@/lib/grader/logger"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get("offset") ?? "0", 10)
    const limit = parseInt(searchParams.get("limit") ?? "50", 10)

    const { runs, total } = await listRuns(offset, Math.min(limit, 100))

    return NextResponse.json({ runs, total, offset, limit })
  } catch (error) {
    console.error("Admin runs list error:", error)
    return NextResponse.json(
      { error: "Failed to list runs" },
      { status: 500 }
    )
  }
}
