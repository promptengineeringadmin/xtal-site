import { NextResponse } from "next/server"
import { adminFetch, getAuthProvider } from "@/lib/admin/api"
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

    const provider = getAuthProvider()
    const backendForm = new FormData()
    backendForm.append("file", file)
    backendForm.append("collection_name", collectionName)

    let responseData

    if (provider === "authentik") {
      // xtal-search-app: synchronous /api/ingest/file
      const res = await adminFetch("/api/ingest/file", {
        method: "POST",
        body: backendForm,
        signal: AbortSignal.timeout(120_000),
      })

      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json(
          { error: `Backend error: ${err}` },
          { status: res.status }
        )
      }

      const data = await res.json()

      // Register in Redis
      const description = `xtalsearch.com/demo/${collectionName}`
      try {
        await addDemoCollection({ id: collectionName, label, description })
      } catch { /* may already exist */ }

      // Sync response — no task_id, mark as immediately completed
      responseData = {
        task_id: null,
        collection_name: collectionName,
        status: "completed",
        products_processed: data.products_processed,
        message: data.message,
      }
    } else {
      // xtal-shopify-backend: async /api/demo/ingest with polling
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

      // Register in Redis
      const description = `xtalsearch.com/demo/${collectionName}`
      try {
        await addDemoCollection({ id: collectionName, label, description })
      } catch { /* may already exist */ }

      responseData = {
        task_id: data.task_id,
        collection_name: collectionName,
        status_url: `/api/admin/demos/task/${data.task_id}`,
      }
    }

    return NextResponse.json(responseData)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
