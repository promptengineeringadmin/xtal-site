import { NextResponse } from "next/server"
import { getRun } from "@/lib/grader/logger"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Run ID is required" }, { status: 400 })
    }

    const run = await getRun(id)

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 })
    }

    return NextResponse.json(run)
  } catch (error) {
    console.error("Admin run detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch run" },
      { status: 500 }
    )
  }
}
