import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"
import {
  getBrandPrompt,
  saveBrandPrompt,
  getBrandPromptHistory,
  DEFAULT_BRAND_PROMPT,
} from "@/lib/admin/prompt-storage"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION || "default"
  const includeHistory = searchParams.get("includeHistory") === "true"

  let _source = "default"
  let brand_prompt = DEFAULT_BRAND_PROMPT

  // 1. Try Redis (primary store)
  try {
    const redisPrompt = await getBrandPrompt(collection)
    if (redisPrompt) {
      brand_prompt = redisPrompt
      _source = "redis"
    }
  } catch {
    // Redis unavailable
  }

  // 2. If Redis empty, try backend as secondary source
  if (_source === "default") {
    try {
      const params = new URLSearchParams({ collection })
      const res = await adminFetch(`/api/vendor/brand-prompt?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.brand_prompt) {
          brand_prompt = data.brand_prompt
          _source = "backend"
          // Seed Redis with the backend value
          try {
            await saveBrandPrompt(collection, brand_prompt)
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
  let history: Awaited<ReturnType<typeof getBrandPromptHistory>> = []
  if (includeHistory) {
    try {
      history = await getBrandPromptHistory(collection)
    } catch {
      // History unavailable
    }
  }

  return NextResponse.json({ brand_prompt, _source, history })
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION || "default"
  const body = await request.json()
  const { brand_prompt } = body as { brand_prompt: string }

  let _source = "redis"

  // 1. Save to Redis first (this is the write that matters)
  try {
    await saveBrandPrompt(collection, brand_prompt)
  } catch (error) {
    console.error("Brand prompt Redis save failed:", error)
    return NextResponse.json(
      { error: "Failed to save prompt — storage unreachable" },
      { status: 500 }
    )
  }

  // 2. Best-effort sync to backend
  let backendWarning: string | undefined
  try {
    const params = new URLSearchParams({ collection })
    const backendUrl = `/api/vendor/brand-prompt?${params.toString()}`
    const payload = { brand_prompt }
    let res = await adminFetch(backendUrl, {
      method: "PUT",
      body: JSON.stringify(payload),
    })

    if (res.status === 404) {
      res = await adminFetch(backendUrl, {
        method: "POST",
        body: JSON.stringify(payload),
      })
    }

    if (res.ok) {
      _source = "redis+backend"
    } else {
      const errText = await res.text().catch(() => "unknown")
      console.error(`Brand prompt backend sync failed (${res.status}): ${errText}`)
      _source = "redis_only"
      backendWarning =
        "Prompt saved locally but failed to sync to search backend. It won't affect search results until the backend issue is resolved."
    }
  } catch (err) {
    console.error("Brand prompt backend sync error:", err)
    _source = "redis_only"
    backendWarning =
      "Prompt saved locally but failed to sync to search backend. It won't affect search results until the backend issue is resolved."
  }

  return NextResponse.json({ brand_prompt, _source, backendWarning })
}
