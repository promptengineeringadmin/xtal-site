import { NextResponse } from "next/server"
import { generateSuggestions } from "@/lib/admin/suggestions"
import { isValidCollection } from "@/lib/admin/demo-collections"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { collection } = await request.json()

    if (!collection || typeof collection !== "string") {
      return NextResponse.json(
        { error: "collection is required" },
        { status: 400 }
      )
    }

    const valid = await isValidCollection(collection)
    if (!valid) {
      return NextResponse.json(
        { error: `Collection '${collection}' not found` },
        { status: 404 }
      )
    }

    const suggestions = await generateSuggestions(collection)
    return NextResponse.json({ suggestions })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    console.error("Suggestion generation error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
