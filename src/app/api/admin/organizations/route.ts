import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { organizations, organizationCollections, organizationMemberships } from "@/lib/db/schema"
import { requireInternal } from "@/lib/auth/api-guard"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const orgs = await db.select().from(organizations).orderBy(organizations.name)
  const orgsWithCollections = await Promise.all(
    orgs.map(async (org) => {
      const cols = await db.select({ collectionId: organizationCollections.collectionId }).from(organizationCollections).where(eq(organizationCollections.organizationId, org.id))
      const memberCount = await db.select({ id: organizationMemberships.id }).from(organizationMemberships).where(eq(organizationMemberships.organizationId, org.id))
      return { ...org, collectionIds: cols.map((c) => c.collectionId), memberCount: memberCount.length }
    })
  )
  return NextResponse.json({ organizations: orgsWithCollections })
}

export async function POST(req: Request) {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const body = await req.json()
  const { name, slug, collectionIds } = body as { name: string; slug: string; collectionIds: string[] }
  if (!name?.trim() || !slug?.trim()) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
  if (!collectionIds?.length) return NextResponse.json({ error: "At least one collection is required" }, { status: 400 })
  const [org] = await db.insert(organizations).values({ name: name.trim(), slug: slug.trim().toLowerCase() }).returning()
  await db.insert(organizationCollections).values(collectionIds.map((cid: string) => ({ organizationId: org.id, collectionId: cid })))
  return NextResponse.json({ organization: org }, { status: 201 })
}
