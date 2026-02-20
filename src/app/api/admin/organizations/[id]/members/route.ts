import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { organizationMemberships, users } from "@/lib/db/schema"
import { requireInternal } from "@/lib/auth/api-guard"
import { eq, and } from "drizzle-orm"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const { id } = await params
  const members = await db.select({ membershipId: organizationMemberships.id, userId: users.id, name: users.name, email: users.email, role: users.role, image: users.image, joinedAt: organizationMemberships.joinedAt }).from(organizationMemberships).innerJoin(users, eq(organizationMemberships.userId, users.id)).where(eq(organizationMemberships.organizationId, id))
  return NextResponse.json({ members })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const { id } = await params
  const { userId } = (await req.json()) as { userId: string }
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })
  const [deleted] = await db.delete(organizationMemberships).where(and(eq(organizationMemberships.organizationId, id), eq(organizationMemberships.userId, userId))).returning()
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
