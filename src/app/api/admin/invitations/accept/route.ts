import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invitations, organizationMemberships, users } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/api-guard"
import { eq, and, isNull, gt } from "drizzle-orm"

export async function POST(req: Request) {
  const session = await requireAuth()
  if (session instanceof Response) return session
  const body = await req.json()
  const { token } = body as { token: string }
  if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 })
  const [invite] = await db.select().from(invitations).where(and(eq(invitations.token, token), isNull(invitations.acceptedAt), gt(invitations.expiresAt, new Date()))).limit(1)
  if (!invite) return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
  if (invite.email !== session.user.email?.toLowerCase()) return NextResponse.json({ error: "This invitation is for a different email address" }, { status: 403 })
  await db.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invite.id))
  try {
    await db.insert(organizationMemberships).values({ organizationId: invite.organizationId, userId: session.user.id })
  } catch { /* unique constraint — already a member */ }
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (user && user.role !== "internal") {
    await db.update(users).set({ role: "client" }).where(eq(users.id, session.user.id))
  }
  return NextResponse.json({ accepted: true })
}
