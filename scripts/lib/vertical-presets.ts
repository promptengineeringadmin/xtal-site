/**
 * Vertical Presets — Pre-tuned search settings per vertical type
 *
 * Based on optimized values from:
 *   willow (home), bestbuy (electronics), goldcanna (cannabis), xtaldemo (general)
 */

import type { Vertical } from "../../lib/admin/collections"

export interface SearchSettings {
  query_enhancement_enabled: boolean
  bm25_weight: number
  merch_rerank_strength: number
  keyword_rerank_strength: number
  store_type: string
  aspects_enabled: boolean
}

export interface VerticalPreset {
  vertical: Vertical
  settings: SearchSettings
  marketing_prompt: string
  brand_prompt: string
}

export const VERTICAL_PRESETS: Record<Vertical, VerticalPreset> = {
  home: {
    vertical: "home",
    settings: {
      query_enhancement_enabled: false,
      bm25_weight: 0.8,
      merch_rerank_strength: 0.5,
      keyword_rerank_strength: 0.2,
      store_type: "home furnishings retailer",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for a home furnishings retailer. Expand the user's intent with vibes, aesthetics, room settings, materials, and lifestyle aspirations. If someone says 'cozy', think throws, candles, textured pillows. If someone mentions a room, think about what goes in that space.",
    brand_prompt: "",
  },
  electronics: {
    vertical: "electronics",
    settings: {
      query_enhancement_enabled: true,
      bm25_weight: 2.5,
      merch_rerank_strength: 0.15,
      keyword_rerank_strength: 0.6,
      store_type: "electronics retailer",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for an electronics retailer. Expand toward technical specifications, use cases, compatibility requirements, and feature comparisons. If someone says 'gaming', think refresh rate, response time, RGB. If someone mentions 'travel', think portable, battery life, compact.",
    brand_prompt:
      "This is an electronics store with products from many brands. When users search for a brand name, prioritize exact brand matches. For generic queries, show a diverse mix of brands and price points.",
  },
  beauty: {
    vertical: "beauty",
    settings: {
      query_enhancement_enabled: true,
      bm25_weight: 1.2,
      merch_rerank_strength: 0.3,
      keyword_rerank_strength: 0.4,
      store_type: "beauty retailer",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for a beauty retailer. Expand intent with skin concerns, beauty routines, looks, finishes, and ingredient preferences. If someone says 'glowy', think highlighter, dewy foundation, illuminating primer. If someone mentions 'clean beauty', think ingredient-conscious, vegan, cruelty-free.",
    brand_prompt: "",
  },
  food: {
    vertical: "food",
    settings: {
      query_enhancement_enabled: true,
      bm25_weight: 1.0,
      merch_rerank_strength: 0.3,
      keyword_rerank_strength: 0.3,
      store_type: "food and beverage retailer",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for a food and beverage retailer. Expand with flavor profiles, dietary needs, occasions, and pairing suggestions. If someone says 'spicy', think hot sauce, chili flakes, sriracha. If someone mentions 'party', think shareable, snacks, drinks.",
    brand_prompt: "",
  },
  apparel: {
    vertical: "apparel",
    settings: {
      query_enhancement_enabled: true,
      bm25_weight: 1.5,
      merch_rerank_strength: 0.25,
      keyword_rerank_strength: 0.4,
      store_type: "fashion retailer",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for a fashion retailer. Expand with style, occasion, fit, vibe, and trend references. If someone says 'date night', think dresses, heels, statement pieces. If someone says 'casual', think jeans, tees, sneakers, comfortable fits.",
    brand_prompt: "",
  },
  outdoor: {
    vertical: "outdoor",
    settings: {
      query_enhancement_enabled: true,
      bm25_weight: 1.5,
      merch_rerank_strength: 0.25,
      keyword_rerank_strength: 0.4,
      store_type: "outdoor gear retailer",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for an outdoor gear retailer. Expand with activity type, conditions, gear requirements, and safety considerations. If someone says 'camping', think tent, sleeping bag, cookware. If someone says 'rain', think waterproof, Gore-Tex, rain jacket.",
    brand_prompt: "",
  },
  cannabis: {
    vertical: "cannabis",
    settings: {
      query_enhancement_enabled: true,
      bm25_weight: 1.0,
      merch_rerank_strength: 0.25,
      keyword_rerank_strength: 0.3,
      store_type: "cannabis dispensary",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for a cannabis dispensary. Expand with effects, terpene profiles, consumption methods, and experience levels. If someone says 'relax', think indica, myrcene, edibles. If someone says 'creative', think sativa, limonene, vape.",
    brand_prompt: "",
  },
  pet: {
    vertical: "pet",
    settings: {
      query_enhancement_enabled: true,
      bm25_weight: 1.0,
      merch_rerank_strength: 0.3,
      keyword_rerank_strength: 0.3,
      store_type: "pet supplies retailer",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for a pet supplies retailer. Expand with pet type, size, age, health needs, and activity level. If someone says 'puppy', think training treats, chew toys, crate. If someone says 'senior', think joint support, soft food, orthopedic bed.",
    brand_prompt: "",
  },
  niche: {
    vertical: "niche",
    settings: {
      query_enhancement_enabled: true,
      bm25_weight: 1.5,
      merch_rerank_strength: 0.25,
      keyword_rerank_strength: 0.4,
      store_type: "specialty retailer",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for a specialty retailer. Expand intent with use cases, gift occasions, collector interests, and specific needs. Think about why someone is searching and what adjacent products they might want.",
    brand_prompt: "",
  },
  general: {
    vertical: "general",
    settings: {
      query_enhancement_enabled: true,
      bm25_weight: 2.0,
      merch_rerank_strength: 0.25,
      keyword_rerank_strength: 0.5,
      store_type: "online retailer",
      aspects_enabled: true,
    },
    marketing_prompt:
      "You are a search query enhancer for an online retailer. Expand the user's intent with vibes, aesthetics, use cases, and lifestyle aspirations. Think about what they're really looking for beyond the literal words.",
    brand_prompt: "",
  },
}
