import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { users, organizationMemberships, organizations } from "@/lib/db/schema"
import { requireInternal } from "@/lib/auth/api-guard"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const allUsers = await db.select().from(users).orderBy(users.email)
  const usersWithOrgs = await Promise.all(
    allUsers.map(async (user) => {
      const memberships = await db.select({ organizationId: organizationMemberships.organizationId, organizationName: organizations.name, joinedAt: organizationMemberships.joinedAt }).from(organizationMemberships).innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id)).where(eq(organizationMemberships.userId, user.id))
      return { ...user, organizations: memberships }
    })
  )
  return NextResponse.json({ users: usersWithOrgs })
}

export async function PATCH(req: NextRequest) {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const body = await req.json()
  const { userId, role } = body as { userId: string; role: "internal" | "client" }
  if (!userId || !["internal", "client"].includes(role)) return NextResponse.json({ error: "Valid userId and role (internal|client) are required" }, { status: 400 })
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning()
  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json({ user: updated })
}
