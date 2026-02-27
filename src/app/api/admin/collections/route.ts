import { NextResponse } from "next/server"
import {
  getAllCollections,
  addDemoCollection,
  removeDemoCollection,
  updateDemoCollection,
} from "@/lib/admin/demo-collections"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase()
    const vertical = searchParams.get("vertical")
    const source = searchParams.get("source")
    const sort = searchParams.get("sort") || "name"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "0", 10)))

    let collections = await getAllCollections()

    // Filter
    if (search) {
      collections = collections.filter(
        (c) =>
          c.label.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.id.toLowerCase().includes(search),
      )
    }
    if (vertical) {
      collections = collections.filter((c) => c.vertical === vertical)
    }
    if (source) {
      collections = collections.filter((c) => c.source === source)
    }

    // Sort
    collections.sort((a, b) => {
      switch (sort) {
        case "productCount":
          return (b.productCount ?? 0) - (a.productCount ?? 0)
        case "name":
        default:
          return a.label.localeCompare(b.label)
      }
    })

    const total = collections.length

    // Paginate (only if limit > 0)
    if (limit > 0) {
      const start = (page - 1) * limit
      collections = collections.slice(start, start + limit)
    }

    return NextResponse.json({ collections, total, page, limit })
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
    await addDemoCollection({
      id,
      label,
      description: description || "",
      vertical: body.vertical,
      productCount: body.productCount,
      source: body.source,
      sourceUrl: body.sourceUrl,
    })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg.includes("already exists") || msg.includes("built-in") ? 409 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, suggestions } = body
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    if (!Array.isArray(suggestions)) {
      return NextResponse.json(
        { error: "suggestions must be an array" },
        { status: 400 }
      )
    }
    await updateDemoCollection(id, { suggestions })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    const status = msg.includes("not found") ? 404 : 500
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
