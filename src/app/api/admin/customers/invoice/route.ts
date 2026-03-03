import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getCustomer, getRatesForMonth } from "@/lib/api/billing-customer"
import { getBillingUsage, getBillingEventLog } from "@/lib/api/billing-usage"

// POST /api/admin/customers/invoice — body: { slug, month }
// month format: "2026-03"
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slug, month } = body

    if (!slug || !month) {
      return NextResponse.json(
        { error: "slug and month are required" },
        { status: 400 }
      )
    }

    const customer = await getCustomer(slug)
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // Parse month into date range
    const [year, mon] = month.split("-").map(Number)
    const startDate = new Date(year, mon - 1, 1)
    const endDate = new Date(year, mon, 0) // last day of month
    const startMs = startDate.getTime()
    const endMs = new Date(year, mon, 0, 23, 59, 59, 999).getTime()

    const periodLabel = `${startDate.toLocaleDateString("en-US", { month: "long" })} ${startDate.getDate()}–${endDate.getDate()}, ${year}`

    // Get usage counts and event log across all collections
    let totalSearch = 0
    let totalAspect = 0
    let totalExplain = 0
    const allEvents: Array<{
      timestamp: string
      collection: string
      event_type: string
      query: string
      product_id: string
      status: number
    }> = []

    for (const col of customer.collections) {
      const usage = await getBillingUsage(col, month)
      totalSearch += usage.search
      totalAspect += usage.aspect_click
      totalExplain += usage.explain

      const events = await getBillingEventLog(col, startMs, endMs)
      for (const e of events) {
        allEvents.push({
          timestamp: new Date(e.timestamp).toISOString(),
          collection: col,
          event_type: e.type,
          query: e.query,
          product_id: e.product_id || "",
          status: e.status,
        })
      }
    }

    // Sort events by timestamp
    allEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    // Build workbook
    const wb = XLSX.utils.book_new()

    // ── Summary sheet ──
    const summaryData: (string | number)[][] = [
      ["XTAL Search Invoice"],
      [],
      ["Customer:", customer.company_name],
      ["Billing Period:", periodLabel],
      ["Invoice Date:", new Date().toLocaleDateString("en-US")],
      [],
    ]

    // Use historical rates for the billing month
    const rates = getRatesForMonth(customer, month)

    if (rates.billing_model === "flat") {
      summaryData.push(
        ["Billing Model:", "Flat Fee"],
        [],
        ["Description", "Amount"],
        ["Monthly Service Fee", rates.flat_monthly_fee ?? 0],
        [],
        ["TOTAL", rates.flat_monthly_fee ?? 0],
        [],
        ["Event Summary (for reference):"],
        ["Event Type", "Count"],
        ["Search Queries", totalSearch],
        ["Aspect Clicks", totalAspect],
        ["Why This Result", totalExplain],
        ["Total Events", totalSearch + totalAspect + totalExplain]
      )
    } else {
      const searchTotal = totalSearch * rates.price_per_search
      const aspectTotal = totalAspect * rates.price_per_aspect_click
      const explainTotal = totalExplain * rates.price_per_explain
      const grandTotal = searchTotal + aspectTotal + explainTotal

      summaryData.push(
        ["Billing Model:", "Usage-Based"],
        [],
        ["Event Type", "Count", "Rate", "Total"],
        [
          "Search Queries",
          totalSearch,
          `$${rates.price_per_search.toFixed(2)}`,
          `$${searchTotal.toFixed(2)}`,
        ],
        [
          "Aspect Clicks",
          totalAspect,
          `$${rates.price_per_aspect_click.toFixed(2)}`,
          `$${aspectTotal.toFixed(2)}`,
        ],
        [
          "Why This Result",
          totalExplain,
          `$${rates.price_per_explain.toFixed(2)}`,
          `$${explainTotal.toFixed(2)}`,
        ],
        [],
        ["", "", "TOTAL", `$${grandTotal.toFixed(2)}`]
      )
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

    // Set column widths
    summarySheet["!cols"] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 14 },
    ]

    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary")

    // ── Detail sheet ──
    if (allEvents.length > 0) {
      const detailSheet = XLSX.utils.json_to_sheet(allEvents, {
        header: [
          "timestamp",
          "collection",
          "event_type",
          "query",
          "product_id",
          "status",
        ],
      })
      detailSheet["!cols"] = [
        { wch: 24 },
        { wch: 16 },
        { wch: 14 },
        { wch: 40 },
        { wch: 20 },
        { wch: 8 },
      ]
      XLSX.utils.book_append_sheet(wb, detailSheet, "Detail")
    }

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    const filename = `xtal-invoice-${customer.slug}-${month}.xlsx`

    return new Response(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Invoice generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    )
  }
}
