import { NextResponse } from "next/server"
import { listFeedback } from "@/lib/search-quality/logger"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get("offset") ?? "0", 10)
    const limit = parseInt(searchParams.get("limit") ?? "50", 10)

    const { entries, total } = await listFeedback(offset, Math.min(limit, 100))

    return NextResponse.json({ entries, total, offset, limit })
  } catch (error) {
    console.error("Search quality list error:", error)
    return NextResponse.json(
      { error: "Failed to list feedback" },
      { status: 500 }
    )
  }
}
