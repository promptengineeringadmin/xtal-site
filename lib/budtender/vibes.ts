export interface VibeProfile {
  query: string
  facet_filters: Record<string, string[]>
}

export const VIBE_MAP: Record<string, VibeProfile> = {
  relax: {
    query: "relaxing calming wind down body relaxation",
    facet_filters: {
      effect: ["relaxation", "stress-relief"],
      "strain-type": ["indica", "indica-dominant-hybrid"],
    },
  },
  sleep: {
    query: "help me sleep deeply restful night sedating",
    facet_filters: {
      effect: ["sleep", "relaxation"],
      "strain-type": ["indica"],
      terpene: ["myrcene", "linalool"],
    },
  },
  energize: {
    query: "energizing uplifting daytime boost active",
    facet_filters: {
      effect: ["energy", "mood-boost"],
      "strain-type": ["sativa", "sativa-dominant-hybrid"],
      terpene: ["limonene", "pinene"],
    },
  },
  create: {
    query: "creative inspiration artistic focus imagination",
    facet_filters: {
      effect: ["creativity", "focus", "euphoria"],
      "strain-type": ["sativa", "hybrid"],
      terpene: ["limonene", "pinene"],
    },
  },
  focus: {
    query: "focused alert productive clear headed concentration",
    facet_filters: {
      effect: ["focus", "energy"],
      "strain-type": ["sativa", "sativa-dominant-hybrid", "hybrid"],
      terpene: ["pinene", "limonene"],
    },
  },
  social: {
    query: "social chatty fun party hangout euphoric",
    facet_filters: {
      effect: ["euphoria", "mood-boost"],
      "strain-type": ["sativa", "hybrid"],
      terpene: ["limonene", "caryophyllene"],
    },
  },
}

export const VALID_VIBES = Object.keys(VIBE_MAP)

export function synthesizeQuery(filters: {
  terpenes?: string[]
  strains?: string[]
  effects?: string[]
  formats?: string[]
}): string {
  const parts: string[] = []
  if (filters.strains?.length) parts.push(filters.strains.join(" or ") + " strain")
  if (filters.formats?.length) parts.push(filters.formats.join(" or "))
  if (filters.effects?.length) parts.push("for " + filters.effects.join(" and "))
  if (filters.terpenes?.length) parts.push("with " + filters.terpenes.join(" and ") + " terpenes")
  return parts.join(" ") || "cannabis product recommendation"
}
