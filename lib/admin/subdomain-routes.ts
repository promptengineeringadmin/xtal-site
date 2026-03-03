/**
 * Subdomain routing rules for the admin panel.
 * "marketing" pages serve from marketing.xtalsearch.com
 * "admin" pages serve from www.xtalsearch.com
 */

export const MARKETING_HOST = "marketing.xtalsearch.com"
export const WWW_HOST = "www.xtalsearch.com"

// Admin pages that serve from marketing.xtalsearch.com
const MARKETING_PAGE_PREFIXES = ["/admin/demos", "/admin/grader", "/admin/customers"] as const

// API routes that serve from marketing.xtalsearch.com
const MARKETING_API_PREFIXES = [
  "/api/admin/demos",
  "/api/admin/collections",
  "/api/grader/admin",
  "/api/admin/customers",
] as const

const ALL_MARKETING_PREFIXES = [
  ...MARKETING_PAGE_PREFIXES,
  ...MARKETING_API_PREFIXES,
] as const

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/")
}

/** Returns true if the pathname should be served from marketing.xtalsearch.com */
export function isMarketingRoute(pathname: string): boolean {
  return ALL_MARKETING_PREFIXES.some((p) => matchesPrefix(pathname, p))
}

/** Returns true if the pathname is an admin route that should NOT be on marketing */
export function isAdminOnlyRoute(pathname: string): boolean {
  const isAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/grader/admin/")
  return isAdmin && !isMarketingRoute(pathname)
}
