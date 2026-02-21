import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    error: "/auth/error",
  },

  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email ?? ""
        if (!email.endsWith("@xtalsearch.com")) {
          return "/auth/error?error=AccessDenied"
        }
        if (!profile?.email_verified) {
          return "/auth/error?error=AccessDenied"
        }
      }
      return true
    },

    jwt({ token, profile }) {
      if (profile) {
        token.email = profile.email
        token.name = profile.name
        token.picture = profile.picture as string | undefined
      }
      return token
    },

    session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string | undefined
      }
      return session
    },
  },
})
