import { NextResponse } from "next/server"
import { serverSearch } from "@/lib/server-search"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams.get("q") || "tablet"
  const collection = url.searchParams.get("collection") || "bestbuy"

  const backendUrl = process.env.XTAL_BACKEND_URL
  const defaultCollection = process.env.XTAL_COLLECTION

  const result = await serverSearch(q, collection)

  return NextResponse.json({
    debug: {
      backendUrl: backendUrl ? `${backendUrl.slice(0, 20)}...` : "NOT SET",
      defaultCollection: defaultCollection || "NOT SET",
      query: q,
      collection,
    },
    resultTotal: result?.total ?? null,
    resultCount: result?.results?.length ?? null,
    firstProduct: result?.results?.[0]?.title ?? null,
    hasData: result !== null,
  })
}
