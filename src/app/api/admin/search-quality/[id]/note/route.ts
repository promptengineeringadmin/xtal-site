import { NextResponse } from "next/server"
import { updateNote } from "@/lib/search-quality/logger"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const note = typeof body.note === "string" ? body.note : ""

    await updateNote(id, note)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Search quality note update error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to update note"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
