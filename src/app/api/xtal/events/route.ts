import { NextResponse } from "next/server"
import { corsHeaders, handleOptions } from "@/lib/api/cors"

export async function OPTIONS() {
    return handleOptions()
}

export async function POST(request: Request) {
    const origin = request.headers.get("Origin")

    try {
        const body = await request.json()
        const backendUrl = process.env.XTAL_BACKEND_URL
        const collection = body.collection || process.env.XTAL_COLLECTION
        const cors = await corsHeaders(collection, origin)

        if (!backendUrl) {
            return NextResponse.json(
                { error: "XTAL_BACKEND_URL not configured" },
                { status: 500, headers: cors }
            )
        }

        if (!body.action || (body.action !== "error" && !body.product_id)) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400, headers: cors }
            )
        }

        const res = await fetch(`${backendUrl}/api/storefront/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...body,
                collection,
            }),
            signal: AbortSignal.timeout(3000),
        })

        const data = await res.json()
        return NextResponse.json(data, {
            status: res.status,
            headers: cors,
        })
    } catch (error: unknown) {
        const cors = await corsHeaders(undefined, origin)
        if (error instanceof Error && error.name === "TimeoutError") {
            return NextResponse.json(
                { error: "Backend timeout" },
                { status: 504, headers: cors }
            )
        }
        console.error("Storefront events proxy error:", error)
        return NextResponse.json(
            { error: "Event submission failed" },
            { status: 502, headers: cors }
        )
    }
}
