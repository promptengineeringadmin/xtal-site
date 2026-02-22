export function appendUtm(
  url: string,
  params: { shopId: string; productId: string; query: string }
): string {
  try {
    const u = new URL(url)
    u.searchParams.set("utm_source", "xtal")
    u.searchParams.set("utm_medium", "search")
    u.searchParams.set("utm_campaign", params.shopId)
    u.searchParams.set("utm_content", params.productId)
    u.searchParams.set("utm_term", params.query)
    return u.toString()
  } catch {
    // Malformed URL — return unchanged
    return url
  }
}
