import { NextResponse } from "next/server"
import { adminFetch } from "@/lib/admin/api"

export async function POST() {
  try {
    const res = await adminFetch("/api/vendor/admin/migrate", { method: "POST" })
    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown")
      return NextResponse.json({ error: errText }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
