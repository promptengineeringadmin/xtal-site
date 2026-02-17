# Willow QA — Major Initiatives

Architectural improvements requiring design work and multi-file changes.
Estimated total: **15-20 hours**

---

## Initiative 1: Ground aspect chips in product data

**Effort**: 6-8 hrs | **Impact**: Every single search affected — 100% hallucination rate today

### Problem
`generate_aspects()` in `llm_service.py:230-319` sends ONLY the query text to Groq. No product data, no catalog facets, no grounding. The LLM invents aspects from its training data:
- "seagrass baskets" → "Premium goose down", "Hypoallergenic"
- "dinner party" → "2018 Napa Valley Cabernet Sauvignon"
- "shredded fill white" → "100% alpaca wool"

### Design Goal
Aspects should be **vibey and generative** (push discovery), not just filter values:
- Gold standard: "caftans" → "flowy silhouettes" (creative reframing of real attributes)
- NOT: "Material: Seagrass" (that's what the filter sidebar does)
- NOT: "Premium goose down" (hallucinated, not in catalog)

### Architecture: Sequenced aspect generation with result context injection

**Key change**: Stop calling aspects in parallel with search. Instead, generate aspects server-side after search completes, injecting a compact catalog context snippet from the top 10 results.

**Current flow** (broken):
```
Frontend fires in parallel:
  search ──────────────> 800ms ──> results
  aspects (no context) ─> 500ms ──> hallucinated chips
```

**Proposed flow** (grounded):
```
Backend does it all:
  LLM stages → Qdrant → build snippet → Groq aspects
  ├── 400ms ──┤├─ 200ms ┤├── <1ms ────┤├── 300ms ──┤
  Total: ~900ms → returns results + aspects together
```

### Implementation

#### Step 1: Catalog snippet builder
New helper function that compresses top-10 results into ~200 tokens of context:

**File**: `xtal-shopify-backend/app/api/search.py` (or new `app/services/aspect_grounding.py`)

```python
def _build_catalog_snippet(results: list, max_results: int = 10) -> str:
    """Compact catalog context from search results (~200 tokens)."""
    # 1. Aggregate tag frequencies: material_seagrass (6), style_coastal (3)...
    tag_counts: dict[str, dict[str, int]] = {}
    for product in results[:max_results]:
        for tag in (product.get("tags") or []):
            prefix, sep, value = tag.partition("_")
            if not sep:
                continue
            bucket = tag_counts.setdefault(prefix, {})
            bucket[value] = bucket.get(value, 0) + 1

    # 2. Format top 3 values per dimension
    tag_lines = []
    for prefix, values in sorted(tag_counts.items()):
        top = sorted(values.items(), key=lambda x: -x[1])[:3]
        formatted = ", ".join(f"{v} ({c})" for v, c in top)
        tag_lines.append(f"  {prefix}: {formatted}")

    # 3. Sample description fragments (first sentence, top 3 results)
    desc_samples = []
    for p in results[:3]:
        desc = p.get("enhanced_description") or p.get("description", "")
        if desc:
            first = desc.split(".")[0].strip()[:120]
            desc_samples.append(f'  - "{first}"')

    # 4. Assemble
    parts = [f"Attributes across {min(len(results), max_results)} results:"]
    parts.extend(tag_lines)
    if desc_samples:
        parts.append("Sample descriptions:")
        parts.extend(desc_samples)
    return "\n".join(parts)
```

**Example output** for "seagrass baskets":
```
Attributes across 8 results:
  material: seagrass (6), rattan (3), wicker (2)
  room: living-room (4), outdoor (3), bathroom (2)
  style: coastal (5), rustic (3), boho (2)
  use-case: storage (4), decorative (3), garden (2)
Sample descriptions:
  - "Hand-woven seagrass basket with reinforced handles for everyday storage"
  - "Round rattan planter with waterproof liner for indoor and outdoor use"
```

#### Step 2: New grounded aspect prompt
**File**: `xtal-shopify-backend/app/services/llm_service.py`

Replace the "Creative Librarian" prompt pattern — the LLM sees real catalog data and is told to creatively reframe it:

```python
async def generate_grounded_aspects(
    self, query: str, catalog_snippet: str,
    selected_aspects: list[str] | None = None,
) -> list[str]:
    selected_text = ""
    if selected_aspects:
        selected_text = f"\nAlready selected (do NOT repeat): {', '.join(selected_aspects)}"

    system_prompt = f"""You suggest discovery angles for shoppers at a {self.settings.store_type}.

CATALOG EVIDENCE (from actual search results):
{catalog_snippet}

RULES:
- Suggest 3-5 short phrases (2-4 words each) that help the shopper explore
- Each suggestion MUST be supported by something in the CATALOG EVIDENCE
- Frame as lifestyle angles, aesthetic moods, or use-case scenarios
- Transform raw attributes into vibey discovery angles:
  "material_seagrass" → "Natural texture" (NOT "Material: Seagrass")
  "room_outdoor" → "Patio living" (NOT "Room: Outdoor")
  "style_rustic" → "Farmhouse charm" (NOT "Style: Rustic")
- NEVER invent products, materials, or attributes not in the evidence
- NEVER suggest price ranges
- Title case. No punctuation.{selected_text}"""

    # Same Groq structured output call as existing generate_aspects()
```

#### Step 3: Wire into search response
**File**: `xtal-shopify-backend/app/api/search.py`

After search results are obtained (full pipeline path only, not filter-in-place):
```python
if not request.search_context:  # Full search, not filter-in-place
    snippet = _build_catalog_snippet(results[:10])
    aspects = await llm_service.generate_grounded_aspects(
        query=request.query,
        catalog_snippet=snippet,
        selected_aspects=request.selected_aspects,
    )
else:
    aspects = None  # Filter-in-place: frontend keeps existing aspects
```

Add `aspects: list[str] | None` field to `SearchResponse` model.

#### Step 4: Frontend — drop parallel aspect call
**File**: `lib/use-xtal-search.ts`
- Remove the parallel `fetch("/api/xtal/aspects")` from the `Promise.all` (lines 102-116)
- Read `aspects` from `searchData.aspects` instead
- `AspectChips.tsx` and `TrySearch.tsx` need zero changes

### Files affected
- `xtal-shopify-backend/app/services/llm_service.py` — New `generate_grounded_aspects()` method
- `xtal-shopify-backend/app/api/search.py` — Snippet builder + wire aspects into response
- `xtal-shopify-backend/app/models/search.py` — Add `aspects` to `SearchResponse`
- `lib/use-xtal-search.ts` — Drop parallel aspect call, read from search response

### Verify
1. Search "seagrass baskets" → aspects should reference materials/styles actually in results
2. No aspect should mention products Willow doesn't sell
3. Aspects should feel like discovery angles, not filter labels
4. Total response time should stay under 1.2s

---

## Initiative 2: Fix suggestion generation pipeline

**Effort**: 3-4 hrs | **Impact**: Landing page first impression for every demo tenant

### Problem
The "Generate queries" button in `/admin/demos` produces bad suggestions for Willow ("setting up a home cocktail bar", "dainty jewelry") because the candidate pool in `lib/admin/suggestions.ts` is 46 hardcoded generic lifestyle queries. Even with the scoring pipeline (test against catalog + Claude semantic scoring), garbage in = garbage out.

### Root Cause
`CANDIDATES` array (lines 7-46) includes "dainty jewelry for everyday wear" and "wireless headphones for working out". These return *something* from any catalog (semantic search always finds partial matches), so they score non-zero and float to the top when there are no better options.

### Solution: Website-aware candidate generation
Instead of a static candidate list, dynamically generate candidates by understanding the client's business:

1. **Fetch the client's website** (from collection config or manual URL input)
2. **Extract what they sell** — product categories, brand voice, target customer
3. **Generate domain-specific candidates** using Claude
4. **Score candidates against catalog** (existing pipeline)
5. **Return top 5**

### Implementation

#### Step 1: Add website URL to collection config
**File**: `lib/admin/collections.ts`
```typescript
export interface CollectionConfig {
  id: string
  label: string
  description: string
  suggestions?: string[]
  websiteUrl?: string  // Client's actual website for context
}
```

Add to hardcoded Willow entry: `websiteUrl: "https://www.willowgroupusa.com"`

#### Step 2: Generate context-aware candidates
**File**: `lib/admin/suggestions.ts`

Replace the static `CANDIDATES` array with a two-phase approach:

```typescript
async function generateCandidates(
  collection: string,
  websiteUrl?: string
): Promise<string[]> {
  const client = getClient()

  // If we have a website, fetch it for context
  let businessContext = ""
  if (websiteUrl) {
    try {
      const res = await fetch(websiteUrl, { signal: AbortSignal.timeout(5000) })
      const html = await res.text()
      // Extract text content (strip HTML, limit to 2000 chars)
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
      businessContext = `\nBusiness website content:\n${text}`
    } catch { /* proceed without website context */ }
  }

  // Also sample a few products from the catalog for grounding
  const backendUrl = process.env.XTAL_BACKEND_URL
  let productContext = ""
  try {
    const res = await fetch(`${backendUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "popular products", collection, limit: 20 }),
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const data = await res.json()
      const titles = (data.results || []).map((r: any) => r.title).filter(Boolean).slice(0, 20)
      productContext = `\nSample product titles from catalog:\n${titles.join(", ")}`
    }
  } catch { /* proceed without product context */ }

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Generate 30 diverse natural-language search queries that a real shopper would type at this store.
${businessContext}
${productContext}

Requirements:
- Queries should sound like how real people search (conversational, intent-driven)
- Mix: gift occasions, seasonal needs, room/space goals, specific product hunts
- Every query must be plausibly answerable by this catalog
- Avoid generic queries that could apply to any store
- 4-10 words each

Return ONLY a JSON array of 30 strings.`
    }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "[]"
  const match = text.match(/\[[\s\S]*\]/)
  if (match) {
    return JSON.parse(match[0]) as string[]
  }
  return CANDIDATES // fallback to static list
}
```

#### Step 3: Wire into main generation flow
**File**: `lib/admin/suggestions.ts` — `generateSuggestions()`

Replace `CANDIDATES` usage with dynamic generation:
```typescript
export async function generateSuggestions(
  collection: string,
  websiteUrl?: string
): Promise<ScoredSuggestion[]> {
  const backendUrl = process.env.XTAL_BACKEND_URL
  if (!backendUrl) throw new Error("XTAL_BACKEND_URL not configured")

  // Phase 0: Generate context-aware candidates (NEW)
  const candidates = await generateCandidates(collection, websiteUrl)

  // Phase 1: Test all candidates against the search API (existing logic)
  // ... use `candidates` instead of `CANDIDATES`
}
```

#### Step 4: Pass websiteUrl from admin UI
**File**: `src/app/api/admin/demos/suggestions/generate/route.ts`
Pass websiteUrl from collection config to `generateSuggestions()`.

### Files affected
- `lib/admin/collections.ts` — Add `websiteUrl` to config
- `lib/admin/suggestions.ts` — Dynamic candidate generation
- `src/app/api/admin/demos/suggestions/generate/route.ts` — Pass websiteUrl

### Verify
1. Press "Generate queries" for Willow in admin
2. Suggestions should reference planters, baskets, gift packaging — not jewelry or headphones
3. Score breakdown should show high semantic relevance (>80) for all 5

---

## Initiative 3: Fix marketing re-ranking for non-default collections

**Effort**: 2-3 hrs | **Impact**: Marketing slider has zero effect on Willow/BestBuy demos

### Problem
Already documented in MEMORY.md. Stale DB constraint on `vendor_id` alone blocks per-collection marketing prompt saves. The cascade: backend save fails → frontend silently falls back to Redis → admin UI looks correct → search pipeline reads PostgreSQL (no prompt) → marketing re-ranking disabled.

Commit `62f2569` partially addressed this by surfacing sync failures in the UI with pipeline badges. But the root DB constraint is still broken.

### Fix (3 parts)

#### Part 1: Fix database migration
**File**: `xtal-shopify-backend/app/services/database.py` (~line 88)

Move constraint drop OUTSIDE the `if not result.fetchone()` block:
```python
# Unconditionally drop old constraint (runs every startup, idempotent)
conn.execute(text(
    "ALTER TABLE vendor_marketing_prompts "
    "DROP CONSTRAINT IF EXISTS vendor_marketing_prompts_vendor_id_key"
))
conn.execute(text(
    "DROP INDEX IF EXISTS ix_vendor_marketing_prompts_vendor_id"
))

# Then check if column needs adding (existing logic)
result = conn.execute(text(
    "SELECT column_name FROM information_schema.columns "
    "WHERE table_name='vendor_marketing_prompts' AND column_name='collection_name'"
))
if not result.fetchone():
    # Add column + new composite unique constraint (existing code)
    ...
```

#### Part 2: Surface backend sync failure (already partially done)
**File**: `src/app/api/admin/prompts/marketing/route.ts`
Commit `62f2569` added pipeline badges. Verify the `_source: "redis_fallback_error"` pattern is working post-DB-fix.

#### Part 3: Pass search_mode through
**File**: `xtal-shopify-backend/app/services/llm_service.py` (~line 617)
In `call_search_agent` return dict, include `search_mode`:
```python
return {
    "query": augmented_query,
    "filters": filters,
    "search_mode": search_mode,  # Currently dropped
    ...
}
```

### Files affected
- `xtal-shopify-backend/app/services/database.py` — Migration fix
- `xtal-shopify-backend/app/services/llm_service.py` — search_mode passthrough
- `src/app/api/admin/prompts/marketing/route.ts` — Verify error surfacing

### Verify
1. Backend restarts → migration runs → constraint dropped
2. Save marketing prompt for "willow" collection via admin UI
3. `GET /api/vendor/marketing-prompt?collection=willow` → returns prompt (not 404)
4. Search on `/willow` with marketing slider at max → result order should change

---

## Initiative 4: Debug price extraction (if penny fix didn't resolve)

**Effort**: 2 hrs | **Impact**: Medium — affects "over $X" queries

### Problem
"Premium display pieces over $200" returned a $2.00 item. This was likely the cents/dollars mismatch addressed by `fix_willow_prices.py`. **Re-run QA first** (Quick Fix #5) — if fixed, close this item.

### If still broken
The `extract_mechanics()` function (llm_service.py:61-128) uses GPT-3.5-turbo. The prompt looks correct but may fail on compound queries where "premium" and "display pieces" confuse the model about the price context.

**Diagnosis**: Check backend logs for `Stage 1 mechanics extracted:` to see what GPT-3.5 returns for this query.

**Potential fixes**:
1. Add explicit examples to the prompt: `"premium items over $200" → price_gte: 200`
2. Upgrade to GPT-4o-mini for mechanics extraction (2x cost, better accuracy)
3. Add post-extraction validation: if result set prices are all far below extracted threshold, flag it

### Files affected
- `xtal-shopify-backend/app/services/llm_service.py` — Prompt tuning or model upgrade

---

## Priority Order

| # | Initiative | Blocks | Recommended order |
|---|-----------|--------|-------------------|
| 1 | Ground aspect chips | Every search | First — highest visibility |
| 2 | Fix suggestion pipeline | Demo first impressions | Second — enables all tenants |
| 3 | Fix marketing re-ranking | Merchandising control | Third — already scoped |
| 4 | Debug price extraction | Edge case queries | Fourth — may already be fixed |
