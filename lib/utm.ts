/**
 * Appends immutable XTAL UTM parameters to a product URL.
 *
 * utm_source and utm_medium are hardcoded — not merchant-configurable.
 */
export function appendUtm(
  url: string,
  collection: string,
  productId: string,
  query: string
): string {
  try {
    const u = new URL(url)
    u.searchParams.set("utm_source", "xtal")
    u.searchParams.set("utm_medium", "search")
    u.searchParams.set("utm_campaign", collection)
    u.searchParams.set("utm_content", productId)
    u.searchParams.set("utm_term", query)
    return u.toString()
  } catch {
    // If the URL is malformed, return it as-is
    return url
  }
}
