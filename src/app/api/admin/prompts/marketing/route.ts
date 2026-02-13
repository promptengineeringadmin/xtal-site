import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"
import {
  getMarketingPrompt,
  saveMarketingPrompt,
  getMarketingPromptHistory,
  DEFAULT_MARKETING_PROMPT,
} from "@/lib/admin/prompt-storage"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION || "default"
  const includeHistory = searchParams.get("includeHistory") === "true"

  let _source = "default"
  let marketing_prompt = DEFAULT_MARKETING_PROMPT

  // 1. Try Redis (primary store)
  try {
    const redisPrompt = await getMarketingPrompt(collection)
    if (redisPrompt) {
      marketing_prompt = redisPrompt
      _source = "redis"
    }
  } catch {
    // Redis unavailable
  }

  // 2. If Redis empty, try backend as secondary source
  if (_source === "default") {
    try {
      const params = new URLSearchParams({ collection })
      const res = await adminFetch(`/api/vendor/marketing-prompt?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.marketing_prompt) {
          marketing_prompt = data.marketing_prompt
          _source = "backend"
          // Seed Redis with the backend value
          try {
            await saveMarketingPrompt(collection, marketing_prompt)
          } catch {
            // Redis write failed, still return the backend value
          }
        }
      }
    } catch {
      // Backend unreachable
    }
  }

  // 3. Optionally include history
  let history: Awaited<ReturnType<typeof getMarketingPromptHistory>> = []
  if (includeHistory) {
    try {
      history = await getMarketingPromptHistory(collection)
    } catch {
      // History unavailable
    }
  }

  return NextResponse.json({ marketing_prompt, _source, history })
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION || "default"
  const body = await request.json()
  const { marketing_prompt } = body as { marketing_prompt: string }

  let _source = "redis"

  // 1. Save to Redis first (this is the write that matters)
  try {
    await saveMarketingPrompt(collection, marketing_prompt)
  } catch (error) {
    console.error("Marketing prompt Redis save failed:", error)
    return NextResponse.json(
      { error: "Failed to save prompt — storage unreachable" },
      { status: 500 }
    )
  }

  // 2. Best-effort sync to backend
  try {
    const payload = { marketing_prompt, collection }
    let res = await adminFetch("/api/vendor/marketing-prompt", {
      method: "PUT",
      body: JSON.stringify(payload),
    })

    if (res.status === 404) {
      res = await adminFetch("/api/vendor/marketing-prompt", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    }

    if (res.ok) {
      _source = "redis+backend"
    }
  } catch {
    // Backend sync failed — prompt is still saved in Redis
  }

  return NextResponse.json({ marketing_prompt, _source })
}
