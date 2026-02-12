import { NextResponse } from "next/server"
import {
  getExplainPrompt,
  saveExplainPrompt,
  getExplainPromptHistory,
  DEFAULT_EXPLAIN_SYSTEM_PROMPT,
} from "@/lib/admin/explain-prompt"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get("includeHistory") === "true"
    const wantDefault = searchParams.get("default") === "true"

    if (wantDefault) {
      return NextResponse.json({ content: DEFAULT_EXPLAIN_SYSTEM_PROMPT })
    }

    const content = await getExplainPrompt()
    const history = includeHistory ? await getExplainPromptHistory() : []

    return NextResponse.json({
      content,
      defaultContent: DEFAULT_EXPLAIN_SYSTEM_PROMPT,
      history,
    })
  } catch (error) {
    console.error("Explain prompt GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch explain prompt" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { content } = body as { content: string }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    await saveExplainPrompt(content)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Explain prompt PUT error:", error)
    return NextResponse.json(
      { error: "Failed to save explain prompt" },
      { status: 500 }
    )
  }
}
