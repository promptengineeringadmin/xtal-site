You are evaluating whether the **$ARGUMENTS** collection returns the right NUMBER of results for different query types. Too many results = noise and diluted relevance. Too few = missed revenue and frustrated shoppers.

This is NOT about result quality (that's `/optimize-search`). This is about result QUANTITY — is the search pipeline returning an appropriate number of results for each query type in this catalog?

## Step 1: Read Context

Read ALL of the following to understand the system:

**Cliff algorithm:**
- `c:/vibe/xtal-shopify-backend/app/services/relevance_cliff.py` — the adaptive cutoff algorithm (Kneedle + gap ratio)
- `c:/vibe/xtal-shopify-backend/tests/test_relevance_cliff.py` — production fixtures and expected ranges

**Search pipeline:**
- `lib/admin/admin-settings.ts` — dials and defaults
- `src/app/api/xtal/search/route.ts` — search proxy (returns `relevance_scores`)

**Previous audit results (if they exist):**
- `scripts/cliff-audit/results.json` — last cliff audit output

## Step 2: Run 10 Diagnostic Queries

Select 10 queries covering these breadth categories, tailored to the $ARGUMENTS catalog:

| # | Breadth | Count | Description |
|---|---------|-------|-------------|
| 1-3 | **Broad** | 3 | Category names, vague intents, multi-category queries |
| 4-6 | **Medium** | 3 | Feature-specific, persona+gift, comparison queries |
| 7-8 | **Narrow** | 2 | Exact product names, specific model numbers |
| 9-10 | **Budget** | 2 | Price-constrained queries ("under $X", "affordable", "cheap") |

For each query, run:

```bash
curl -s -X POST 'https://www.xtalsearch.com/api/xtal/search' \
  -H 'Content-Type: application/json' \
  -d '{"query": "QUERY_HERE", "collection": "$ARGUMENTS", "limit": 48}'
```

## Step 3: Analyze Score Distributions

For each query result, extract the `relevance_scores` from the response. Sort descending and compute:

1. **Total results** returned
2. **Score range**: max, min, median, Q25, Q75
3. **Score shape**: Is it a smooth decay? Sharp cliff? Two clusters?
4. **Simulated cliff cut**: Apply the cliff algorithm mentally:
   - Kneedle: Normalize to unit square, subtract y=1-x diagonal, find max negative deviation. Significant if |D| > 0.30.
   - Gap ratio: Any gap > 3× mean gap after position ~20%?

## Step 4: Shopper Heuristic — Evaluate the TAIL

This is the key step. For each query, look at the LAST 10 results (positions 39-48). Ask:

**"Would a shopper browsing for [query] want to see these products?"**

Rate each of the last 10 results:
- **Relevant**: A shopper would click this / consider buying it for their intent
- **Adjacent**: Related but not quite what they want (e.g., accessories, different category)
- **Irrelevant**: Should not appear for this query at all

Score: `relevant_count / 10`

| Tail Score | Interpretation |
|------------|---------------|
| 7-10/10 relevant | Deep catalog — showing all 48 is appropriate |
| 4-6/10 relevant | Mixed — some cutoff would help, but not aggressive |
| 0-3/10 relevant | Shallow match — aggressive cutting is fine |

## Step 5: Catalog Depth Assessment

For broad queries, estimate catalog depth:
- How many products in this catalog genuinely match the query?
- For "soundbars" in a 30k electronics catalog → probably 50+ soundbars → showing 48 is fine
- For "candles" in a 500-product home goods store → probably 20-30 candles → showing all is fine
- For "home theater on a budget" → soundbars + TVs + projectors + streaming devices + speakers → 100+ products

Key insight: **The cliff algorithm doesn't know about catalog depth.** A broad query in a deep catalog will have a smooth score decay because MANY products are relevant — the algorithm may cut too aggressively.

## Step 6: Produce Verdicts

For each query, produce a verdict:

```markdown
### Q1: "soundbars" (broad)

| Metric | Value |
|--------|-------|
| Total results | 48 |
| Score range | 1.000 → 0.023 |
| Score shape | Smooth decay, no cliff |
| Tail relevance | 6/10 (adjacent soundbar accessories) |
| Catalog depth | ~60 soundbar products exist |
| Cliff would keep | 48 (neither detector fires) |
| Verdict | ✅ APPROPRIATE — 48 is fine, most are relevant soundbars |

### Q2: "home theater on a budget" (broad + budget)

| Metric | Value |
|--------|-------|
| Total results | 48 |
| Score range | 1.000 → 0.000 |
| Score shape | Moderate knee at ~pos 12 |
| Tail relevance | 2/10 (random electronics, cables) |
| Catalog depth | 100+ home theater products exist |
| Cliff would keep | 12 |
| Verdict | ⚠ TOO AGGRESSIVE — 12 misses TVs, projectors, speakers that ARE relevant |
| Recommended | Keep 25-30 for this query type |
```

## Step 7: Overall Assessment

Summarize findings:

```markdown
## Overall Assessment: $ARGUMENTS

**Catalog size**: ~X products
**Query types tested**: 10

| Breadth | Queries | Avg Tail Score | Cliff Verdict |
|---------|---------|----------------|---------------|
| Broad | 3 | X/10 | [too aggressive / appropriate / too permissive] |
| Medium | 3 | X/10 | ... |
| Narrow | 2 | X/10 | ... |
| Budget | 2 | X/10 | ... |

### Recommendation

[One of:]
- **No cutoff needed**: This catalog is small/curated enough that all results are relevant
- **Conservative cutoff**: Use cliff algorithm with sensitivity=0.5 (less aggressive)
- **Default cutoff**: sensitivity=1.0 works well for this catalog
- **Aggressive cutoff**: This catalog has significant noise, sensitivity=1.5+ recommended
- **Per-archetype tuning**: Broad queries need min_results=25, narrow queries can cut to 10

### Specific Parameter Recommendations

| Parameter | Current | Recommended | Rationale |
|-----------|---------|-------------|-----------|
| `sensitivity` | 1.0 | ... | [evidence from queries above] |
| `min_results` | 4 | ... | [evidence] |
| `cliff_ratio` | 3.0 | ... | [evidence] |
```

## Important Notes

- This skill complements `/optimize-search` (which evaluates result QUALITY via NDCG ratings)
- Focus on the shopper perspective: "Would I keep scrolling?" not "Is this statistically optimal?"
- The cliff algorithm is score-based only — it doesn't know product categories, catalog depth, or query intent. Your job is to provide the human/shopper layer of evaluation.
- If the cliff audit JSON exists (`scripts/cliff-audit/results.json`), reference it for pre-computed cliff cuts and score distributions.
