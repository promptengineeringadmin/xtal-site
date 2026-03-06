import { NextResponse } from "next/server"
import { reconcileBilling } from "@/lib/api/billing-reconcile"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const report = await reconcileBilling()
    console.log("[billing-reconcile] Report:", JSON.stringify(report))
    return NextResponse.json(report)
  } catch (error) {
    console.error("[billing-reconcile] Error:", error)
    return NextResponse.json(
      { error: "Reconciliation failed" },
      { status: 500 }
    )
  }
}
