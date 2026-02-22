import { NextResponse } from "next/server"
import {
  getExplainPromptPool,
  saveExplainPromptPool,
  getExplainPromptHistory,
  DEFAULT_EXPLAIN_PROMPTS,
  computePromptHash,
  type ExplainPromptEntry,
} from "@/lib/admin/explain-prompt"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get("includeHistory") === "true"
    const wantDefault = searchParams.get("default") === "true"

    if (wantDefault) {
      return NextResponse.json({
        pool: DEFAULT_EXPLAIN_PROMPTS.map((p) => ({
          ...p,
          prompt_hash: computePromptHash(p.content),
        })),
      })
    }

    const pool = await getExplainPromptPool()
    const poolWithHashes = pool.map((p) => ({
      ...p,
      prompt_hash: computePromptHash(p.content),
    }))

    let history: Awaited<ReturnType<typeof getExplainPromptHistory>> = []
    if (includeHistory) {
      try {
        history = await getExplainPromptHistory()
      } catch {
        // Redis unavailable for history
      }
    }

    return NextResponse.json({
      pool: poolWithHashes,
      history,
    })
  } catch (error) {
    console.error("Explain prompt GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch explain prompts" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { pool } = body as { pool: ExplainPromptEntry[] }

    if (!pool || !Array.isArray(pool)) {
      return NextResponse.json(
        { error: "Pool array is required" },
        { status: 400 }
      )
    }

    // Validate each entry
    for (const entry of pool) {
      if (!entry.id || !entry.name || !entry.content || typeof entry.enabled !== "boolean") {
        return NextResponse.json(
          { error: `Invalid entry: ${entry.id || "unknown"} — all fields required` },
          { status: 400 }
        )
      }
    }

    try {
      await saveExplainPromptPool(pool)
      return NextResponse.json({ success: true })
    } catch (redisErr) {
      console.error("Explain prompt pool Redis save failed:", redisErr)
      return NextResponse.json({
        success: false,
        warning: "Failed to persist prompt pool — storage is unreachable",
        error: redisErr instanceof Error ? redisErr.message : "Unknown error",
      })
    }
  } catch (error) {
    console.error("Explain prompt PUT error:", error)
    return NextResponse.json(
      { error: "Failed to save explain prompts" },
      { status: 500 }
    )
  }
}
