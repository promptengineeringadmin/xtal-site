import { NextResponse } from "next/server"
import {
  getAllCollections,
  addDemoCollection,
  removeDemoCollection,
} from "@/lib/admin/demo-collections"

export async function GET() {
  try {
    const collections = await getAllCollections()
    return NextResponse.json({ collections })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, label, description } = body
    if (!id || !label) {
      return NextResponse.json(
        { error: "id and label are required" },
        { status: 400 }
      )
    }
    await addDemoCollection({ id, label, description: description || "" })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg.includes("already exists") || msg.includes("built-in") ? 409 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    await removeDemoCollection(id)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg.includes("built-in") ? 400 : msg.includes("not found") ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
