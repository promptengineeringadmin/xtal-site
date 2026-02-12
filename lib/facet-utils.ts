/**
 * Facet value formatting and normalization utilities.
 *
 * - formatFacetValue(): kebab-case → Title Case for display
 * - normalizeFacets(): merge synonym facet values, return expansion map
 * - expandFilters(): convert normalized filters back to originals for the API
 *
 * Synonym groups are loaded from /api/admin/synonyms (stored in data/synonyms.json)
 * and passed in at runtime — no hardcoded dictionary.
 */

// ---------------------------------------------------------------------------
// Display formatting
// ---------------------------------------------------------------------------

/** Convert a kebab/snake-case facet value to Title Case for display */
export function formatFacetValue(value: string): string {
  return value
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

// ---------------------------------------------------------------------------
// Synonym normalization
// ---------------------------------------------------------------------------

/** Build a fast lookup Map from synonym groups (first value = canonical) */
function buildSynonymLookup(groups: string[][]): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const group of groups) {
    const canonical = group[0]
    for (const value of group) {
      lookup.set(value, canonical)
    }
  }
  return lookup
}

// ---------------------------------------------------------------------------
// Facet normalization (merges synonym counts)
// ---------------------------------------------------------------------------

export interface NormalizedFacets {
  /** Facets with synonym values merged under their canonical key */
  facets: Record<string, Record<string, number>>
  /** Maps prefix → canonical → original values[] (for expanding filters) */
  expansionMap: Record<string, Record<string, string[]>>
}

/**
 * Normalize a `computed_facets` response from the backend.
 * Merges counts for values that share a synonym group and builds an
 * expansion map so filters can be converted back to original values.
 */
export function normalizeFacets(
  raw: Record<string, Record<string, number>>,
  synonymGroups: string[][] = []
): NormalizedFacets {
  const lookup = buildSynonymLookup(synonymGroups)
  const facets: Record<string, Record<string, number>> = {}
  const expansionMap: Record<string, Record<string, string[]>> = {}

  for (const [prefix, values] of Object.entries(raw)) {
    facets[prefix] = {}
    expansionMap[prefix] = {}

    for (const [value, count] of Object.entries(values)) {
      const canonical = lookup.get(value) ?? value
      facets[prefix][canonical] = (facets[prefix][canonical] || 0) + count

      if (!expansionMap[prefix][canonical]) {
        expansionMap[prefix][canonical] = []
      }
      if (!expansionMap[prefix][canonical].includes(value)) {
        expansionMap[prefix][canonical].push(value)
      }
    }
  }

  return { facets, expansionMap }
}

/**
 * Expand normalized (canonical) facet filters back to the original values
 * that the backend expects.
 */
export function expandFilters(
  filters: Record<string, string[]>,
  expansionMap: Record<string, Record<string, string[]>>
): Record<string, string[]> {
  const expanded: Record<string, string[]> = {}

  for (const [prefix, values] of Object.entries(filters)) {
    const map = expansionMap[prefix] || {}
    expanded[prefix] = values.flatMap((v) => map[v] || [v])
  }

  return expanded
}
