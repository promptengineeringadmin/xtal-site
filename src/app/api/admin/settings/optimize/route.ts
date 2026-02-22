import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

/* POST starts an async optimization job (returns { job_id }) */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection =
      searchParams.get("collection") || process.env.XTAL_COLLECTION
    const params = new URLSearchParams({ collection: collection ?? "" })

    const body = await request.json().catch(() => ({}))

    const res = await adminFetch(
      `/api/vendor/settings/optimize?${params.toString()}`,
      {
        method: "POST",
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25_000),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      const isHtml = text.trim().startsWith("<")
      const errorMsg = isHtml
        ? `Backend returned ${res.status} (service may be unavailable)`
        : text || `Backend returned ${res.status}`
      return NextResponse.json({ error: errorMsg }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`Optimize proxy error [${err.name}]: ${err.message}`)
    const detail = err.name === "TimeoutError" ? "Request timed out" : err.message
    return NextResponse.json(
      { error: `Failed to reach optimization service: ${detail}` },
      { status: 502 }
    )
  }
}

/* GET polls an optimization job status by job_id query param */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("job_id")
    if (!jobId) {
      return NextResponse.json(
        { error: "job_id query parameter is required" },
        { status: 400 }
      )
    }

    const res = await adminFetch(
      `/api/vendor/settings/optimize/${jobId}`,
      { method: "GET", signal: AbortSignal.timeout(25_000) }
    )

    if (!res.ok) {
      const text = await res.text()
      const isHtml = text.trim().startsWith("<")
      const errorMsg = isHtml
        ? `Backend returned ${res.status} (service may be unavailable)`
        : text || `Backend returned ${res.status}`
      return NextResponse.json({ error: errorMsg }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`Optimize poll error [${err.name}]: ${err.message}`)
    const detail = err.name === "TimeoutError" ? "Request timed out" : err.message
    return NextResponse.json(
      { error: `Failed to poll optimization service: ${detail}` },
      { status: 502 }
    )
  }
}
