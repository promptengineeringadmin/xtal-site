import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invitations, organizations } from "@/lib/db/schema"
import { requireInternal } from "@/lib/auth/api-guard"
import { eq, desc } from "drizzle-orm"
import { Resend } from "resend"

export async function GET() {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const pending = await db.select({ id: invitations.id, email: invitations.email, organizationId: invitations.organizationId, organizationName: organizations.name, token: invitations.token, expiresAt: invitations.expiresAt, acceptedAt: invitations.acceptedAt, createdAt: invitations.createdAt }).from(invitations).innerJoin(organizations, eq(invitations.organizationId, organizations.id)).orderBy(desc(invitations.createdAt))
  return NextResponse.json({ invitations: pending })
}

export async function POST(req: Request) {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const body = await req.json()
  const { email, organizationId } = body as { email: string; organizationId: string }
  if (!email?.trim() || !organizationId) return NextResponse.json({ error: "Email and organizationId are required" }, { status: 400 })
  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const [invite] = await db.insert(invitations).values({ email: email.trim().toLowerCase(), organizationId, token, expiresAt }).returning()
  const resendKey = process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? ""
      const signInUrl = baseUrl + "/auth/signin"
      await resend.emails.send({
        from: process.env.AUTH_EMAIL_FROM ?? "XTAL Search <noreply@xtalsearch.com>",
        to: email.trim(),
        subject: "You've been invited to XTAL Admin — " + org.name,
        html: '<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#1B2D5B">You have been invited to XTAL Admin</h2><p>You have been invited to manage <strong>' + org.name + '</strong> on XTAL Search.</p><p>Click the button below to sign in and get started:</p><a href="' + signInUrl + '" style="display:inline-block;background:#1B2D5B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500">Sign in to XTAL Admin</a><p style="color:#666;font-size:12px;margin-top:24px">This invitation expires in 7 days. Sign in with the email address this was sent to.</p></div>',
      })
    } catch (err) {
      console.error("Failed to send invitation email:", err)
    }
  }
  return NextResponse.json({ invitation: invite }, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await requireInternal()
  if (session instanceof Response) return session
  const body = await req.json()
  const { id } = body as { id: string }
  if (!id) return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 })
  const [deleted] = await db.delete(invitations).where(eq(invitations.id, id)).returning()
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
