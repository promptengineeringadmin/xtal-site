import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  findTokenBySuffix,
} from "@/lib/api/api-key-auth"
import { getBudtenderUsage } from "@/lib/api/budtender-usage"

// GET /api/admin/api-keys?collection=goldcanna
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection") || undefined

    const keys = await listApiKeys(collection)

    // Enrich with this month's usage count
    const enriched = await Promise.all(
      keys.map(async (key) => ({
        ...key,
        usage_this_month: await getBudtenderUsage(key.client),
      }))
    )

    return NextResponse.json({ keys: enriched })
  } catch (error) {
    console.error("List API keys error:", error)
    return NextResponse.json({ error: "Failed to list API keys" }, { status: 500 })
  }
}

// POST /api/admin/api-keys — body: { client, collection }
export async function POST(request: Request) {
  try {
    const session = await auth()
    const createdBy = session?.user?.email || "unknown"

    const body = await request.json()
    const { client, collection } = body

    if (!client || !collection) {
      return NextResponse.json(
        { error: "client and collection are required" },
        { status: 400 }
      )
    }

    const token = await createApiKey(client, collection, createdBy)

    return NextResponse.json({ token, client, collection })
  } catch (error) {
    console.error("Create API key error:", error)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}

// DELETE /api/admin/api-keys — body: { token_suffix, client }
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { token_suffix, client } = body

    if (!token_suffix || !client) {
      return NextResponse.json(
        { error: "token_suffix and client are required" },
        { status: 400 }
      )
    }

    const fullToken = await findTokenBySuffix(token_suffix, client)
    if (!fullToken) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    await revokeApiKey(fullToken)
    return NextResponse.json({ revoked: true })
  } catch (error) {
    console.error("Revoke API key error:", error)
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 })
  }
}
