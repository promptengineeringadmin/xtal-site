import { NextResponse } from "next/server"
import {
  getAspectsPrompt,
  saveAspectsPrompt,
  getAspectsPromptHistory,
  DEFAULT_ASPECTS_SYSTEM_PROMPT,
} from "@/lib/admin/aspects-prompt"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION || "default"
    const includeHistory = searchParams.get("includeHistory") === "true"
    const wantDefault = searchParams.get("default") === "true"

    if (wantDefault) {
      return NextResponse.json({ content: DEFAULT_ASPECTS_SYSTEM_PROMPT })
    }

    const content = await getAspectsPrompt(collection)

    let history: Awaited<ReturnType<typeof getAspectsPromptHistory>> = []
    if (includeHistory) {
      try {
        history = await getAspectsPromptHistory(collection)
      } catch {
        // Redis unavailable for history — still return the prompt content
      }
    }

    return NextResponse.json({
      content,
      defaultContent: DEFAULT_ASPECTS_SYSTEM_PROMPT,
      history,
    })
  } catch (error) {
    console.error("Aspects prompt GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch aspects prompt" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION || "default"
    const body = await request.json()
    const { content } = body as { content: string }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    try {
      await saveAspectsPrompt(collection, content)
      return NextResponse.json({ success: true })
    } catch (redisErr) {
      console.error("Aspects prompt Redis save failed:", redisErr)
      return NextResponse.json({
        success: false,
        warning: "Failed to persist prompt — storage is unreachable",
        error: redisErr instanceof Error ? redisErr.message : "Unknown error",
      })
    }
  } catch (error) {
    console.error("Aspects prompt PUT error:", error)
    return NextResponse.json(
      { error: "Failed to save aspects prompt" },
      { status: 500 }
    )
  }
}
