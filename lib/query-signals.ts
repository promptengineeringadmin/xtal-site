/**
 * Client-side query signal detector for the loading interstitial.
 * Returns a contextual process description based on the query's intent.
 * First match wins — order matters.
 */

interface Signal {
  patterns: RegExp
  message: string
}

const SIGNALS: Signal[] = [
  { patterns: /\$|under\s|budget|affordable|cheap/i, message: "Matching products in your price range" },
  { patterns: /gift|for someone|for my|present|for her|for him|for a /i, message: "Understanding who you're shopping for" },
  { patterns: /party|wedding|weekend|hosting|occasion|birthday|anniversary/i, message: "Finding products for the occasion" },
  { patterns: /bathroom|kitchen|bedroom|room|living|office|patio|garden|space/i, message: "Curating items for that space" },
  { patterns: /cozy|minimal|rustic|modern|elegant|boho|vintage|aesthetic|vibe|feel like/i, message: "Matching the aesthetic you described" },
  { patterns: /hiking|cooking|running|travel|camping|workout|yoga|cycling|fishing/i, message: "Matching products for that activity" },
]

const DEFAULT_MESSAGE = "Understanding your intent and finding matches"

export const PROCESS_PHRASES = [
  "Analyzing search intent…",
  "Scanning the catalog…",
  "Ranking by relevance…",
  "Evaluating product matches…",
  "Refining results…",
]

export function detectQuerySignal(query: string): string {
  for (const { patterns, message } of SIGNALS) {
    if (patterns.test(query)) return message
  }
  return DEFAULT_MESSAGE
}
