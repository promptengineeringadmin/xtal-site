import { NextResponse } from "next/server"
import {
  getBillingUsageMonths,
  getBillingEventLog,
} from "@/lib/api/billing-usage"

// GET /api/admin/customers/usage?collection=willow&months=6
// GET /api/admin/customers/usage?collection=willow&start=<ms>&end=<ms>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection")

    if (!collection) {
      return NextResponse.json(
        { error: "collection parameter is required" },
        { status: 400 }
      )
    }

    const startParam = searchParams.get("start")
    const endParam = searchParams.get("end")

    // Detailed log entries for a time window
    if (startParam && endParam) {
      const entries = await getBillingEventLog(
        collection,
        parseInt(startParam, 10),
        parseInt(endParam, 10)
      )
      return NextResponse.json({ collection, entries })
    }

    // Monthly summary
    const months = parseInt(searchParams.get("months") || "6", 10)
    const usage = await getBillingUsageMonths(collection, months)
    return NextResponse.json({ collection, usage })
  } catch (error) {
    console.error("Billing usage error:", error)
    return NextResponse.json(
      { error: "Failed to fetch billing usage" },
      { status: 500 }
    )
  }
}
