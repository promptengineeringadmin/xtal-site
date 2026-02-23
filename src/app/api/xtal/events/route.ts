import { NextResponse } from "next/server"
import { corsHeaders, handleOptions } from "@/lib/api/cors"

export async function OPTIONS() {
    return handleOptions()
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const backendUrl = process.env.XTAL_BACKEND_URL
        const collection = body.collection || process.env.XTAL_COLLECTION

        if (!backendUrl) {
            return NextResponse.json(
                { error: "XTAL_BACKEND_URL not configured" },
                { status: 500, headers: corsHeaders() }
            )
        }

        if (!body.product_id || !body.action) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400, headers: corsHeaders() }
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
            headers: corsHeaders(),
        })
    } catch (error: unknown) {
        if (error instanceof Error && error.name === "TimeoutError") {
            return NextResponse.json(
                { error: "Backend timeout" },
                { status: 504, headers: corsHeaders() }
            )
        }
        console.error("Storefront events proxy error:", error)
        return NextResponse.json(
            { error: "Event submission failed" },
            { status: 502, headers: corsHeaders() }
        )
    }
}
