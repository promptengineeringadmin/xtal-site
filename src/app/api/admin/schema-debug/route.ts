import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function GET() {
  try {
    const res = await adminFetch("/api/vendor/debug/schema")
    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown")
      return NextResponse.json({ error: errText }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
