import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"
import {
  DEFAULT_BRAND_PROMPT,
  DEFAULT_MARKETING_PROMPT,
} from "@/lib/admin/prompt-defaults"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION
    const params = new URLSearchParams({ collection: collection ?? "" })

    const res = await adminFetch(`/api/vendor/prompt-defaults?${params.toString()}`)
    if (!res.ok) {
      // Backend unreachable or errored — return hardcoded defaults
      return NextResponse.json({
        default_brand_prompt: DEFAULT_BRAND_PROMPT,
        default_marketing_prompt: DEFAULT_MARKETING_PROMPT,
      })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Prompt defaults proxy error:", error)
    return NextResponse.json({
      default_brand_prompt: DEFAULT_BRAND_PROMPT,
      default_marketing_prompt: DEFAULT_MARKETING_PROMPT,
    })
  }
}
