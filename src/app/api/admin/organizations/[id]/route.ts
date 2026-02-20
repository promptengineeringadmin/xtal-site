import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { organizations, organizationCollections } from "@/lib/db/schema"
import { requireInternal } from "@/lib/auth/api-guard"
import { eq } from "drizzle-orm"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const { id } = await params
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1)
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const cols = await db.select({ collectionId: organizationCollections.collectionId }).from(organizationCollections).where(eq(organizationCollections.organizationId, id))
  return NextResponse.json({ organization: { ...org, collectionIds: cols.map((c) => c.collectionId) } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const { id } = await params
  const body = await req.json()
  const { name, slug, collectionIds } = body as { name?: string; slug?: string; collectionIds?: string[] }
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (name) updates.name = name.trim()
  if (slug) updates.slug = slug.trim().toLowerCase()
  const [org] = await db.update(organizations).set(updates).where(eq(organizations.id, id)).returning()
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (collectionIds) {
    await db.delete(organizationCollections).where(eq(organizationCollections.organizationId, id))
    if (collectionIds.length > 0) {
      await db.insert(organizationCollections).values(collectionIds.map((cid: string) => ({ organizationId: id, collectionId: cid })))
    }
  }
  return NextResponse.json({ organization: org })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const { id } = await params
  const [deleted] = await db.delete(organizations).where(eq(organizations.id, id)).returning()
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
