import { NextResponse } from "next/server"
import { getSnippetSettings, saveSnippetSettings } from "@/lib/admin/admin-settings"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION || "default"

  try {
    const settings = await getSnippetSettings(collection)
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Snippet settings GET error:", error)
    return NextResponse.json({ error: "Failed to load snippet settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || process.env.XTAL_COLLECTION || "default"
    const body = await request.json()

    await saveSnippetSettings(collection, body)
    const updated = await getSnippetSettings(collection)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Snippet settings PUT error:", error)
    return NextResponse.json({ error: "Failed to save snippet settings" }, { status: 500 })
  }
}
