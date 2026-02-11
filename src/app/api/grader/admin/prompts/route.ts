import { NextResponse } from "next/server"
import {
  getPrompt,
  savePrompt,
  getPromptHistory,
  DEFAULT_ANALYZE_PROMPT,
  DEFAULT_EVALUATE_PROMPT,
} from "@/lib/grader/prompts"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key") as "analyze" | "evaluate" | null
    const includeHistory = searchParams.get("history") === "true"

    if (key && key !== "analyze" && key !== "evaluate") {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 })
    }

    if (key) {
      const content = await getPrompt(key)
      const defaultContent =
        key === "analyze" ? DEFAULT_ANALYZE_PROMPT : DEFAULT_EVALUATE_PROMPT
      const history = includeHistory ? await getPromptHistory(key) : []

      return NextResponse.json({ key, content, defaultContent, history })
    }

    // Return both prompts
    const [analyzeContent, evaluateContent] = await Promise.all([
      getPrompt("analyze"),
      getPrompt("evaluate"),
    ])

    return NextResponse.json({
      analyze: { content: analyzeContent, default: DEFAULT_ANALYZE_PROMPT },
      evaluate: { content: evaluateContent, default: DEFAULT_EVALUATE_PROMPT },
    })
  } catch (error) {
    console.error("Admin prompts GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { key, content } = body as { key: "analyze" | "evaluate"; content: string }

    if (!key || (key !== "analyze" && key !== "evaluate")) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 })
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    await savePrompt(key, content)

    return NextResponse.json({ success: true, key })
  } catch (error) {
    console.error("Admin prompts PUT error:", error)
    return NextResponse.json(
      { error: "Failed to save prompt" },
      { status: 500 }
    )
  }
}
