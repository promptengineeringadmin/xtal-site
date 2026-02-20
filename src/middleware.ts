import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const INTERNAL_ONLY_PATHS = [
  "/admin/demos",
  "/admin/grader",
  "/admin/users",
  "/admin/organizations",
]

const INTERNAL_ONLY_API_PREFIXES = [
  "/api/admin/demos",
  "/api/admin/grader",
]

const INTERNAL_WRITE_API_PATHS = ["/api/admin/collections"]

const COLLECTION_SCOPED_API_PREFIXES = [
  "/api/admin/settings",
  "/api/admin/prompts",
  "/api/admin/analytics",
  "/api/admin/metrics",
  "/api/admin/synonyms",
]

export default auth((req) => {
  const { pathname, searchParams } = req.nextUrl
  const session = req.auth

  // ── Protect /admin/* pages ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }

    if (session.user.role === "client") {
      const isBlocked = INTERNAL_ONLY_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      )
      if (isBlocked) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
      }
    }
  }

  // ── Protect /api/admin/* routes ─────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === "client") {
      const isBlocked = INTERNAL_ONLY_API_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      )
      if (isBlocked) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const isWriteBlocked = INTERNAL_WRITE_API_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      )
      if (isWriteBlocked && req.method !== "GET") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Collection scoping: verify client can access the requested collection
      const isCollectionScoped = COLLECTION_SCOPED_API_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      )
      if (isCollectionScoped) {
        const collection = searchParams.get("collection")
        if (
          collection &&
          session.user.collectionIds.length > 0 &&
          !session.user.collectionIds.includes(collection)
        ) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
