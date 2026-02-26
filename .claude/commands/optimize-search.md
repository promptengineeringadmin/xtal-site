You are a search quality engineer optimizing the **$ARGUMENTS** collection on the XTAL site. Your goal is to produce a data-driven evaluation of search result quality, diagnose problems, and recommend specific dial/prompt settings — using Willow as the gold-standard baseline.

## Important Context

- All collections use the **identical search pipeline** and **identical default dial values**
- Willow works nearly perfectly — it's the reference configuration
- The default marketing prompt emphasizes "vibes, aesthetics, use cases, feelings" — ideal for Willow's home goods catalog but likely misaligned for electronics (bestbuy) or mixed catalogs (xtaldemo)
- Large catalogs (20-30k products) like bestbuy and xtaldemo may need different tuning than smaller curated catalogs
- The marketing prompt and `bm25_weight` are the biggest levers — spec-heavy catalogs need keyword matching, not vibe matching

## Step 1: Read Configuration Context

Read ALL of the following files to understand the tuning system:

**Settings & Prompts:**
- `lib/admin/admin-settings.ts` — all dials, defaults, Redis key patterns
- `lib/admin/prompt-defaults.ts` — default brand/marketing prompt text
- `lib/showcase.ts` — current featured queries + extra suggestions per collection
- `lib/admin/collections.ts` — verify `$ARGUMENTS` is a valid collection

**Search Pipeline (read to understand what each dial does):**
- `lib/server-search.ts` — SSR search wrapper
- `src/app/api/xtal/search/route.ts` — search proxy, enrichment, timeouts
- `src/app/api/xtal/search-full/route.ts` — parallel search+aspects
- `src/app/api/admin/settings/route.ts` — how settings are read/written (GET/PUT)

**Page Files:**
- Map `$ARGUMENTS` to its page: `try` → `xtaldemo`, `bestbuy` → `bestbuy`, `willow` → `willow`, etc.

## Step 2: Fetch Willow Baseline + Target Collection Settings

Use `curl` against the **deployed site** to read current settings for both Willow and the target collection.

**Fetch settings (these are public admin endpoints on localhost or xtalsearch.com):**
```bash
# Willow baseline
curl -s 'https://www.xtalsearch.com/api/admin/settings?collection=willow'

# Target collection
curl -s 'https://www.xtalsearch.com/api/admin/settings?collection=$ARGUMENTS'
```

**Fetch prompts:**
```bash
# Willow prompts
curl -s 'https://www.xtalsearch.com/api/admin/prompts/marketing?collection=willow'
curl -s 'https://www.xtalsearch.com/api/admin/prompts/brand?collection=willow'

# Target prompts
curl -s 'https://www.xtalsearch.com/api/admin/prompts/marketing?collection=$ARGUMENTS'
curl -s 'https://www.xtalsearch.com/api/admin/prompts/brand?collection=$ARGUMENTS'
```

If the deployed site is unreachable, use `localhost:3000` instead (requires `npm run dev`).

Document the results in a comparison table:

| Setting | Willow (baseline) | $ARGUMENTS (current) | Divergence |
|---------|-------------------|---------------------|------------|
| `query_enhancement_enabled` | ... | ... | ... |
| `merch_rerank_strength` | ... | ... | ... |
| `bm25_weight` | ... | ... | ... |
| `keyword_rerank_strength` | ... | ... | ... |
| `store_type` | ... | ... | ... |
| Marketing prompt | (summary) | (summary) | ... |
| Brand prompt | (summary) | (summary) | ... |

## Step 3: Generate Test Query Suite

Create 15-20 test queries covering these archetypes. Tailor queries to the collection's catalog:

| # | Archetype | Description |
|---|-----------|-------------|
| 1 | **Direct product** | Exact product name or model number |
| 2 | **Category browse** | Broad category name |
| 3 | **Use case + product** | Activity/scenario + product type |
| 4 | **Persona + gift** | Who it's for + gifting intent |
| 5 | **Occasion/context** | Event, season, or situation |
| 6 | **Intent-only (vague)** | Natural language, no product named |
| 7 | **Budget-constrained** | Price limit or "cheap/affordable" |
| 8 | **Comparison-style** | "best X for Y" format |
| 9 | **Problem-solving** | Describes a problem, not a product |
| 10 | **Multi-attribute** | Multiple specs/features combined |

**Example queries by collection:**

For `bestbuy`:
1. "Sony WH-1000XM5" (direct), "wireless headphones" (category), "laptop for video editing" (use case), "gift for a teenage gamer" (persona), "setting up a home office" (occasion), "something to listen to music on the go" (intent), "best tablet under 300" (budget), "best noise cancelling headphones" (comparison), "my wifi doesn't reach the backyard" (problem), "lightweight 15 inch laptop with good battery life" (multi-attr)

For `xtaldemo`:
1. "Instant Pot" (direct), "throw blankets" (category), "kitchen gadgets for meal prep" (use case), "gifts for coffee lovers" (persona), "hosting a dinner party" (occasion), "make my bathroom feel like a spa" (intent), "affordable home office setup" (budget), "best travel accessories" (comparison), "my closet is a mess" (problem), "soft breathable cotton sheets queen size" (multi-attr)

## Step 4: Execute Searches and Evaluate (Top 30)

For EACH test query, run:

```bash
curl -s -X POST 'https://www.xtalsearch.com/api/xtal/search' \
  -H 'Content-Type: application/json' \
  -d '{"query": "QUERY_HERE", "collection": "$ARGUMENTS", "limit": 30}'
```

For each query, evaluate ALL 30 results. Rate each result on a 1-5 scale:

| Rating | Meaning | Example |
|--------|---------|---------|
| **5** | Perfect match — exactly what the user wants | "wireless headphones" → Sony WH-1000XM5 |
| **4** | Highly relevant — reasonable result | "wireless headphones" → Bose earbuds |
| **3** | Somewhat relevant — adjacent product | "wireless headphones" → wired headphones |
| **2** | Marginally relevant — wrong category | "wireless headphones" → headphone stand |
| **1** | Irrelevant — should not appear | "home theater" → Best Buy protection plan |

**Output a per-query results table:**

```markdown
### Query 1: "wireless headphones" (category browse)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Sony WH-1000XM5... | $349 | Sony | 5 | Perfect |
| 2 | ... | ... | ... | 4 | ... |
| ... | ... | ... | ... | ... | ... |
| 30 | ... | ... | ... | ... | ... |

**Metrics:** NDCG@5=0.95 | NDCG@10=0.91 | NDCG@30=0.82 | P@5=100% | Irrelevant@30=6% | Cliff=22
```

## Step 5: Compute Aggregate Metrics

For each query, compute:

- **NDCG@5**: Normalized Discounted Cumulative Gain at position 5 (first impression)
  - `DCG@k = sum(rating_i / log2(i+1))` for i=1..k
  - `NDCG@k = DCG@k / IDCG@k` (ideal DCG with perfect ordering)
- **NDCG@10**: Same at position 10
- **NDCG@30**: Full depth
- **Precision@5**: Fraction of top-5 results rated >= 4
- **Irrelevant rate@30**: Fraction of all 30 results rated <= 2
- **Cliff position**: First position where 3 consecutive results are rated <= 2

**Aggregate table:**

| # | Query | Archetype | NDCG@5 | NDCG@10 | NDCG@30 | P@5 | Irrel% | Cliff | Key Issue |
|---|-------|-----------|--------|---------|---------|-----|--------|-------|-----------|
| 1 | "wireless headphones" | category | 0.95 | 0.91 | 0.82 | 100% | 6% | 22 | None |
| 2 | "home theater budget" | occasion | 0.31 | 0.25 | 0.19 | 20% | 62% | 4 | Protection plans |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Overall means across all queries:**
- Mean NDCG@5: X.XX
- Mean NDCG@10: X.XX
- Mean NDCG@30: X.XX
- Mean Precision@5: XX%
- Mean Irrelevant rate@30: XX%

## Step 6: Diagnose Failure Patterns

Analyze the results to identify systemic issues. For each pattern found, explain:
1. What the symptom is (with specific query evidence)
2. WHY it happens (which part of the pipeline is causing it)
3. Which dial/prompt change would fix it

**Common failure patterns and their root causes:**

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Accessories/warranties dominate | Marketing prompt doesn't deprioritize them; `keyword_rerank_strength` too low to favor actual products | Add "Deprioritize accessories, warranties, protection plans, cables, and add-ons" to marketing prompt. Increase `keyword_rerank_strength` to 0.5-0.7 |
| Semantic mismatch (vibe results for spec queries) | Default marketing prompt focuses on "vibes, aesthetics" — wrong for electronics/mixed catalogs | Rewrite marketing prompt for the catalog type: specs, compatibility, performance for electronics |
| Exact product name not found in top 5 | `bm25_weight` too low — semantic search overshadows keyword match | Increase `bm25_weight` to 2.0-3.0. Willow doesn't need this because home goods queries are intent-based, not SKU-based |
| Results feel generic/unsorted | `merch_rerank_strength` not tuned, or marketing prompt lacks merchandising goals | Add specific merchandising goals (e.g., "Prioritize flagship products, best-sellers, and well-reviewed items") |
| Query augmentation adds noise | LLM hallucinating product categories or expanding query too broadly | Tighten brand prompt to constrain augmentation; or disable `query_enhancement_enabled` and compare |
| Quality cliff at position 5-8 | Retrieval pool is good but re-ranking causes relevant items to sink | Reduce `merch_rerank_strength` to let relevance dominate |
| Budget queries ignore price | Query augmentation strips price intent | Ensure brand prompt preserves price signals; check if `extracted_price_lte` is being set |

## Step 7: Recommend Settings

Produce a concrete settings recommendation table:

```markdown
## Recommended Settings for $ARGUMENTS

| Setting | Willow (baseline) | $ARGUMENTS Current | Recommended | Rationale |
|---------|-------------------|-------------------|-------------|-----------|
| `query_enhancement_enabled` | true | ... | ... | [evidence from step 6] |
| `merch_rerank_strength` | 0.25 | ... | ... | [evidence] |
| `bm25_weight` | 1.0 | ... | ... | [evidence] |
| `keyword_rerank_strength` | 0.3 | ... | ... | [evidence] |
| `store_type` | "online retailer" | ... | ... | ... |

### Marketing Prompt Recommendation

**Current:**
> [current prompt text]

**Recommended:**
> [new prompt text, tailored to catalog type]

**Rationale:** [explain why the prompt needs to change, tied to specific query failures from Step 5]

### Brand Prompt Recommendation

**Current:**
> [current prompt text]

**Recommended:**
> [new prompt text]

**Rationale:** [explain]
```

## Step 8: Recommend Featured Queries

From the Step 5 evaluation data, select the **top 3 showcase queries** that:
1. Have NDCG@5 >= 0.85 (excellent first impression)
2. Have Precision@5 = 100% (all top-5 are strong results)
3. Cover different archetypes (not all the same type)
4. Demonstrate semantic understanding (not just keyword matching)
5. Would impress a prospect during a demo

Also recommend 2 extra suggestions (for the "try also" section).

```markdown
## Recommended Showcase Updates

**`lib/showcase.ts` — Replace current queries:**
\`\`\`typescript
$ARGUMENTS: [
  { query: "...", label: "..." },
  { query: "...", label: "..." },
  { query: "...", label: "..." },
],
\`\`\`

**Extra suggestions:**
\`\`\`typescript
$ARGUMENTS: [
  "...",
  "...",
],
\`\`\`
```

## Step 9: Output Final Report

Compile everything into a single structured report:

```markdown
# Search Optimization Report: $ARGUMENTS

**Date:** [today's date]
**Collection:** $ARGUMENTS
**Catalog size:** ~[estimate] products
**Baseline:** Willow (gold standard)

## Executive Summary
[3-5 sentences: overall quality assessment, key problems found, recommended changes]

## Current vs Baseline Configuration
[Settings comparison table from Step 2]

## Test Suite Results
[Aggregate metrics table from Step 5]
[Per-query detail tables from Step 4 — include ALL 30 results per query]

## Failure Pattern Analysis
[Diagnosis from Step 6 with specific evidence]

## Recommended Settings
[Settings table + prompt recommendations from Step 7]

## Recommended Featured Queries
[Showcase updates from Step 8]

## Action Items
1. [ ] Update marketing prompt via admin panel (`/admin/settings/search`, select $ARGUMENTS)
2. [ ] Update brand prompt via admin panel
3. [ ] Adjust dials via admin panel sliders
4. [ ] Update `lib/showcase.ts` with recommended featured queries
5. [ ] Re-run `/optimize-search $ARGUMENTS` to verify improvements
```
