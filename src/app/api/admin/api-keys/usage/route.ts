import { NextResponse } from "next/server"
import {
  getBudtenderUsageMonths,
  getBudtenderUsageHistory,
} from "@/lib/api/budtender-usage"

// GET /api/admin/api-keys/usage?client=goldcanna&months=3
// GET /api/admin/api-keys/usage?client=goldcanna&start=<ms>&end=<ms>  (log entries)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const client = searchParams.get("client")

    if (!client) {
      return NextResponse.json(
        { error: "client parameter is required" },
        { status: 400 }
      )
    }

    const startParam = searchParams.get("start")
    const endParam = searchParams.get("end")

    // If start/end provided, return detailed log entries
    if (startParam && endParam) {
      const entries = await getBudtenderUsageHistory(
        client,
        parseInt(startParam, 10),
        parseInt(endParam, 10)
      )
      return NextResponse.json({ client, entries })
    }

    // Otherwise return monthly summary
    const months = parseInt(searchParams.get("months") || "6", 10)
    const usage = await getBudtenderUsageMonths(client, months)

    return NextResponse.json({ client, usage })
  } catch (error) {
    console.error("Usage stats error:", error)
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 })
  }
}
