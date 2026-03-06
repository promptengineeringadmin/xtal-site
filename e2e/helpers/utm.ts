/** Append UTM params to tag Playwright bot traffic as referral from xtalsearch.com */
export function tagUrl(url: string): string {
  const u = new URL(url)
  u.searchParams.set("utm_source", "xtalsearch.com")
  u.searchParams.set("utm_medium", "referral")
  u.searchParams.set("utm_campaign", "xtal_bot")
  return u.toString()
}
