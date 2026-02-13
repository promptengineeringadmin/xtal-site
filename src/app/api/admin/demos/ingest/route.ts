import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"
import { addDemoCollection } from "@/lib/admin/demo-collections"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const collectionName = formData.get("collection_name") as string | null
    const label = formData.get("label") as string | null

    if (!file || !collectionName || !label) {
      return NextResponse.json(
        { error: "file, collection_name, and label are required" },
        { status: 400 }
      )
    }

    // Forward file to backend
    const backendForm = new FormData()
    backendForm.append("file", file)
    backendForm.append("collection_name", collectionName)
    backendForm.append("label", label)

    const res = await adminFetch("/api/demo/ingest", {
      method: "POST",
      body: backendForm,
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json(
        { error: `Backend error: ${err}` },
        { status: res.status }
      )
    }

    const data = await res.json()

    // Register the new collection in Redis
    const description = `xtalsearch.com/demo/${collectionName}`
    try {
      await addDemoCollection({ id: collectionName, label, description })
    } catch {
      // Collection may already exist in Redis — that's fine
    }

    return NextResponse.json({
      task_id: data.task_id,
      collection_name: collectionName,
      status_url: `/api/admin/demos/task/${data.task_id}`,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
