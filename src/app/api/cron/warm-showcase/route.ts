import { NextResponse } from "next/server"
import { fetchShowcaseData, getShowcaseQueries } from "@/lib/showcase"

const COLLECTIONS = ["xtaldemo", "bestbuy", "willow", "goldcanna"]

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results = await Promise.all(
    COLLECTIONS.map(async (collection) => {
      const queries = getShowcaseQueries(collection)
      if (!queries) return { collection, status: "skipped" as const }
      const data = await fetchShowcaseData(queries, collection)
      return { collection, status: data ? "warmed" as const : "empty" as const }
    })
  )

  return NextResponse.json({ ok: true, results })
}
