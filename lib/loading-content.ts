export const LOADING_CONTENT = {
  statusLines: {
    firstSearch: "Finding matches for your search",
    returning: "Searching",
  },
  querySignalMessages: {
    price: "Finding options that work within your budget",
    gift: "Understanding who you're shopping for",
    occasion: "Matching products to your occasion",
    style: "Looking for items that fit your vibe",
    problem: "Finding products that can help with that",
    comparison: "Finding similar options you might prefer",
    default: "Matching your search to the best results",
  } as Record<string, string>,
  storeTypeDefaults: {
    fashion: "Browsing styles that match your look",
    home: "Finding pieces that fit your space",
    electronics: "Searching for the right tech",
    food: "Looking through flavors and ingredients",
    beauty: "Finding products for your routine",
    outdoor: "Searching gear for your next adventure",
    general: "Looking through the catalog for you",
  } as Record<string, string>,
  aspectHints: [
    "Refinement options will appear with your results",
    "You'll be able to narrow down by category and more",
    "Filter options are on the way with your results",
  ],
  emptyStateMessages: {
    fashion:
      'Try searching the way you\'d ask a friend \u2014 like "a warm jacket for winter commuting"',
    home: 'Describe what you\'re looking for in your own words \u2014 like "cozy lighting for a small bedroom"',
    electronics:
      'Search naturally \u2014 try something like "a laptop good for video editing under $1000"',
    food: 'Describe what you\'re craving \u2014 like "high-protein snacks that aren\'t too sweet"',
    beauty:
      'Tell us what you need \u2014 like "a gentle cleanser for sensitive skin"',
    outdoor:
      'Describe your plans \u2014 like "lightweight gear for a weekend backpacking trip"',
    general:
      'Search in your own words \u2014 like "a gift for someone who loves cooking"',
  } as Record<string, string>,
  querySignalPatterns: {
    gift: [
      "gift for",
      "gifts for",
      "present for",
      "something for my",
      "something for a",
      "buy for my",
      "get for my",
      "stocking stuffer",
      "birthday",
      "christmas",
      "valentine",
      "anniversary",
      "mother'?s day",
      "father'?s day",
      "housewarming",
      "baby shower",
      "wedding gift",
    ],
    occasion: [
      "for a party",
      "for a wedding",
      "date night",
      "dinner party",
      "camping trip",
      "road trip",
      "vacation",
      "thanksgiving",
      "halloween",
      "beach trip",
      "festival",
      "interview",
      "night out",
      "brunch",
      "picnic",
      "hike",
      "marathon",
      "workout",
    ],
    problem: [
      "my .+ hurt",
      "too hot",
      "too cold",
      "too small",
      "too big",
      "need more",
      "can't find",
      "won't fit",
      "keeps breaking",
      "struggling with",
      "tired of",
      "help with",
      "solution for",
    ],
    comparison: [
      "like .+ but",
      "similar to",
      "alternative to",
      "instead of",
      "better than",
      "cheaper than",
      "same as",
      "replacement for",
      "versus",
      "vs\\.?\\s",
    ],
    style: [
      "cozy",
      "minimalist",
      "modern",
      "rustic",
      "elegant",
      "bohemian",
      "boho",
      "vintage",
      "retro",
      "classic",
      "trendy",
      "casual",
      "formal",
      "sleek",
      "scandinavian",
      "aesthetic",
      "cute",
      "chic",
      "edgy",
      "preppy",
    ],
    price: [
      "under \\$",
      "below \\$",
      "around \\$",
      "about \\$",
      "less than \\$",
      "more than \\$",
      "over \\$",
      "\\$\\d",
      "cheap",
      "affordable",
      "budget",
      "expensive",
      "premium",
      "luxury",
      "high.end",
      "inexpensive",
      "bargain",
      "deal",
      "sale",
      "splurge",
    ],
  } as Record<string, string[]>,
}

// Priority order: gift > occasion > problem > comparison > style > price > default
const SIGNAL_PRIORITY: string[] = [
  "gift",
  "occasion",
  "problem",
  "comparison",
  "style",
  "price",
]

export function detectQuerySignal(query: string): string {
  const q = query.toLowerCase()
  for (const signal of SIGNAL_PRIORITY) {
    const patterns = LOADING_CONTENT.querySignalPatterns[signal]
    if (!patterns) continue
    for (const pattern of patterns) {
      if (new RegExp(pattern, "i").test(q)) {
        return signal
      }
    }
  }
  return "default"
}
