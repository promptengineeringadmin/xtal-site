import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import {
  isMarketingRoute,
  isAdminOnlyRoute,
  MARKETING_HOST,
  WWW_HOST,
} from "@/lib/admin/subdomain-routes"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const hostname = req.headers.get("host") ?? ""
  const host = hostname.split(":")[0]
  const isLocalDev = host === "localhost"

  // --- Subdomain enforcement (skip in local dev) ---
  if (!isLocalDev) {
    const isMarketingSub = host === MARKETING_HOST

    // Marketing route on www? → redirect to marketing
    if (!isMarketingSub && isMarketingRoute(pathname)) {
      const url = req.nextUrl.clone()
      url.host = MARKETING_HOST
      url.port = ""
      return NextResponse.redirect(url, 308)
    }

    // Admin-only route on marketing? → redirect to www
    if (isMarketingSub && isAdminOnlyRoute(pathname)) {
      const url = req.nextUrl.clone()
      url.host = WWW_HOST
      url.port = ""
      return NextResponse.redirect(url, 308)
    }
  }

  // --- Auth enforcement ---
  const isLoggedIn = !!req.auth

  if (!isLoggedIn) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin)
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return Response.redirect(signInUrl)
  }
})

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/grader/admin/:path*"],
}
