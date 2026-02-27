/**
 * Category → Vertical mapping
 *
 * Maps raw CSV/probe categories to the 10 XTAL verticals.
 */

import type { Vertical } from "../../lib/admin/collections"

const CATEGORY_TO_VERTICAL: Record<string, Vertical> = {
  // Home & Furniture
  Furniture: "home",
  "Home goods": "home",
  "Home decor": "home",
  Decor: "home",
  "Modern furniture": "home",
  Rugs: "home",
  "Home appliances": "home",
  "Handblown glass": "home",

  // Beauty
  Beauty: "beauty",
  "Beauty/Apparel": "beauty",
  "Home/Beauty adjacency": "beauty",

  // Electronics & Tech
  Electronics: "electronics",
  "Audio retail": "electronics",
  Audio: "electronics",
  "Gaming audio": "electronics",
  "Smart home": "electronics",
  Camera: "electronics",
  "USB/docking tech": "electronics",
  "Auto tech": "electronics",
  Energy: "electronics",
  "Phone cases": "electronics",
  "Portable solar power": "electronics",
  "Solar panels": "electronics",
  "Espresso machines": "electronics",

  // Food & Beverage
  Beverage: "food",
  "Italian specialty food": "food",
  "Specialty retail": "food",

  // Apparel & Fashion
  "Apparel/Home": "apparel",
  "Plus-size fashion": "apparel",
  "Women's fashion": "apparel",
  "Women's footwear": "apparel",
  "Women's shoes": "apparel",
  "Kids' fashion": "apparel",
  "Graphic tees": "apparel",
  "Surf/skate apparel": "apparel",
  "Muslim modest fashion": "apparel",
  "Licensed headwear": "apparel",
  "Luxury sample sales": "apparel",
  Eyewear: "apparel",

  // Outdoor & Adventure
  "Marine safety gear": "outdoor",
  "Knives/EDC": "outdoor",

  // Niche
  Accessories: "niche",
  "Art supplies": "niche",
  "Children's books": "niche",
  "Vintage movie posters": "niche",
  "Rare coins": "niche",
  "Gun holsters": "niche",
  "Unique gifts": "niche",
  "Roses/plants": "niche",
  Lifestyle: "niche",
}

export function categoryToVertical(category: string): Vertical {
  return CATEGORY_TO_VERTICAL[category] || "general"
}
