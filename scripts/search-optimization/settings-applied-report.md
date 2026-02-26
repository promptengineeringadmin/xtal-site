# Search Settings Applied Report

**Date:** 2026-02-26
**Collections updated:** bestbuy, xtaldemo, goldcanna
**Script:** `scripts/apply-search-settings.mjs`

---

## Discovery: Actual Backend Values Differ from Report Assumptions

The optimization reports from earlier today assumed all collections were at code defaults. **The actual backend PostgreSQL values were different:**

| Setting | Code Default | Willow (actual) | bestbuy (was) | xtaldemo (was) |
|---------|-------------|-----------------|---------------|----------------|
| `query_enhancement_enabled` | `true` | **false** | **false** | **false** |
| `merch_rerank_strength` | `0.25` | **0.5** | 0.25 | **0** |
| `bm25_weight` | `1.0` | **0.8** | **3.5** | 1.0 |
| `keyword_rerank_strength` | `0.3` | **0.2** | **0.8** | **0.5** |
| Marketing prompt | vibes/aesthetics | "emphasize home decor..." | default (vibes) | junk ("halloween is tomorrow...") in Redis only |
| Brand prompt | empty | "Willow Group Ltd..." | empty | empty |

**Key insight:** bestbuy already had aggressive keyword settings (bm25=3.5, keyword=0.8) from a previous tuning session, but was missing the marketing prompt and had query_enhancement OFF. The stale halloween prompt in xtaldemo Redis was injecting seasonal noise into queries.

---

## Settings Applied

### bestbuy — Final Configuration

| Setting | Was | Now | Rationale |
|---------|-----|-----|-----------|
| `query_enhancement_enabled` | false | **true** | Enables LLM query expansion — critical for intent queries like "home theater on a budget" |
| `merch_rerank_strength` | 0.25 | **0.15** | Reduce influence of marketing prompt re-ranking since it was causing gift cards/warranties to rank high |
| `bm25_weight` | 3.5 | **2.5** | Was too aggressive — pushing keyword over-matching. 2.5 balances keyword precision with semantic understanding |
| `keyword_rerank_strength` | 0.8 | **0.6** | Slightly reduced to allow semantic results to surface alongside keyword matches |
| `store_type` | "online retailer" | **"electronics retailer"** | Better aspects/facet generation for electronics catalog |
| Marketing prompt | default (vibes/aesthetics) | **Electronics-specific (2786 chars)** | 8 rules: no gift cards/warranties/accessories, gaming→hardware, device categories→devices not accessories, gift queries→hardware |
| Brand prompt | empty | **Best Buy catalog context (960 chars)** | Grounds query augmentation LLM in catalog characteristics |

### xtaldemo — Final Configuration

| Setting | Was | Now | Rationale |
|---------|-----|-----|-----------|
| `query_enhancement_enabled` | false | **true** | Enables LLM expansion — dramatically improved "dinner party" results |
| `merch_rerank_strength` | 0 | **0.25** | Restored to default — zero was too aggressive, removing merchandising signal entirely |
| `bm25_weight` | 1.0 | **2.0** | Critical fix for keyword-dependent queries (Instant Pot, yoga mat, hiking boots) |
| `keyword_rerank_strength` | 0.5 | **0.5** | Unchanged — already good |
| Marketing prompt | junk (halloween in Redis, 404 in backend) | **Mixed-catalog specific (1203 chars)** | 5 rules: products over accessories, occasion audience matching, budget as constraint, category diversity, preserve product terms |
| Brand prompt | empty (both Redis and backend) | **Mixed catalog context (659 chars)** | Guides LLM to preserve product names, expand with specific product types for use-case queries |

### goldcanna — Prompts Added for Verisimilitude

| Setting | Was | Now |
|---------|-----|-----|
| Marketing prompt | empty (404 in backend) | Cannabis-specific: effects, terpenes, consumption methods, occasion matching |
| Brand prompt | empty (404 in backend) | Gold Canna dispensary context: flower, concentrates, edibles, vapes, CBD |
| Dial settings | defaults | **Unchanged** — no optimization run performed |

---

## Before/After Diagnostic Results

### bestbuy

| Query | BEFORE (relevance) | AFTER v1 | AFTER v2 (final) | Change |
|-------|-------------------|----------|-------------------|--------|
| "gift for a teenage gamer" | 0/10 gaming hardware (all gift cards, TMNT toys) | 2-3/10 (Turtle Beach #8, still gift cards #1-5) | **7/10 gaming headsets** (#4-10: Turtle Beach, SteelSeries, Razer, CORSAIR) | Dramatic improvement |
| "setting up a home theater on a budget" | Warranty #1-2, $850+ speakers | **7-8/10** budget AV (projector screen $40, wall mount $27, antenna $70) | Same as v1 | Major improvement |
| "gaming keyboard and mouse combo" | Office combos (Logitech MX) | **5-6/10** right brands (iBUYPOWER combo, Razer) but gaming PCs polluting | Same as v1 | Improved |
| "smart home starter kit" | 8-9/10 | 8-9/10 | Same | Unchanged (already good) |
| "best tablet under 300" | 2/10 tablets (rest accessories) | 3/10 | **7/10 tablets** (Samsung + Apple refurb iPads) | Major improvement |

**Showcase queries verified:** bluetooth speakers, noise cancelling headphones, 4K TV — all returning relevant products.

### xtaldemo

| Query | BEFORE (relevance) | AFTER (final) | Change |
|-------|-------------------|---------------|--------|
| "Instant Pot" | 0/10 actual pots (accessories + fake plants) | 0/10 actual pots but Ninja Speedi #2, no fake plants | Improved (catalog gap) |
| "yoga mat" | 0/10 yoga mats (towel rack, sushi mat, ironing board) | 0/10 yoga mats but bath mats + "Yoga Picnic Mat" | Marginal (catalog gap) |
| "hiking boots for men" | ~4/10 (socks dominate, 4 boots scattered) | 2 Merrells at #1-2 (but outdoor accessories in tail) | Mixed — top improved, tail regressed |
| "affordable queen size sheets" | ~5/10 (good top, holiday drift) | ~5/10 (good top, kids bedding replaced holiday) | Unchanged |
| "hosting a dinner party this weekend" | ~3/10 (Nerf, Baby Shark, Thanksgiving) | **9/10** (wine glasses, cocktail napkins, dinnerware, champagne flutes) | Dramatic improvement |

**Showcase queries verified:** spa bathroom, meal prep, minimalist desk — all returning relevant products.

---

## Experiments Conducted

### Experiment 1: Query Enhancement ON vs OFF (xtaldemo)

Tested whether turning enhancement OFF would fix the hiking boots regression.

| Query | Enhancement OFF | Enhancement ON | Winner |
|-------|----------------|----------------|--------|
| "hiking boots" | Work boots as filler (Muck, Redback) | Outdoor accessories as filler (mittens, hats) | Neither (catalog gap, only 2 Merrells) |
| "dinner party" | Baby Shark, Thanksgiving figurines | Wine glasses, napkins, dinnerware | **ON (decisively)** |
| "Instant Pot" | Fake plants at #9-10 | Kitchen tools as filler | **ON** |

**Decision:** Keep enhancement ON. The dinner party and Instant Pot improvements far outweigh the hiking boots tail regression.

### Experiment 2: bm25_weight 2.5 vs 3.0 (bestbuy)

| Query | bm25=2.5 | bm25=3.0 | Winner |
|-------|----------|----------|--------|
| "tablet under 300" | 2 tablets + 8 accessories | Identical | Tie |
| "teenage gamer" | 1 gaming headset #8 | 0 gaming hardware | **2.5** |
| "home theater" | Budget AV products | Identical | Tie |

**Decision:** Keep bm25 at 2.5. Higher values don't help and slightly hurt.

### Experiment 3: Strengthened Marketing Prompt (bestbuy)

Added rules 7-8 to marketing prompt:
- Rule 7: Device category queries → prioritize complete device over accessories
- Rule 8: "gift for [person]" → map to hardware categories, never gift cards

**Result:** "teenage gamer" jumped from 2-3/10 to 7/10 gaming headsets. "tablet under 300" jumped from 3/10 to 7/10 actual tablets.

---

## Remaining Issues (Cannot Fix with Tuning)

| Issue | Root Cause | Possible Fix |
|-------|-----------|-------------|
| bestbuy: 3 Meta VR gift cards still #1-3 for "teenage gamer" | VR gaming IS relevant to teenagers; gift cards match on "gaming" keyword | Would need product-type filtering (exclude product_type containing "Gift Card") |
| xtaldemo: No actual Instant Pot in 30 results | Catalog doesn't contain Instant Pot pressure cookers (only accessories) | Re-ingest with additional products |
| xtaldemo: No yoga mats in 30 results | Catalog doesn't contain yoga mats | Re-ingest with additional products |
| xtaldemo: Hiking boots limited to 2 Merrells | Catalog only has 2 hiking-specific boots | Re-ingest with additional products |
| bestbuy: Geek Squad warranty (#4 for "tablet under 300") | Warranty plan titles contain "tablet" keyword | Would need product-type exclusion filter |

---

## Current State of All Collections

| Collection | Enhancement | bm25 | merch | keyword | Marketing Prompt | Brand Prompt |
|-----------|-------------|------|-------|---------|-----------------|-------------|
| **willow** | OFF | 0.8 | 0.5 | 0.2 | "emphasize home decor..." | "Willow Group Ltd..." |
| **bestbuy** | ON | 2.5 | 0.15 | 0.6 | Electronics-specific (2786 chars) | Best Buy catalog (960 chars) |
| **xtaldemo** | ON | 2.0 | 0.25 | 0.5 | Mixed-catalog rules (1203 chars) | Mixed merchandise (659 chars) |
| **goldcanna** | ON | 1.0 | 0.25 | 0.3 | Cannabis-specific effects/terpenes | Gold Canna dispensary |
| **dennis** | ? | ? | ? | ? | ? | ? |

---

## Script Reference

```bash
# Read current settings
node scripts/apply-search-settings.mjs read-settings <collection>
node scripts/apply-search-settings.mjs read-prompts <collection>

# Apply preset configuration (bestbuy or xtaldemo)
node scripts/apply-search-settings.mjs apply-all <collection>

# Apply individual settings
node scripts/apply-search-settings.mjs apply-settings <collection> '{"bm25_weight": 2.5}'
node scripts/apply-search-settings.mjs apply-marketing <collection> "prompt text here"
node scripts/apply-search-settings.mjs apply-brand <collection> "prompt text here"
```
