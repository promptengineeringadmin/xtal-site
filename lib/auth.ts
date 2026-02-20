import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  invitations,
  organizationMemberships,
  organizationCollections,
} from "@/lib/db/schema"
import { eq, and, isNull, gt } from "drizzle-orm"

const INTERNAL_DOMAINS = (process.env.INTERNAL_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)

function isInternalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase()
  return INTERNAL_DOMAINS.includes(domain ?? "")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Google,
    MicrosoftEntraId({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID ?? "common"}/v2.0`,
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? "XTAL Search <noreply@xtalsearch.com>",
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.email || !user.id) return

      // Auto-assign internal role based on email domain
      if (isInternalEmail(user.email)) {
        await db
          .update(users)
          .set({ role: "internal" })
          .where(eq(users.id, user.id))
      }

      // Check for pending invitation and accept it
      const pending = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.email, user.email.toLowerCase()),
            isNull(invitations.acceptedAt),
            gt(invitations.expiresAt, new Date())
          )
        )
        .limit(1)

      if (pending.length > 0) {
        const invite = pending[0]
        await db
          .update(invitations)
          .set({ acceptedAt: new Date() })
          .where(eq(invitations.id, invite.id))

        await db.insert(organizationMemberships).values({
          organizationId: invite.organizationId,
          userId: user.id,
        })
      }
    },
  },
  callbacks: {
    async session({ session, user }) {
      // Fetch the full user record with role
      const [dbUser] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)

      session.user.id = user.id
      session.user.role = dbUser?.role ?? "client"

      // For client users, fetch their org and collection IDs
      if (session.user.role === "client") {
        const memberships = await db
          .select({
            organizationId: organizationMemberships.organizationId,
            collectionId: organizationCollections.collectionId,
          })
          .from(organizationMemberships)
          .innerJoin(
            organizationCollections,
            eq(
              organizationMemberships.organizationId,
              organizationCollections.organizationId
            )
          )
          .where(eq(organizationMemberships.userId, user.id))

        session.user.organizationId = memberships[0]?.organizationId ?? null
        session.user.collectionIds = [
          ...new Set(memberships.map((m) => m.collectionId)),
        ]
      } else {
        // Internal users have access to all collections
        session.user.organizationId = null
        session.user.collectionIds = []
      }

      return session
    },
  },
})

// Extend the session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: "internal" | "client"
      organizationId: string | null
      collectionIds: string[]
    }
  }
}
