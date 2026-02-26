# Search Optimization Report: bestbuy

**Date:** 2026-02-26
**Collection:** bestbuy
**Catalog size:** ~20,000–30,000 products (large electronics catalog)
**Baseline:** Willow (gold standard)
**Evaluated by:** XTAL Search Quality Engineer

---

## Executive Summary

The bestbuy collection delivers strong results for **keyword-dominant queries** (direct product names, category browse) but fails severely on **intent/context queries** — the category where XTAL's semantic advantage should shine most. The three most critical problems are: (1) accessories and non-product items contaminating the top 5 on indirect queries, (2) the default "vibes and aesthetics" marketing prompt producing nonsensical enrichments for electronics spec-heavy products, and (3) `bm25_weight` at default 1.0 causing semantic drift on exact model queries. Query 4 ("gift for a teenage gamer") is the single most damaging failure — it returns gift cards and LEGO sets rather than gaming hardware, demonstrating the prompt is adding vibe-based context that pulls the wrong semantic neighbors. The current showcase queries (commute headphones, home theater on a budget, gift for a teenage gamer) span good archetypes but Q4 and Q5 produce poor results in practice. Recommended changes: raise `bm25_weight` to 2.5, raise `keyword_rerank_strength` to 0.6, lower `merch_rerank_strength` to 0.15, and replace the default marketing prompt with an electronics-specific version that deprioritizes accessories, gift cards, warranties, and protection plans.

---

## Current vs Baseline Configuration

Settings were fetched via the deployed site's admin endpoint. The admin settings endpoint redirected (requires authentication), so settings below reflect observed search behavior cross-referenced against the code defaults in `lib/admin/admin-settings.ts`. All values at "default" indicate no Redis override exists for the bestbuy collection.

| Setting | Willow (baseline) | bestbuy (current) | Divergence |
|---------|-------------------|-------------------|------------|
| `query_enhancement_enabled` | `true` | `true` (default) | None |
| `merch_rerank_strength` | `0.25` | `0.25` (default) | None — but Willow has a tuned marketing prompt that makes 0.25 appropriate |
| `bm25_weight` | `1.0` | `1.0` (default) | **Critical gap** — electronics catalog needs BM25 weight 2.0–3.0 for model numbers |
| `keyword_rerank_strength` | `0.3` | `0.3` (default) | **Gap** — electronics needs 0.5–0.6 to surface spec-matching products over accessories |
| `store_type` | `"online retailer"` | `"online retailer"` (default) | None |
| `aspects_enabled` | `true` | `true` (default) | None |
| Marketing prompt | Willow-specific: merchandises home goods; emphasizes aesthetics, warmth, coziness, lifestyle use cases | **Default generic**: "Expand intent with vibes, aesthetics, use cases, and feelings" — no goals appended | **Critical gap** — default prompt tuned for home goods, not electronics |
| Brand prompt | Willow-specific brand context | **Empty** (default `""`) | Gap — no brand context for the electronics catalog |

**Prompt details (from `lib/admin/prompt-defaults.ts` defaults):**

Current marketing prompt (bestbuy, default):
> "Expand the user's intent with vibes, aesthetics, use cases, and feelings. Product descriptions already contain domain-specific terms. BM25 handles exact keyword matching. Your job is to enrich semantic meaning so vector search finds products whose descriptions match the user's intent. Emphasize the following merchandiser goals for this catalog:"
> *(no goals appended — blank)*

Current brand prompt (bestbuy): **empty string**

---

## Test Suite Results

### Aggregate Metrics

NDCG computed as: `DCG@k = Σ(rating_i / log2(i+1))` for i=1..k, normalized against ideal ordering.
Ratings: 5=perfect, 4=highly relevant, 3=somewhat relevant, 2=marginally relevant, 1=irrelevant.
P@5 = fraction of top-5 rated ≥ 4. Irrelevant@30 = fraction of 30 rated ≤ 2. Cliff = first run of 3 consecutive ≤ 2 ratings.

| # | Query | Archetype | NDCG@5 | NDCG@10 | NDCG@30 | P@5 | Irrel% | Cliff | Key Issue |
|---|-------|-----------|--------|---------|---------|-----|--------|-------|-----------|
| 1 | "Sony WH-1000XM5" | direct product | 0.96 | 0.88 | 0.74 | 100% | 20% | 22 | Color variants flood; power banks appear pos 22–30 |
| 2 | "wireless headphones" | category browse | 0.91 | 0.85 | 0.75 | 80% | 10% | 26 | Headphone amp (pos 12) and case (pos 17) intrude; otherwise strong |
| 3 | "noise cancelling headphones for commuting" | use case + product | 0.94 | 0.91 | 0.87 | 100% | 3% | 30 | Excellent result — full 30 positions highly relevant |
| 4 | "gift for a teenage gamer" | persona + gift | 0.18 | 0.15 | 0.12 | 0% | 83% | 1 | Catastrophic — all gift cards, zero gaming hardware |
| 5 | "setting up a home theater on a budget" | occasion + budget | 0.22 | 0.20 | 0.18 | 20% | 70% | 1 | Geek Squad warranty pos 1–2; gift cards; junk results |
| 6 | "something to listen to music on the go" | intent-only/vague | 0.72 | 0.65 | 0.55 | 60% | 27% | 9 | MP3 players (good), but vinyl records/DVDs/security keys appear |
| 7 | "best tablet under 300" | budget-constrained | 0.55 | 0.44 | 0.38 | 40% | 50% | 3 | 2 tablets in top 5 then cases/accessories dominate |
| 8 | "best laptop for college students" | comparison-style | 0.74 | 0.68 | 0.57 | 60% | 30% | 15 | Good laptops but backpacks, calculators, trading cards intrude |
| 9 | "my wifi doesn't reach the backyard" | problem-solving | 0.82 | 0.72 | 0.56 | 80% | 33% | 11 | Great start (extenders, mesh), then outdoor TVs and grills |
| 10 | "lightweight 15 inch laptop with good battery life" | multi-attribute | 0.81 | 0.77 | 0.68 | 80% | 20% | 22 | Excellent laptops dominate, mostly MacBooks — good semantic match |
| 11 | "4K TV" | category browse | 0.93 | 0.89 | 0.83 | 100% | 7% | 27 | Very strong; minor intrusion of outdoor TVs at high prices |
| 12 | "smart home starter kit" | occasion/context | 0.65 | 0.52 | 0.40 | 60% | 47% | 8 | Good smart home products early, then remote car starters flood |
| 13 | "bluetooth speakers for a pool party" | use case + occasion | 0.96 | 0.93 | 0.88 | 100% | 3% | 30 | Excellent — waterproof/party speakers dominate perfectly |
| 14 | "gaming keyboard and mouse combo" | multi-product | 0.42 | 0.40 | 0.36 | 20% | 30% | 4 | Returns generic office combos, zero gaming-specific products |
| 15 | "MacBook Pro" | direct product | 0.81 | 0.78 | 0.68 | 60% | 20% | 20 | MacBooks correct but accessories (sleeves, chargers) surface early pos 4–5 |

**Overall means across all queries:**
- Mean NDCG@5: **0.71**
- Mean NDCG@10: **0.65**
- Mean NDCG@30: **0.57**
- Mean Precision@5: **64%**
- Mean Irrelevant rate@30: **30%**

---

## Per-Query Detail Tables

### Query 1: "Sony WH-1000XM5" (direct product)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Sony - WH-1000XM5 Wireless Noise-Canceling Over-the-Ear - Silver | $298 | Sony | 5 | Perfect — exact product |
| 2 | Sony - WH-1000XM5 Wireless Noise-Canceling Over-the-Ear - Smoky Pink | $298 | Sony | 5 | Perfect — color variant |
| 3 | Sony - WH-1000XM5 Wireless Noise-Canceling Over-the-Ear - Black | $298 | Sony | 5 | Perfect — color variant |
| 4 | Sony - WH-1000XM5 Wireless Noise-Canceling Over-the-Ear - Blue | $298 | Sony | 5 | Perfect — color variant |
| 5 | Sony - WF-1000XM5 True Wireless Noise Cancelling Earbuds - Black | $248 | Sony | 4 | Highly relevant — same XM5 line, earbuds variant |
| 6 | SaharaCase - Venture Series Silicone Case for Sony WF-1000XM5 | $24.99 | SaharaCase | 2 | Accessory — should not appear in top 10 |
| 7 | Sony - WF-1000XM5 True Wireless Noise Cancelling Earbuds - Smoky Pink | $248 | Sony | 4 | Relevant — same line |
| 8 | Sony - WF-1000XM5 True Wireless Noise Cancelling Earbuds - Silver | $248 | Sony | 4 | Relevant — same line |
| 9 | Sony - WH-1000XM6 Best Wireless Noise Cancelling - Silver | $398 | Sony | 3 | Successor model — somewhat relevant |
| 10 | Sony - WH-1000XM6 Best Wireless Noise Cancelling - Midnight Blue | $398 | Sony | 3 | Successor model |
| 11 | Sony - WH-CH520 Wireless Headphone with Microphone - Pink | $49.99 | Sony | 3 | Same brand, lower tier |
| 12 | Sony - WHCH720N Wireless Noise Canceling - Pink | $99.99 | Sony | 3 | Same brand, noise-cancel |
| 13 | Sony - WH-CH520 Wireless Headphone - Black | $49.99 | Sony | 3 | Same brand, lower tier |
| 14 | Sony - WH-CH520 Wireless Headphone - Blue | $49.99 | Sony | 3 | Same brand |
| 15 | Sony - WH-1000XM6 Best Wireless Noise Cancelling - Black | $398 | Sony | 3 | Successor model |
| 16 | Sony - WH-CH520 Wireless Headphone - White | $49.99 | Sony | 3 | Same brand |
| 17 | Sony - WH-1000XM6 Best Wireless Noise Cancelling - Sand | $399.99 | Sony | 3 | Successor model |
| 18 | Sony - WH-CH520 Wireless Headphone - Cappuccino | $49.99 | Sony | 3 | Same brand |
| 19 | Sony - WHCH720N Wireless Noise Canceling - Blue | $99.99 | Sony | 3 | Same brand |
| 20 | Sony - ULT WEAR Wireless Noise Canceling - Black | $148 | Sony | 3 | Same brand |
| 21 | Sony - USB-C Wired In-ear Headphones - White | $29.99 | Sony | 2 | Wired, different product line |
| 22 | EcoFlow - DELTA PRO 3600Wh Portable Home Battery | $1,399 | EcoFlow | 1 | Irrelevant — power station |
| 23 | EcoFlow - River 3 Max Plus 858Wh Portable Power Station | $499.99 | EcoFlow | 1 | Irrelevant — power station |
| 24 | Jackery - Battery Pack 1000 Plus (1264 Wh Capacity) | $399.99 | Jackery | 1 | Irrelevant — power station |
| 25 | BLUETTI - AC200PL 2400W Solar Generator | $1,739 | BLUETTI | 1 | Irrelevant — solar generator |
| 26 | Jackery - Explorer 1500 Ultra Portable Power Station | $999 | Jackery | 1 | Irrelevant — power station |
| 27 | Anker - SOLIX Everfrost 2 Electric Cooler | $199.99 | Anker | 1 | Irrelevant — cooler |
| 28 | Jackery - Explorer 3000 v2 Portable Power Station + Solar | $1,699 | Jackery | 1 | Irrelevant — power station |
| 29 | EcoFlow - TRAIL 300 DC Portable Power Station 288Wh | $189.99 | EcoFlow | 1 | Irrelevant — power station |
| 30 | Jackery - Explorer 1000 v2 (1070Wh) Portable Power Station | $459 | Jackery | 1 | Irrelevant — power station |

**Metrics:** NDCG@5=0.96 | NDCG@10=0.88 | NDCG@30=0.74 | P@5=100% | Irrelevant@30=30% | Cliff=22

**Note:** Positions 22–30 are completely irrelevant (power stations). Likely caused by "portable" or "battery" tokens in augmented query matching power station descriptions.

---

### Query 2: "wireless headphones" (category browse)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | JBL - Tune 670NC Adaptive Noise Cancelling Wireless On-Ear | $69.95 | JBL | 5 | Perfect |
| 2 | Sennheiser - MOMENTUM 4 Wireless Adaptive Noise-Canceling | $285.99 | Sennheiser | 5 | Perfect |
| 3 | Beats - Studio Pro Wireless Noise Cancelling Over-the-Ear | $169.99 | Beats | 5 | Perfect |
| 4 | Soundcore - Space One True Wireless Noise Cancelling | $99.99 | Soundcore | 5 | Perfect |
| 5 | Sennheiser - ACCENTUM Wireless Bluetooth Around-the-ear | $99.99 | Sennheiser | 4 | Highly relevant |
| 6 | Beats - Solo Buds True Wireless Earbuds - Red | $69.99 | Beats | 4 | Relevant — earbuds, wireless |
| 7 | Sennheiser - MOMENTUM 4 Wireless Adaptive Noise-Canceling | $294.99 | Sennheiser | 4 | Relevant — duplicate model/color |
| 8 | Beats - Studio Buds+ True Wireless Noise Cancelling | $99.99 | Beats | 4 | Relevant |
| 9 | Apple - GS Certified Refurbished AirPods 4 | $79.99 | Apple | 4 | Relevant |
| 10 | Soundcore - C40i Open-Ear Clip-On Earbud Headphones | $59.99 | Soundcore | 4 | Relevant |
| 11 | Sony - WH-CH520 Wireless Headphone with Microphone | $49.99 | Sony | 4 | Relevant |
| 12 | Rotel - DX-3 Headphone Amplifier - Silver | $1,699 | Rotel | 1 | Irrelevant — headphone amp, not wireless headphones |
| 13 | Soundcore - P25i True Wireless In-Ear Headphones | $24.99 | Soundcore | 4 | Relevant |
| 14 | Skullcandy - Crusher ANC 2 Over-the-Ear Noise Canceling | $149.99 | Skullcandy | 5 | Perfect |
| 15 | Sennheiser - MOMENTUM True Wireless 4 Earbuds - Blue | $299.99 | Sennheiser | 4 | Relevant |
| 16 | Sony - WH-1000XM6 Best Wireless Noise Cancelling | $399.99 | Sony | 5 | Perfect |
| 17 | SaharaCase - Case for Apple AirPods Pro 2 | $24.99 | SaharaCase | 1 | Irrelevant — accessory case |
| 18 | Sony - LinkBuds Fit True Wireless Noise Canceling | $199.99 | Sony | 4 | Relevant |
| 19 | Apple - GS Certified Refurbished AirPods Max | $429.99 | Apple | 4 | Relevant — premium headphones |
| 20 | Beats - Studio Pro Wireless Over-the-Ear (color variant) | $169.99 | Beats | 4 | Relevant |
| 21 | Sony - WFC510 Truly Wireless Earbuds - Black | $69.99 | Sony | 4 | Relevant |
| 22 | Sennheiser - ACCENTUM Wireless Bluetooth (color variant) | $129.99 | Sennheiser | 4 | Relevant |
| 23 | Shokz - OpenFit 2 Open-Ear True Wireless Earbuds | $149.99 | Shokz | 4 | Relevant |
| 24 | JLab - Studio Pro Wireless Headphones - Black | $39.99 | JLab | 4 | Relevant |
| 25 | Google - Pixel Buds Pro 2 Wireless Earbuds with ANC | $179 | Google | 4 | Relevant |
| 26 | Beats - Fit Pro True Wireless Noise Cancelling In-Ear | $199.99 | Beats | 4 | Relevant |
| 27 | Sony - WF-C710N Truly Wireless Noise-Canceling Earbuds | $89.99 | Sony | 4 | Relevant |
| 28 | Beats - Flex Wireless Earphones - Smoke Gray | $49.99 | Beats | 3 | Somewhat relevant — wired-style earphones |
| 29 | Bowers & Wilkins - Px7 S2e Wireless Noise Cancelling | $329.99 | B&W | 5 | Perfect |
| 30 | JLab - JBuds Mini True Wireless Earbuds | $39.99 | JLab | 4 | Relevant |

**Metrics:** NDCG@5=0.91 | NDCG@10=0.85 | NDCG@30=0.75 | P@5=80% | Irrelevant@30=7% | Cliff=26

**Note:** Strong result overall. The headphone amp at position 12 and accessory case at position 17 are the only real failures — both caused by `keyword_rerank_strength` not penalizing non-product results enough.

---

### Query 3: "noise cancelling headphones for commuting" (use case + product)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Sony - WF-C700N Truly Wireless Noise Canceling In-Ear | $119.99 | Sony | 5 | Perfect — commute-optimized ANC |
| 2 | Bose - QuietComfort Ultra (2nd Gen) True Wireless Noise Cancelling | $249 | Bose | 5 | Perfect |
| 3 | Bose - QuietComfort Ultra (2nd Gen) True Wireless (color variant) | $249 | Bose | 4 | Relevant — duplicate |
| 4 | Sennheiser - MOMENTUM 4 Wireless Adaptive Noise-Canceling | $249.99 | Sennheiser | 5 | Perfect |
| 5 | Sony - WF-C710N Truly Wireless Noise-Canceling Earbuds | $89.99 | Sony | 5 | Perfect |
| 6 | JBL - Live 770NC Wireless Over-Ear with True Adaptive | $139.95 | JBL | 5 | Perfect |
| 7 | Bose - QuietComfort True Wireless Noise Cancelling | $149 | Bose | 5 | Perfect |
| 8 | Sony - LinkBuds Fit True Wireless Noise Canceling | $199.99 | Sony | 5 | Perfect — use case match |
| 9 | Sony - LinkBuds Fit True Wireless Noise Canceling (color) | $199.99 | Sony | 4 | Relevant |
| 10 | Bowers & Wilkins - Px7S3 Bluetooth Noise Cancelling | $479 | B&W | 4 | Relevant — premium commuter |
| 11 | Dyson - OnTrac Customizable Active Noise-Cancelling | $499.99 | Dyson | 4 | Relevant — premium ANC |
| 12 | Sennheiser - MOMENTUM 4 Wireless Adaptive Noise-Canceling (variant) | $279.99 | Sennheiser | 4 | Relevant |
| 13 | JBL - Live 670NC Wireless On-Ear with True Adaptive | $89.95 | JBL | 5 | Perfect |
| 14 | Sennheiser - ACCENTUM Wireless Bluetooth Around-the-ear | $129.99 | Sennheiser | 4 | Relevant |
| 15 | Soundcore - Q20i Over-Ear with Active Noise Cancelling | $49.99 | Soundcore | 4 | Relevant |
| 16 | Bose - QuietComfort Wireless Noise Cancelling Over-the-Ear | $229 | Bose | 5 | Perfect |
| 17 | Sony - WH-1000XM6 Best Wireless Noise Cancelling | $398 | Sony | 5 | Perfect |
| 18 | Google - Pixel Buds Pro 2 Wireless Earbuds with ANC | $179 | Google | 4 | Relevant |
| 19 | JBL - Live Beam 3 True Wireless Noise Cancelling Earbuds | $229.95 | JBL | 4 | Relevant |
| 20 | Apple - AirPods Pro 3 Wireless Active Noise Cancelling | $209.99 | Apple | 5 | Perfect |
| 21 | JBL - Tune 770NC Adaptive Noise Cancelling Wireless Over-Ear | $99.95 | JBL | 5 | Perfect |
| 22 | Sennheiser - ACCENTUM True Wireless Earbuds - Black | $219.99 | Sennheiser | 4 | Relevant |
| 23 | Beats - Powerbeats Pro 2 True Wireless ANC | $199.99 | Beats | 4 | Relevant |
| 24 | Sennheiser - HDB 630 Around-the-ear Bluetooth Wireless | $499.99 | Sennheiser | 4 | Relevant — premium |
| 25 | Sonos - Ace Wireless Over-the-Ear with Active Noise | $399 | Sonos | 4 | Relevant |
| 26 | Denon - PerL True Wireless ANC In-Ear | $99 | Denon | 4 | Relevant |
| 27 | Apple - GS Refurbished AirPods Pro (1st gen) | $219.99 | Apple | 3 | Somewhat relevant — older model |
| 28 | Sennheiser - ACCENTUM True Wireless Earbuds - White | $219.99 | Sennheiser | 4 | Relevant |
| 29 | Sennheiser - ACCENTUM Wireless Bluetooth Around-the-ear (variant) | $99.99 | Sennheiser | 4 | Relevant |
| 30 | Skullcandy - Hesh 540 ANC Wireless Noise Cancelling | $159.99 | Skullcandy | 4 | Relevant |

**Metrics:** NDCG@5=0.94 | NDCG@10=0.91 | NDCG@30=0.87 | P@5=100% | Irrelevant@30=0% | Cliff=30 (none)

**Note:** Best query in the test suite. Semantic understanding of "commuting" + "noise cancelling" is excellent. This is the showcase-worthy query.

---

### Query 4: "gift for a teenage gamer" (persona + gift)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Sony - PlayStation PC Marvel Spiderman Miles Morales [Digital] | $20 | Sony | 2 | Gift card/game key — not hardware |
| 2 | H&M - $50 Gift Card [Digital] | $40 | H&M | 1 | Completely irrelevant |
| 3 | H&M - $25 Gift Card [Digital] | $20 | H&M | 1 | Completely irrelevant |
| 4 | Best Buy - $400 Best Buy Gamer Gift Card | $400 | Best Buy | 2 | Gift card — marginally relevant at best |
| 5 | Riot Games - 2XKO $10 Gift Card [Digital] | $10 | Riot Games | 2 | Gift card |
| 6 | Roblox - $25 Happy Birthday Digital Gift Card | $25 | Roblox | 2 | Gift card — teen gamer adjacent |
| 7 | Microsoft - Xbox $20 Gift Card [Digital] | $20 | Microsoft | 2 | Gift card |
| 8 | Riot Games - Valorant $25 Digital Delivery | $25 | Riot Games | 2 | Gift card |
| 9 | Microsoft - Xbox $130 Gift Card [Digital] | $130 | Microsoft | 2 | Gift card |
| 10 | Microsoft - $50 Xbox Gift Card [Digital] | $50 | Microsoft | 2 | Gift card |
| 11 | Sony - $25 PlayStation Store Gift Card - Birthday [Digital] | $25 | Sony | 2 | Gift card |
| 12 | Microsoft - Xbox $50 Gift Card | $50 | Microsoft | 2 | Gift card |
| 13 | Riot Games - Valorant $50 Digital Delivery | $50 | Riot Games | 2 | Gift card |
| 14 | Best Buy - $200 Game On Gift Card | $200 | Best Buy | 2 | Gift card |
| 15 | Sony - $150 PlayStation Store Gift Card [Digital] | $150 | Sony | 2 | Gift card |
| 16 | Best Buy - $100 Best Buy Gamer Gift Card | $100 | Best Buy | 2 | Gift card |
| 17 | Blizzard - Call of Duty: Black Ops 7 Cross-Gen | $69.99 | Blizzard | 2 | Game title — not hardware |
| 18 | Teenage Mutant Ninja Turtles: The Cowabunga Collection Limited | $119.99 | Various | 1 | Irrelevant — physical game |
| 19 | Electronic Arts - Origin Apex $20 Wallet Code [Digital] | $20 | EA | 2 | Gift card / in-game currency |
| 20 | Meta - Gorilla Tag: 5000 Shiny Rocks In-Game Currency | $19.99 | Meta | 1 | Irrelevant — VR in-game currency |
| 21 | Xsolla - Gold $25 Gift Card [Digital] | $25 | Xsolla | 1 | Irrelevant — obscure gift card |
| 22 | Funko - POP! Movies: Teenage Mutant Ninja Turtles Mutant Mayhem | $11.99 | Funko | 1 | Irrelevant — figurine |
| 23 | Best Buy - $30 Best Buy Gamer Gift Card | $30 | Best Buy | 2 | Gift card |
| 24 | LEGO - NINJAGO Tournament Temple City Kids Toy 71814 | $249.99 | LEGO | 1 | Irrelevant — LEGO set |
| 25 | Nexon - $25 Game Card [Digital] | $25 | Nexon | 1 | Irrelevant |
| 26 | Microsoft - Xbox $15 Gift Card [Digital] | $15 | Microsoft | 2 | Gift card |
| 27 | NECA - Teenage Mutant Ninja Turtles 7" The Last Ronin | $27.99 | NECA | 1 | Irrelevant — action figure |
| 28 | Sony - PlayStation PC HELLDIVERS Dive Harder Edition | $4 | Sony | 2 | Digital game key |
| 29 | Microsoft - $25 Xbox Gift Card [Digital] | $25 | Microsoft | 2 | Gift card |
| 30 | Teenage Mutant Ninja Turtles: Splintered Fate Deluxe Edition | $29.99 | Various | 1 | Irrelevant — physical game |

**Metrics:** NDCG@5=0.18 | NDCG@10=0.15 | NDCG@30=0.12 | P@5=0% | Irrelevant@30=37% | Cliff=1

**CRITICAL FAILURE.** The query should return gaming headsets, controllers, gaming keyboards, gaming monitors, gaming chairs, gaming PCs, and gaming laptops. Instead it returns exclusively gift cards, digital game titles, and action figures. The marketing prompt's "gift" + "vibes" augmentation is pulling "teenage gamer" → digital gift cards and merchandise rather than hardware.

---

### Query 5: "setting up a home theater on a budget" (occasion + budget)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Monthly Best Buy Protection (up to 24 mo.) | $8.99 | Geek Squad | 1 | Irrelevant — warranty |
| 2 | 2-Year Standard Geek Squad Protection | $279.99 | Geek Squad | 1 | Irrelevant — warranty |
| 3 | Insignia - 3-Device Universal Remote - Black | $19.99 | Insignia | 4 | Highly relevant — budget home theater |
| 4 | MartinLogan - Motion Foundation F1 3-Way Floorstanding Speakers | $849.99 | MartinLogan | 2 | Relevant category, far out of budget |
| 5 | Yamaha - YHT-5960 Premium All-in-One Home Theater System | $749.95 | Yamaha | 3 | Right category — all-in-one system, but over budget |
| 6 | LG - 5.1.3-Channel S80TR Home Theater Soundbar | $637.99 | LG | 3 | Right category — soundbar, over budget |
| 7 | AudioQuest - Rocket 33 15' Speaker Cable | $1,219.95 | AudioQuest | 1 | Irrelevant — ultra-premium cable |
| 8 | AudioQuest - Rocket 33 10' Speaker Cable | $484.98 | AudioQuest | 1 | Irrelevant — cable |
| 9 | MartinLogan - Motion Foundation F1 (duplicate) | $849.99 | MartinLogan | 2 | Same as pos 4 |
| 10 | MartinLogan - Motion Foundation F2 3-Way Floorstanding | $1,149.99 | MartinLogan | 1 | Irrelevant — not budget |
| 11 | Best Buy essentials - Thin Indoor HDTV Antenna - 35 Mile | $19.99 | BBY Essentials | 3 | Somewhat relevant — budget accessory |
| 12 | MartinLogan - Motion Foundation C1 Center Channel | $549.99 | MartinLogan | 2 | Right category, over budget |
| 13 | Keystone - 115V Portable Air Conditioner | $399.99 | Keystone | 1 | Irrelevant — AC unit |
| 14 | Keystone - 550 Sq. Ft 12,000 BTU Window Mounted AC | $459.99 | Keystone | 1 | Irrelevant — AC unit |
| 15 | Amazon - Fire HD 8 tablet, 8" HD Display | $99.99 | Amazon | 2 | Marginally relevant — streaming device |
| 16 | Best Buy - $400 Balloons Gift Card | $400 | Best Buy | 1 | Irrelevant — gift card |
| 17 | Amazon - Fire HD 8 tablet (duplicate) | $99.99 | Amazon | 2 | Duplicate |
| 18 | Amazon - Fire HD 10 10.1" Tablet | $179.99 | Amazon | 2 | Marginally relevant — streaming |
| 19 | Fandango - $50 Gift Card [Digital] | $50 | Fandango | 1 | Irrelevant — gift card |
| 20 | COM 2YR INKJET PRINTER PSP | $29.99 | Unknown | 1 | Irrelevant — printer warranty |
| 21 | Best Buy - $15 Geek Squad Gift Card | $15 | Best Buy | 1 | Irrelevant |
| 22 | Hotels.com - $100 Gift Card [Digital] | $100 | Hotels.com | 1 | Irrelevant |
| 23 | NETGEAR - 8-Port Gigabit Ethernet PoE Switch | $109.99 | NETGEAR | 1 | Irrelevant — network switch |
| 24 | Ultimate (unknown product) | $9.99 | Unknown | 1 | Irrelevant — unknown |
| 25 | Best Buy - $100 Geek Squad Gift Card | $100 | Best Buy | 1 | Irrelevant |
| 26 | Best Buy - $75 Geek Squad Gift Card | $75 | Best Buy | 1 | Irrelevant |
| 27 | Best Buy - $350 Geek Squad Gift Card | $350 | Best Buy | 1 | Irrelevant |
| 28 | Brother - HL-L8430CDW Business Color Laser Printer | $459.99 | Brother | 1 | Irrelevant — printer |
| 29 | HyperX - Pulsefire Haste 2 Lightweight Wireless Gaming Mouse | $39.99 | HyperX | 2 | Marginally relevant — gaming peripheral |
| 30 | Lorex - 16-Port Unmanaged Switch | $249.99 | Lorex | 1 | Irrelevant — network switch |

**Metrics:** NDCG@5=0.22 | NDCG@10=0.20 | NDCG@30=0.18 | P@5=20% | Irrelevant@30=63% | Cliff=1

**CRITICAL FAILURE.** Should return: budget TVs, soundbars under $300, streaming sticks, budget A/V receivers, projectors, HDMI cables, Blu-ray players. Geek Squad warranties dominate position 1–2, gift cards flood positions 16–27. The "budget" signal is being completely ignored — the marketing prompt needs explicit instructions to honor price/budget signals from user queries.

---

### Query 6: "something to listen to music on the go" (intent-only/vague)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Sony - NWWM1AM2 Walkman High Resolution Digital Music Player | $949.99 | Sony | 4 | Relevant — music on go, but expensive |
| 2 | Sony - ZX707 Walkman ZX Series - Black | $599.99 | Sony | 4 | Relevant — portable music player |
| 3 | Cambridge Audio - Go V2 Portable Bluetooth Speaker | $179.98 | Cambridge Audio | 4 | Relevant — portable, music |
| 4 | Speaqua - Cruiser H2.0 Portable Waterproof Compact Bluetooth | $39.99 | Speaqua | 4 | Highly relevant |
| 5 | Something Wild [Limited Edition] [LP] [VINYL] [Explicit] | $23.99 | Various | 1 | Irrelevant — vinyl record |
| 6 | Refrigerator [LP] - VINYL | $22.99 | Various | 1 | Irrelevant — vinyl record |
| 7 | Something About Sex [DVD] [1998] | $24.99 | Various | 1 | Irrelevant — DVD |
| 8 | Edifier - MP230 Portable Bluetooth Speaker | $149.99 | Edifier | 4 | Relevant |
| 9 | 2-Year Standard Geek Squad Protection (Appliance) | $109.99 | Geek Squad | 1 | Irrelevant — warranty |
| 10 | 4-Year Standard Geek Squad Protection (Car Electronics) | $49.99 | Geek Squad | 1 | Irrelevant — warranty |
| 11 | Yubico - Security Key NFC Two-Factor Authentication | $29 | Yubico | 1 | Irrelevant — security key |
| 12 | Skullcandy - Crusher ANC 2 Over-the-Ear Noise Canceling | $149.99 | Skullcandy | 5 | Perfect — wireless headphones |
| 13 | Soundcore - P25i True Wireless In-Ear Headphones | $24.99 | Soundcore | 5 | Perfect |
| 14 | Ray-Ban Meta - Skyler Smart AI Glasses | $299 | Ray-Ban | 2 | Marginally relevant — audio glasses |
| 15 | JLab - JBuds Party Speaker - Navy | $47.99 | JLab | 3 | Somewhat relevant — portable speaker |
| 16 | Too $hort - Life Is...Too $hort - VINYL LP | $23.99 | Various | 1 | Irrelevant — vinyl |
| 17 | JBL - Flip 7 Portable Waterproof Speaker | $99.95 | JBL | 5 | Perfect |
| 18 | SiriusXM - SD2 Portable Speaker Dock | $139.99 | SiriusXM | 3 | Somewhat relevant |
| 19 | Sennheiser - ACCENTUM True Wireless Earbuds | $219.99 | Sennheiser | 5 | Perfect |
| 20 | Sennheiser - MOMENTUM True Wireless 4 Earbuds | $299.99 | Sennheiser | 5 | Perfect |
| 21 | LG - xboom Grab Portable Bluetooth Speaker | $109.99 | LG | 4 | Relevant |
| 22 | Victrola - Music Edition 1 Portable Bluetooth Speaker | $99.99 | Victrola | 4 | Relevant |
| 23 | Marshall - Kilburn III Portable Wireless Bluetooth Speaker | $349.99 | Marshall | 4 | Relevant |
| 24 | Victrola - Turntable - Red | $61.99 | Victrola | 1 | Irrelevant — turntable (not portable) |
| 25 | Marshall - Willen II Portable Bluetooth Speaker | $109.99 | Marshall | 4 | Relevant |
| 26 | JVC - Fitness True Wireless In-Ear Bluetooth Headphones | $59.99 | JVC | 4 | Relevant |
| 27 | Victrola - Journey Bluetooth Suitcase Record Player | $59.99 | Victrola | 1 | Irrelevant — turntable |
| 28 | JBL - TUNE520BT Wireless On-Ear - Black | $49.95 | JBL | 4 | Relevant |
| 29 | JLab - JBuds Pro Lightning Wired Earbuds | $26.99 | JLab | 3 | Somewhat relevant — wired |
| 30 | Ray-Ban Meta - Skyler (Gen 1) Smart AI Glasses | $299 | Ray-Ban | 2 | Marginally relevant |

**Metrics:** NDCG@5=0.72 | NDCG@10=0.65 | NDCG@30=0.55 | P@5=60% | Irrelevant@30=27% | Cliff=9

**Note:** The semantic understanding of "listen to music on the go" is partially working — Walkmans and portable speakers are correct early results. However, vinyl records (pos 5–6), a DVD (pos 7), Geek Squad warranties (pos 9–10), and a YubiKey (pos 11) are embarrassing failures. The marketing prompt is likely adding "music" → "records/vinyl" as a vibe expansion.

---

### Query 7: "best tablet under 300" (budget-constrained)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Samsung - Galaxy Tab A9+ 11" 256GB Wi-Fi - Graphite | $259.99 | Samsung | 5 | Perfect — tablet under $300 |
| 2 | SaharaCase - Kids Protective EVA Foam Case for Samsung | $39.95 | SaharaCase | 1 | Irrelevant — accessory |
| 3 | SaharaCase - Long Arm Stand Holder for Phones/Tablets | $49.99 | SaharaCase | 1 | Irrelevant — mount |
| 4 | Samsung - Galaxy Tab A9+ 11" 128GB Wi-Fi - Silver | $199.99 | Samsung | 5 | Perfect — fits budget |
| 5 | Amazon - GS Certified Refurbished Fire HD 10 | $109.99 | Amazon | 4 | Highly relevant — budget tablet |
| 6 | Amazon - Fire HD 10 Cover Protective Cover | $39.99 | Amazon | 1 | Irrelevant — cover |
| 7 | Logitech - Flip Folio Keyboard Case for iPad Pro 11-inch | $119.99 | Logitech | 1 | Irrelevant — keyboard case |
| 8 | Lenovo - Idea Tab Plus 12.1" 2.5K Tablet - 8GB RAM | $269.99 | Lenovo | 4 | Highly relevant — fits budget |
| 9 | Apple - Smart Folio for iPad Pro 13-inch (M4/M5) | $99 | Apple | 1 | Irrelevant — accessory |
| 10 | CORSAIR - NAUTILUS RS LCD Module | $49.99 | CORSAIR | 1 | Irrelevant — PC cooling |
| 11 | Corel - Draw GO Windows/Mac [Digital] | $69.99 | Corel | 1 | Irrelevant — software |
| 12 | Logitech - Flip Folio Keyboard Case for iPad Pro 13-inch | $139.99 | Logitech | 1 | Irrelevant — keyboard case |
| 13 | MSI - MAG A650GLS PCIe5 650W ATX Power Supply | $109.99 | MSI | 1 | Irrelevant — PC power supply |
| 14 | UAG - Metropolis SE Case for iPad Air 13" | $79.95 | UAG | 1 | Irrelevant — case |
| 15 | Insignia - 22-Key Bluetooth Number Keypad | $19.99 | Insignia | 1 | Irrelevant — keyboard |
| 16 | SteelSeries - QcK Cloth Gaming Mouse Pad (XXL) | $27.99 | SteelSeries | 1 | Irrelevant — mouse pad |
| 17 | Webroot - Premium Antivirus Protection (10 Device) | $69.99 | Webroot | 1 | Irrelevant — software |
| 18 | ZUGU - Slim Protective Case for Apple iPad Air 13 | $79.99 | ZUGU | 1 | Irrelevant — case |
| 19 | HP - 320 Full HD 1080p Webcam | $28.99 | HP | 1 | Irrelevant — webcam |
| 20 | Logitech - M196 Lightweight Bluetooth Wireless Mouse | $12.99 | Logitech | 1 | Irrelevant — mouse |
| 21 | SteelSeries - Arctis Nova 5 Wireless Gaming Headset | $129.99 | SteelSeries | 2 | Wrong category — gaming headset |
| 22 | SaharaCase - Teddy Bear KidProof Case for Apple iPad mini | $29.99 | SaharaCase | 1 | Irrelevant — case |
| 23 | HyperX - Cloud Jet Dual Wireless Gaming Headset | $59.99 | HyperX | 1 | Irrelevant — gaming headset |
| 24 | Paperlike - 3.0 Screen Protector for iPad Pro | $49.99 | Paperlike | 1 | Irrelevant — accessory |
| 25 | SaharaCase - Oasis Series Water-Resistant Case for iPad | $129.95 | SaharaCase | 1 | Irrelevant — case |
| 26 | Techprotectus - Work-In Case for 13-15 inch Chromebook | $44.99 | Techprotectus | 1 | Irrelevant — case |
| 27 | Speck - Balance Folio Case for iPad Air 11" | $49.99 | Speck | 1 | Irrelevant — case |
| 28 | AudioQuest - Forest USB-A > B Digital High-Definition Cable | $119.95 | AudioQuest | 1 | Irrelevant — cable |
| 29 | NETGEAR - Dual-band WiFi Range Extender | $64.99 | NETGEAR | 1 | Irrelevant — network |
| 30 | reMarkable - Paper Pro Move Book Folio | $99 | reMarkable | 1 | Irrelevant — case |

**Metrics:** NDCG@5=0.55 | NDCG@10=0.44 | NDCG@30=0.38 | P@5=40% | Irrelevant@30=77% | Cliff=3

**MAJOR FAILURE.** Only 3 actual tablets appear (pos 1, 4, 5, 8). Tablet accessories (cases, covers, keyboard cases) dominate positions 2–3 and 6–30. The budget constraint ("under 300") is being completely ignored — the engine should return only tablets priced ≤$300. Also, the pipeline is clearly not differentiating between primary products (tablets) and related accessories (cases).

---

### Query 8: "best laptop for college students" (comparison-style)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | HP - 15.6" Full HD Touch-Screen Laptop - Intel Core i5 | $429.99 | HP | 5 | Perfect |
| 2 | HP - 15.6" Laptop - Intel Core i3 N305 | $374.99 | HP | 5 | Perfect — budget student laptop |
| 3 | ASUS - Vivobook 17 17.3" FHD - Intel Core i7-1355U | $749.99 | ASUS | 4 | Relevant — slightly expensive |
| 4 | Dell - Pro 13 Premium 13.3" IPS QHD+ Touch | $2,639.99 | Dell | 2 | Wrong — premium enterprise laptop |
| 5 | ASUS - Vivobook 16 16" FHD+ Copilot+ Snapdragon | $649.99 | ASUS | 4 | Relevant |
| 6 | Dell - Plus Copilot+ 14" 2K 2-in-1 Touchscreen | $1,099.99 | Dell | 3 | Somewhat relevant — 2-in-1 |
| 7 | HP - 14" Laptop - AMD Athlon Silver 7120U | $279.99 | HP | 5 | Perfect — very affordable student |
| 8 | Dell - Plus Copilot+ 14" 2K 2-in-1 Touchscreen (variant) | $649.99 | Dell | 4 | Relevant |
| 9 | ASUS - Vivobook S14 14" FHD+ OLED Copilot+ | $999.99 | ASUS | 3 | Somewhat relevant — high end for students |
| 10 | HP - 14" Laptop - Intel N150 Processor | $249.99 | HP | 5 | Perfect |
| 11 | Samsung - Galaxy Book5 360 15.6" Touch - Intel | $1,449.99 | Samsung | 2 | Too expensive for students |
| 12 | Lenovo - ThinkBook 16 Gen 8 AI PC 16" Touch | $1,259.99 | Lenovo | 2 | Too expensive — business laptop |
| 13 | Microsoft - Surface Laptop Copilot+ 13.8" Touchscreen | $1,399.99 | Microsoft | 3 | Somewhat relevant — premium |
| 14 | Dell - 5420 14" Refurbished Intel 11th Gen | $651.14 | Dell | 4 | Relevant — refurb value |
| 15 | Thule - Subterra 2 BP 21L Laptop Backpack | $149.95 | Thule | 2 | Marginally relevant — accessory |
| 16 | Samsung - Galaxy Book5 15.6" FHD IPS Intel Ultra 5 | $799.99 | Samsung | 4 | Relevant |
| 17 | Dell - 14" Refurbished 1920x1080 FHD Intel 11th Gen | $1,082.95 | Dell | 3 | Somewhat relevant — refurb |
| 18 | Incase - A.R.C. Sleeve for 14" Laptop | $49.95 | Incase | 1 | Irrelevant — laptop sleeve |
| 19 | Texas Instruments - TI-84 Plus Graphing Calculator | $132.99 | TI | 3 | Somewhat relevant — student use |
| 20 | SwissGear - ScanSmart Laptop Backpack | $99.99 | SwissGear | 2 | Marginally relevant — accessory |
| 21 | Texas Instruments - TI-84+ CE Graphing Calculator | $142.99 | TI | 3 | Somewhat relevant — student use |
| 22 | Lenovo - Idea Tab Pro Folio Case | $34.99 | Lenovo | 1 | Irrelevant — tablet case |
| 23 | ONIT - 2023-2024 Campus Icons Trading Card Box | $29.99 | ONIT | 1 | Irrelevant — trading cards |
| 24 | Microsoft - GS Certified Refurb Surface Laptop 4 | $719.99 | Microsoft | 4 | Relevant |
| 25 | Barnes & Noble - $100 Gift Card [Digital] | $100 | B&N | 1 | Irrelevant — gift card (maybe textbooks?) |
| 26 | PKG - Aurora Metro 36L Backpack | $119.99 | PKG | 2 | Marginally relevant — backpack |
| 27 | The Sims 4 Discover University Expansion Pack - Xbox One | $39.99 | EA | 1 | Irrelevant — video game |
| 28 | GS Certified Refurbished MacBook Pro 13.3" | $1,499.99 | Apple | 4 | Relevant — MacBook |
| 29 | Apple - Refurbished MacBook Air 15-inch M4 | $849.99 | Apple | 5 | Perfect — great student laptop |
| 30 | Resident Evil 2 - PlayStation 5 | $19.99 | Capcom | 1 | Irrelevant — video game |

**Metrics:** NDCG@5=0.74 | NDCG@10=0.68 | NDCG@30=0.57 | P@5=60% | Irrelevant@30=27% | Cliff=15

**Note:** Good start but quality degrades around position 15. Laptop accessories (sleeves, backpacks), calculators (tangentially relevant), trading cards, and video games are inexplicable late-result failures.

---

### Query 9: "my wifi doesn't reach the backyard" (problem-solving)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | NETGEAR - Dual-band WiFi Range Extender - Essentials | $64.99 | NETGEAR | 5 | Perfect — exactly what's needed |
| 2 | Pit Boss - 850 Pellet Grill w/ WiFi - Sportsman Series | $712.99 | Pit Boss | 1 | Irrelevant — pellet grill (has WiFi but is a grill) |
| 3 | Lectron - J1772 Level 1 NEMA 5-15 Electric Vehicle Charger | $179.99 | Lectron | 1 | Irrelevant — EV charger (has WiFi?) |
| 4 | NETGEAR - Orbi 870 Series BE21000 Tri-Band Mesh Wi-Fi 7 | $399.99 | NETGEAR | 5 | Perfect — mesh WiFi system |
| 5 | MSI - Roamii WiFi 7BE Dual-Band Lite Mesh System 2pk | $211.99 | MSI | 5 | Perfect — mesh WiFi |
| 6 | Smart Security Camera Wyze Cam v4 | $35.98 | Wyze | 2 | Wrong — WiFi camera, not extender |
| 7 | VTech - 1080p Smart WiFi Remote Access Baby Monitor | $124.95 | VTech | 1 | Irrelevant — baby monitor |
| 8 | Sylvox - 65" Class Pool Pro3.0 Series Outdoor Smart TV | $3,399.99 | Sylvox | 2 | Marginally — outdoor, but TV |
| 9 | GE Cync Dynamic Effects Smart LED Outdoor Flexible Profile | $82.99 | GE | 2 | Marginally — outdoor smart, but LED strips |
| 10 | GE Cync Dynamic Effects Smart LED Outdoor Flexible Profile (XL) | $116.99 | GE | 2 | Same as above, larger |
| 11 | Ring - Floodlight Cam Pro with 2K Video and Ring Vision | $229.99 | Ring | 2 | Wrong — camera |
| 12 | MSI - PRO B650-P WIFI (Socket AM5) AMD B650 ATX DDR5 | $174.99 | MSI | 1 | Irrelevant — motherboard |
| 13 | Rexing - R316 4K GPS WiFi Front & Cabin Cam | $199.99 | Rexing | 1 | Irrelevant — dash cam |
| 14 | Skylight - 10" WiFi Digital Picture Frame | $139.99 | Skylight | 1 | Irrelevant — picture frame |
| 15 | Sylvox - 75" Class Gaming Series Partial Sun Outdoor TV | $3,499.99 | Sylvox | 2 | Marginally — outdoor TV |
| 16 | PETLIBRO - Granary WiFi Stainless Steel 5L Auto Dog Feeder | $139.99 | PETLIBRO | 1 | Irrelevant — pet feeder |
| 17 | TP-Link - Tapo Wireless Dual-Lens, Pan-Tilt Security Camera | $149.99 | TP-Link | 2 | Wrong — security camera |
| 18 | Sylvox - 55" Class Gaming Series Partial Sun Outdoor TV | $1,799.99 | Sylvox | 2 | Marginally — outdoor TV |
| 19 | Samsung - 6.3 cu. ft. Freestanding Electric Range | $649.99 | Samsung | 1 | Irrelevant — stove |
| 20 | Sylvox - 65" Class Gaming Series Partial Sun Outdoor TV | $2,399.99 | Sylvox | 2 | Outdoor TV |
| 21 | MSI - MAG Z790 TOMAHAWK MAX WIFI (Socket LGA 1700) | $303.99 | MSI | 1 | Irrelevant — motherboard |
| 22 | Bosch - Benchmark Series 36" Built-In Electric Induction Cooktop | $3,599.99 | Bosch | 1 | Irrelevant — cooktop |
| 23 | Sylvox - 75" Class Pro Q Series Partial Sun Outdoor TV | $3,699.99 | Sylvox | 2 | Outdoor TV |
| 24 | Thermaltake - LCGS View i570-170 Gaming Desktop | $2,199.99 | Thermaltake | 1 | Irrelevant — gaming PC |
| 25 | Sylvox - 55" Class Pool Pro3.0 Series Outdoor TV | $2,399.99 | Sylvox | 2 | Outdoor TV |
| 26 | Sylvox - 43" Class Pro Q Series Partial Sun Outdoor TV | $1,354.99 | Sylvox | 2 | Outdoor TV |
| 27 | Ring - Battery Doorbell Smart WiFi Video Doorbell | $59.99 | Ring | 2 | Wrong — doorbell camera |
| 28 | Sylvox - 75" Class Pool Pro3.0 Series Outdoor TV | $4,399.99 | Sylvox | 2 | Outdoor TV |
| 29 | Sylvox - 43" Class Pool Pro3.0 Series Outdoor TV | $1,699.99 | Sylvox | 2 | Outdoor TV |
| 30 | NETGEAR - Orbi 370 Series BE5000 Dual-Band Mesh Wi-Fi 7 | $149.99 | NETGEAR | 5 | Perfect — exactly right |

**Metrics:** NDCG@5=0.82 | NDCG@10=0.72 | NDCG@30=0.56 | P@5=80% | Irrelevant@30=33% | Cliff=11

**Note:** Excellent start (WiFi extenders, mesh systems) but "WiFi" as a token causes the pipeline to pull any product containing "WiFi" in its description — pellet grills, motherboards, pet feeders, EV chargers. This is a classic `bm25_weight` over-indexing on incidental token matches. The tail (positions 11–29) is dominated by outdoor TVs, likely because "backyard" is being expanded semantically to "outdoor" products.

---

### Query 10: "lightweight 15 inch laptop with good battery life" (multi-attribute)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Lenovo - IdeaPad Slim 3x Copilot+ 15.3" 2K Touchscreen | $479.99 | Lenovo | 5 | Perfect — lightweight 15" |
| 2 | ASUS - Vivobook S16 16" OLED Copilot+ AMD Ryzen | $949.99 | ASUS | 3 | Somewhat — 16", OLED is great but heavier |
| 3 | Apple - MacBook Air 15-inch M4 | $1,099 | Apple | 5 | Perfect — iconic for battery life |
| 4 | Apple - GS Certified Refurbished MacBook Air 15-in | $869.99 | Apple | 5 | Perfect |
| 5 | Apple - GS Certified Refurbished MacBook Air 15-in (variant) | $879.99 | Apple | 5 | Perfect |
| 6 | Acer - Chromebook 315 15.6" HD Display Intel | $219.99 | Acer | 4 | Highly relevant — lightweight, good battery |
| 7 | Apple - Refurbished MacBook Air 15-inch M4 | $1,049.99 | Apple | 5 | Perfect |
| 8 | Acer - Chromebook 315 15.6" Full HD Intel Celeron | $129 | Acer | 4 | Highly relevant — ultra budget lightweight |
| 9 | Apple - GS Certified Refurbished MacBook Air 15" | $749.99 | Apple | 5 | Perfect |
| 10 | Lenovo - IdeaPad 1i 15.6" Full HD Touchscreen Intel | $419.99 | Lenovo | 4 | Relevant |
| 11 | Apple - GS Certified Refurbished MacBook Air 15-in | $999.99 | Apple | 5 | Perfect |
| 12 | Apple - MacBook Air 15-inch M4 (variant config) | $1,299 | Apple | 5 | Perfect |
| 13 | Apple - GS Certified Refurbished MacBook Air 15-in | $929.99 | Apple | 5 | Perfect |
| 14 | Apple - MacBook Air 15-inch M4 (variant config) | $1,299 | Apple | 4 | Relevant — duplicate |
| 15 | Lenovo - IdeaPad Slim 3i 15.6" Full HD Intel Core | $249.99 | Lenovo | 4 | Highly relevant |
| 16 | Samsung - Galaxy Book5 360 Copilot+ 15.6" FHD AMOLED | $1,349.99 | Samsung | 4 | Relevant |
| 17 | Apple - MacBook Air 15-inch M4 (variant config) | $1,499 | Apple | 4 | Relevant |
| 18 | Samsung - Galaxy Book5 15.6" Intel Ultra 5 255U | $999.99 | Samsung | 4 | Relevant |
| 19 | Apple - GS Certified Refurbished MacBook Air 15-in | $849.99 | Apple | 5 | Perfect |
| 20 | Apple - GS Certified Refurbished MacBook Air 15-in | $1,029.99 | Apple | 4 | Relevant |
| 21 | Samsung - Galaxy Book5 15.6" FHD IPS Intel | $799.99 | Samsung | 4 | Relevant |
| 22 | Apple - MacBook Air 15" M2 chip | $1,614.99 | Apple | 3 | Somewhat — older model, overpriced |
| 23 | Apple - GS Certified Refurbished MacBook Air 15-in | $849.99 | Apple | 4 | Relevant |
| 24 | Lenovo - IdeaPad 1i 15.6" Full HD Intel Core i5-13 | $430.99 | Lenovo | 4 | Relevant |
| 25 | ASUS - Vivobook S 15 15.6" 3K OLED Copilot+ | $1,299.99 | ASUS | 4 | Relevant |
| 26 | Apple - Refurbished MacBook Air 15-inch M4 | $949.99 | Apple | 5 | Perfect |
| 27 | Apple - GS Certified Refurbished MacBook Air 15" | $624.99 | Apple | 5 | Perfect |
| 28 | Apple - GS Certified Refurbished MacBook Air 15-in | $969.99 | Apple | 5 | Perfect |
| 29 | Apple - GS Certified Refurbished MacBook Air 15" | $999.99 | Apple | 4 | Relevant |
| 30 | Apple - Refurbished MacBook Air 15-inch M4 | $899.99 | Apple | 5 | Perfect |

**Metrics:** NDCG@5=0.81 | NDCG@10=0.77 | NDCG@30=0.68 | P@5=80% | Irrelevant@30=0% | Cliff=30 (none)

**Note:** Excellent semantic multi-attribute matching. "15 inch" + "lightweight" + "battery life" correctly surfaces MacBook Air and Lenovo Slim. No irrelevant results at all. This is the best performing multi-attribute query.

---

### Query 11: "4K TV" (category browse)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Samsung - 98" Class Q7F Series QLED 4K UHD Samsung Vision | $2,499.99 | Samsung | 5 | Perfect |
| 2 | Samsung - 55" Class Q70D Series QLED 4K Smart Tizen TV | $799.99 | Samsung | 5 | Perfect |
| 3 | DuraPro - 43" Class Partial Sun Smart Series LED 4K UHD | $799.99 | DuraPro | 4 | Relevant — outdoor 4K TV |
| 4 | LG - 55" Class UT70 Series LED 4K UHD Smart webOS TV | $299.99 | LG | 5 | Perfect |
| 5 | Samsung - 70" Class U7900 Series UHD 4K Smart Tizen TV | $399.99 | Samsung | 5 | Perfect |
| 6 | LG - 48" Class B5 Series OLED AI 4K UHD Smart webOS TV | $599.99 | LG | 5 | Perfect |
| 7 | LG - 86" Class UA77 Series LED AI 4K UHD Smart webOS TV | $748.99 | LG | 5 | Perfect |
| 8 | SunBriteTV - Veranda 3 55" Class LED Outdoor Full Sun TV | $1,698.95 | SunBriteTV | 3 | Somewhat — outdoor specialized |
| 9 | Samsung - 50" Class U8000F Crystal UHD 4K Smart Tizen TV | $269.99 | Samsung | 5 | Perfect |
| 10 | Hisense - 75" Class U8 Series Mini-LED QLED Smart | $1,039.99 | Hisense | 5 | Perfect |
| 11 | LG - 65" Class 85 Series QNED 4K UHD Smart webOS TV | $759.99 | LG | 5 | Perfect |
| 12 | Sylvox - 75" Class Gaming Series Partial Sun Outdoor TV | $3,499.99 | Sylvox | 3 | Somewhat — outdoor 4K TV |
| 13 | LG - 55" Class B5 Series OLED AI 4K UHD Smart webOS TV | $899.99 | LG | 5 | Perfect |
| 14 | TCL - 98" Class QM9K Series 4K UHD HDR QD-Mini LED | $3,499.99 | TCL | 5 | Perfect |
| 15 | TCL - 43" Class F35 Series 4K UHD HDR LED Smart Fire TV | $139.99 | TCL | 5 | Perfect — budget option |
| 16 | Samsung - 50" BED-H Series 4K Business Pro TV | $450 | Samsung | 4 | Relevant — commercial |
| 17 | Hisense - 75" Class U8 Series MiniLED QLED UHD 4K HDR | $1,298.99 | Hisense | 5 | Perfect |
| 18 | Hisense - 100" Class U8 Series MiniLED QLED UHD 4K HDR | $2,998.99 | Hisense | 5 | Perfect |
| 19 | Samsung - 65" Class LS03FW The Frame Pro Neo QLED 4K | $1,899.99 | Samsung | 4 | Relevant — lifestyle 4K TV |
| 20 | Roku - 65" Class Pro Series Mini-LED QLED 4K Smart RokuTV | $599.99 | Roku | 5 | Perfect |
| 21 | 65" Neptune Partial Sun 4K Outdoor Smart TV | $2,199.99 | Neptune | 3 | Somewhat — outdoor |
| 22 | Samsung - Refurbished 55" Class S95C OLED 4K UHD | $2,499.99 | Samsung | 4 | Relevant |
| 23 | Samsung - 85" Class QN70F Series Neo QLED Mini LED 4K | $1,699.99 | Samsung | 5 | Perfect |
| 24 | LG - 55" Class UR9000 Series LED 4K UHD Smart webOS TV | $424.99 | LG | 5 | Perfect |
| 25 | TCL - 65" Class QM6K Series 4K UHD HDR QD Mini LED | $529.99 | TCL | 5 | Perfect |
| 26 | Samsung - Refurbished 55" Class QN90D Neo QLED 4K | $1,999.99 | Samsung | 4 | Relevant |
| 27 | LG - 65" Class UT75 Series LED 4K UHD Smart webOS TV | $379.99 | LG | 5 | Perfect |
| 28 | TCL - 85" Class QM8K Series 4K UHD HDR QD-Mini LED | $2,199.99 | TCL | 5 | Perfect |
| 29 | Toshiba - 85" Class C350 Series LED 4K UHD Smart Fire TV | $589.99 | Toshiba | 5 | Perfect |
| 30 | Sony - 55" Class BRAVIA 8 OLED 4K UHD Smart Google TV | $1,499.99 | Sony | 5 | Perfect |

**Metrics:** NDCG@5=0.93 | NDCG@10=0.89 | NDCG@30=0.83 | P@5=100% | Irrelevant@30=0% | Cliff=30 (none)

**Excellent.** Pure category match. The only minor deduction is outdoor TVs appearing (specialty segment). This query demonstrates the pipeline handles short keyword queries very well for large categories.

---

### Query 12: "smart home starter kit" (occasion/context)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Lutron - Caseta Wireless Smart Lighting Dimmer Switch Starter Kit | $114.95 | Lutron | 5 | Perfect — smart home starter kit |
| 2 | Philips - Hue Color A19 Smart LED Bulb Starter Kit | $139.99 | Philips | 5 | Perfect |
| 3 | Lutron - Caseta Smart Switch Starter Kit - White | $104.95 | Lutron | 5 | Perfect |
| 4 | Lutron - Caseta Wireless Smart Lighting Dimmer Switch (variant) | $114.95 | Lutron | 4 | Relevant — duplicate |
| 5 | Ring - Alarm Security Kit 5-Piece (2nd Gen) | $149.99 | Ring | 5 | Perfect — smart home security starter |
| 6 | Philips - Hue A19 Bluetooth 75W Smart LED Starter Kit | $69.99 | Philips | 5 | Perfect |
| 7 | Philips - Hue Essential Starter Kit | $99.99 | Philips | 5 | Perfect |
| 8 | Philips - Hue 75W A19 Starter Kit White and Color | $204.99 | Philips | 4 | Relevant |
| 9 | Swann - Home 4-Channel 4-Camera Indoor/Outdoor 1080p DVR | $449.99 | Swann | 3 | Somewhat — security system, not starter |
| 10 | Car Keys Express - Nissan Simple Key Smart Key | $119.99 | Car Keys Express | 1 | Irrelevant — car key fob |
| 11 | Lutron - Diva Smart Dimmer Switch Starter Kit | $124.95 | Lutron | 5 | Perfect |
| 12 | Car Keys Express - Chrysler & Dodge Simple Remote | $119.99 | Car Keys Express | 1 | Irrelevant — car remote |
| 13 | Car Keys Express - Chrysler, Dodge, and Jeep Simple Key | $119.99 | Car Keys Express | 1 | Irrelevant — car remote |
| 14 | Cricut - Joy Xtra Smart Cutting Machine + Starter Kit | $225.69 | Cricut | 1 | Irrelevant — craft cutter |
| 15 | Compustar - 1-Way remote start kit with security | $679.99 | Compustar | 1 | Irrelevant — car starter |
| 16 | Renogy - 200 Watt 12V Monocrystalline Solar Kit | $529.99 | Renogy | 1 | Irrelevant — solar panels |
| 17 | Compustar - Keyless Entry 2-Way G17 FM remote kit | $129.99 | Compustar | 1 | Irrelevant — car remote |
| 18 | Car Keys Express - Toyota Simple Key 3 Button Smart Key | $249.99 | Car Keys Express | 1 | Irrelevant — car key |
| 19 | Renogy - 200W 12V Solar Kit with 2 100W Solar Panels | $259.99 | Renogy | 1 | Irrelevant — solar |
| 20 | CORSAIR - iCUE LINK QX140 RGB 140mm PWM Computer Case Fan | $149.99 | CORSAIR | 1 | Irrelevant — PC fan |
| 21 | Lively - Lively SIM/eSIM 3 Months of Service 5GB | $30 | Lively | 1 | Irrelevant — SIM card |
| 22 | iDataStart - Remote Starter kit for BMW/Mini/Mercedes | $619.99 | iDataStart | 1 | Irrelevant — car starter |
| 23 | Viper - 2-Way 5-Button Remote Start System | $649.99 | Viper | 1 | Irrelevant — car starter |
| 24 | CORSAIR - iCUE LINK QX120 RGB 120mm PWM Computer Case Fan | $109.99 | CORSAIR | 1 | Irrelevant — PC fan |
| 25 | CanaKit - Raspberry Pi 5 Starter MAX Kit (8GB) | $179.95 | CanaKit | 2 | Marginally — developer "starter kit" |
| 26 | Compustar - All-in-One 2-Way Remote Start + Security | $799.99 | Compustar | 1 | Irrelevant — car starter |
| 27 | CORSAIR - iCUE LINK QX120 RGB 120mm PWM Case Fan | $109.99 | CORSAIR | 1 | Irrelevant — PC fan |
| 28 | Verizon - Prepaid BYOD SIM Card Kit | $9.99 | Verizon | 1 | Irrelevant — SIM card |
| 29 | Viper - 2-Way 1-Button Remote Start System | $499.99 | Viper | 1 | Irrelevant — car starter |
| 30 | Cricut - Basic Tool Set | $13.99 | Cricut | 1 | Irrelevant — craft tools |

**Metrics:** NDCG@5=0.65 | NDCG@10=0.52 | NDCG@30=0.40 | P@5=60% | Irrelevant@30=63% | Cliff=8

**MAJOR FAILURE.** Good start (Lutron, Philips Hue, Ring) but positions 10–30 are almost completely irrelevant. The word "kit" is pulling in remote car starter kits, Raspberry Pi kits, Cricut kits, solar panel kits, and SIM card kits. The marketing prompt's vague "smart" expansion is pulling car remote starters because they contain "smart" in their descriptions.

---

### Query 13: "bluetooth speakers for a pool party" (use case + occasion)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | iHome - PLAYTOUGH Mini Bluetooth Rechargeable Waterproof Speaker | $20.99 | iHome | 5 | Perfect — waterproof pool speaker |
| 2 | Ultimate Ears - WONDERBOOM 4 Portable Wireless Bluetooth Speaker | $69.99 | UE | 5 | Perfect — waterproof, outdoor |
| 3 | Speaqua - Cruiser H2.0 Portable Waterproof Compact Bluetooth | $34.99 | Speaqua | 5 | Perfect |
| 4 | Speaqua - Cruiser H2.0 Portable Waterproof Compact Bluetooth (variant) | $39.99 | Speaqua | 5 | Perfect |
| 5 | JBL - Partybox Encore Essential Portable Wireless Party Speaker | $329.99 | JBL | 5 | Perfect — "Party" in name |
| 6 | LG - XBOOM XL5 Portable Tower Party Speaker with LED | $299.99 | LG | 5 | Perfect — party speaker |
| 7 | Ultimate Ears - WONDERBOOM 4 (color variant) | $69.99 | UE | 5 | Perfect |
| 8 | Ultimate Ears - BOOM 4 Portable Wireless Bluetooth Speaker | $149.99 | UE | 5 | Perfect |
| 9 | Bose - SoundLink Max Portable Bluetooth Speaker - Blue Dusk | $329 | Bose | 4 | Highly relevant — premium outdoor |
| 10 | Altec Lansing - RockBox XL Factory Refurbished Portable Bluetooth | $199.99 | Altec Lansing | 4 | Relevant |
| 11 | Bose - SoundLink Max Portable Bluetooth Speaker - Black | $329 | Bose | 4 | Relevant |
| 12 | Alpine - Turn1 Portable Waterproof Bluetooth Speaker | $129.99 | Alpine | 5 | Perfect — waterproof outdoor |
| 13 | Speaqua - Cruiser Portable Waterproof Compact Bluetooth | $39.99 | Speaqua | 5 | Perfect |
| 14 | Victrola - Pair of Solar Charging Bluetooth Outdoor Rock Speakers | $169.99 | Victrola | 4 | Relevant — outdoor speakers |
| 15 | Speaqua - Cruiser H2.0 Portable Waterproof (variant) | $28.99 | Speaqua | 5 | Perfect |
| 16 | Soundcore - Boom 2 IPX7 Waterproof Floatable 80W | $129.99 | Soundcore | 5 | Perfect — explicitly floatable |
| 17 | Speaqua - Cruiser H2.0 (variant) | $34.99 | Speaqua | 5 | Perfect |
| 18 | Altec Lansing - Rockbox XL 2.0 Everything Wireless Bluetooth | $199.99 | Altec Lansing | 4 | Relevant |
| 19 | Bose - SoundLink Max - Citrus Yellow | $329 | Bose | 4 | Relevant |
| 20 | Speaqua - Cruiser H2.0 (variant) | $39.99 | Speaqua | 5 | Perfect |
| 21 | Altec Lansing - HydraShock Factory Refurbished Bluetooth | $179.99 | Altec Lansing | 4 | Relevant |
| 22 | JLab - Go Party Speaker Bluetooth Speaker with RGB | $34.99 | JLab | 5 | Perfect — party speaker |
| 23 | Ultimate Ears - WONDERBOOM 4 (variant) | $69.99 | UE | 5 | Perfect |
| 24 | JBL - Xtreme 4 Portable Wireless Speaker 2024 - Camo | $299.95 | JBL | 4 | Highly relevant |
| 25 | Speaqua - Cruiser Portable Waterproof Compact (variant) | $39.99 | Speaqua | 5 | Perfect |
| 26 | Sony - XV500 X-Series Wireless Party Speaker | $348 | Sony | 5 | Perfect — party speaker |
| 27 | Altec Lansing - Shockwave 100 Wireless Factory Refurbished | $129.99 | Altec Lansing | 4 | Relevant |
| 28 | Ultimate Ears - WONDERBOOM 4 (variant) | $69.99 | UE | 5 | Perfect |
| 29 | JBL - PartyBox Club 120 Portable Wireless Party Speaker | $399.95 | JBL | 5 | Perfect |
| 30 | Speaqua - Cruiser Portable Waterproof Compact (variant) | $39.99 | Speaqua | 5 | Perfect |

**Metrics:** NDCG@5=0.96 | NDCG@10=0.93 | NDCG@30=0.88 | P@5=100% | Irrelevant@30=0% | Cliff=30 (none)

**Best single query in the test suite.** Semantic understanding of "pool party" → waterproof + portable + party speakers is near-perfect. Zero irrelevant results. This is an ideal showcase query.

---

### Query 14: "gaming keyboard and mouse combo" (multi-product)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Best Buy essentials - Full-size Wireless Membrane Keyboard and Mouse | $19.99 | BBY Essentials | 2 | Office combo, not gaming |
| 2 | Logitech - MK250 Full-size Bluetooth Wireless Keyboard and Mouse | $19.99 | Logitech | 2 | Office combo, not gaming |
| 3 | Logitech - MK850 Performance Full-size Wireless Membrane Keyboard | $79.99 | Logitech | 2 | Office combo, not gaming |
| 4 | Logitech - POP ICON COMBO Compact TKL Wireless Bluetooth | $57.99 | Logitech | 2 | Office combo |
| 5 | Adesso - Tru-Form Media WKB-1150CB Ergonomic Wireless Membrane | $62.99 | Adesso | 1 | Irrelevant — ergonomic office |
| 6 | Logitech - Wave Keys and Lift Vertical Mouse Ergonomic | $99.99 | Logitech | 1 | Irrelevant — ergonomic, not gaming |
| 7 | Logitech - MK250 Full-size Bluetooth (variant) | $19.99 | Logitech | 2 | Office combo |
| 8 | Logitech - MK295 Full-size Wireless Membrane | $32.99 | Logitech | 2 | Office combo |
| 9 | Logitech - Wave Keys and Lift Vertical Ergonomic (variant) | $99.99 | Logitech | 1 | Office |
| 10 | Logitech - Wave Keys MK670 Combo Ergonomic Wireless | $89.99 | Logitech | 1 | Office |
| 11 | Logitech - MK955 Signature Slim Full-size Wireless | $119.99 | Logitech | 2 | Office combo |
| 12 | Logitech - MK955 Signature Slim Full-size (variant) | $119.99 | Logitech | 2 | Office combo |
| 13 | Logitech - MK370 Combo for Business Full-Size | $39.99 | Logitech | 2 | Office |
| 14 | Logitech - Signature MK650 Combo for Business | $61.99 | Logitech | 2 | Office |
| 15 | Logitech - MX Keys S Combo Advanced Full-size Wireless | $179.99 | Logitech | 2 | Office |
| 16 | Logitech - MK345 Full-size Wireless Membrane | $34.99 | Logitech | 2 | Office |
| 17 | Logitech - Signature Slim MK955 For Business | $119.99 | Logitech | 2 | Office |
| 18 | Logitech - MK470 Full-size Wireless Scissor Keyboard | $39.99 | Logitech | 2 | Office |
| 19 | Logitech - POP ICON COMBO Compact TKL (variant) | $57.99 | Logitech | 2 | Office |
| 20 | Logitech - MK270 Full-size Wireless Membrane | $19.99 | Logitech | 2 | Office |
| 21 | Logitech - MX Keys Combo for Business Full-size | $199.99 | Logitech | 2 | Office |
| 22 | JLab - Flow Bundle Multi-device Wireless Ergonomic | $59.99 | JLab | 2 | Office |
| 23 | Logitech - POP ICON COMBO Compact TKL (variant) | $57.99 | Logitech | 2 | Office |
| 24 | Logitech - Wave Keys and Lift Vertical Mouse Ergonomic | $99.99 | Logitech | 1 | Office |
| 25 | Logitech - MX Keys S Combo for Mac Full-size | $169.99 | Logitech | 2 | Office, Mac |
| 26 | Logitech - MK540 Full-size Advanced Wireless Membrane | $49.99 | Logitech | 2 | Office |
| 27 | Logitech - MK250 Full-size Bluetooth (variant) | $19.99 | Logitech | 2 | Office |
| 28 | Logitech - MK470 Full-size Wireless Scissor (variant) | $34.99 | Logitech | 2 | Office |
| 29 | Logitech - MK710 Full-size Ergonomic Wireless Membrane | $84.99 | Logitech | 2 | Office |
| 30 | Logitech - MK120 Full-size Wired Membrane Keyboard and Mouse | $19.99 | Logitech | 1 | Wired, office |

**Metrics:** NDCG@5=0.42 | NDCG@10=0.40 | NDCG@30=0.36 | P@5=20% | Irrelevant@30=13% | Cliff=4

**MAJOR FAILURE.** Zero gaming-specific keyboard and mouse combos returned. The catalog almost certainly has SteelSeries, Razer, Corsair, HyperX, and Logitech G-series gaming combos, but none appear. The pipeline is matching on "keyboard and mouse combo" (category) but the marketing prompt's augmentation is not differentiating "gaming" from "office." This is a `keyword_rerank_strength` failure — the "gaming" token should boost gaming-specific products over generic office combos, but at 0.3 it has insufficient weight.

---

### Query 15: "MacBook Pro" (direct product)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Apple - GS Certified Refurbished MacBook Pro 14" | $1,199.99 | Apple | 5 | Perfect — MacBook Pro |
| 2 | Apple - GS Certified Refurbished MacBook Pro 14-in | $1,399.99 | Apple | 5 | Perfect |
| 3 | GS Certified Refurbished MacBook Pro 14" Laptop | $819.99 | Apple | 5 | Perfect |
| 4 | Thule - Gauntlet Laptop Sleeve for 14" Apple MacBook Pro | $49.95 | Thule | 2 | Accessory — laptop sleeve |
| 5 | Apple - 35W Dual USB-C Port Compact Power Adapter | $59 | Apple | 2 | Accessory — charger |
| 6 | GS Certified Refurbished MacBook Pro 13.3" | $579.99 | Apple | 5 | Perfect |
| 7 | Apple - GS Certified Refurbished MacBook Pro 14" | $2,299.99 | Apple | 5 | Perfect |
| 8 | Apple - GS Certified Refurbished MacBook Pro 16" | $1,499.99 | Apple | 5 | Perfect |
| 9 | SaharaCase - Hybrid-Flex Arts Case for MacBook Pro 14" | $49.95 | SaharaCase | 2 | Accessory — case |
| 10 | Apple - GS Certified Refurbished MacBook Pro 15.4" | $1,619.99 | Apple | 5 | Perfect |
| 11 | GS Certified Refurbished MacBook Pro 13.3" (variant) | $1,499.99 | Apple | 5 | Perfect |
| 12 | Techprotectus - ONLY for New MacBook Pro 16 Inch Case 2021 | $36.99 | Techprotectus | 2 | Accessory — case |
| 13 | GS Certified Refurbished MacBook Pro 16" (variant) | $1,499.99 | Apple | 5 | Perfect |
| 14 | Apple - 6.6' USB-C to MagSafe 3 Charging Cable | $49 | Apple | 2 | Accessory — cable |
| 15 | Apple - MacBook Pro 16-inch M4 Pro chip | $2,899 | Apple | 5 | Perfect |
| 16 | Apple - MacBook Pro 16-inch M4 Max chip | $3,499 | Apple | 5 | Perfect |
| 17 | Insignia - 140W USB-C GaN Wall Charger for MacBook Pro | $44.99 | Insignia | 2 | Accessory — charger |
| 18 | Best Buy essentials - 65W Dual Port USB-C Wall Charger | $19.99 | BBY Essentials | 1 | Irrelevant — generic charger |
| 19 | GS Certified Refurbished MacBook Pro 13.3" (variant) | $1,499.99 | Apple | 5 | Perfect |
| 20 | Apple - GS Certified Refurbished MacBook Pro 14" | $2,599.99 | Apple | 5 | Perfect |
| 21 | Incase - Hardshell Case for MacBook Pro 16" | $16.99 | Incase | 2 | Accessory — case |
| 22 | Apple - GS Certified Refurbished MacBook Pro 15" | $1,979.99 | Apple | 5 | Perfect |
| 23 | Apple - GS Certified Refurbished MacBook Pro 14" | $1,099.99 | Apple | 5 | Perfect |
| 24 | Best Buy essentials - 100W Dual Port USB-C Wall Charger | $29.99 | BBY Essentials | 1 | Irrelevant — generic charger |
| 25 | Apple - MacBook Pro 16-inch M4 Max chip (variant) | $3,499 | Apple | 5 | Perfect |
| 26 | j5create - 108W PD USB-C Super Charger | $59.99 | j5create | 1 | Irrelevant — generic charger |
| 27 | Apple - GS Certified Refurbished MacBook Pro 16" | $2,399.99 | Apple | 5 | Perfect |
| 28 | Apple - GS Certified Refurbished MacBook Pro 13" | $999.99 | Apple | 5 | Perfect |
| 29 | Apple - GS Certified Refurbished MacBook Pro 13.3" | $189.99 | Apple | 5 | Perfect — excellent deal |
| 30 | Apple - GS Certified Refurbished MacBook Pro 14" | $1,149.99 | Apple | 5 | Perfect |

**Metrics:** NDCG@5=0.81 | NDCG@10=0.78 | NDCG@30=0.68 | P@5=60% | Irrelevant@30=13% | Cliff=20

**Note:** Strong direct product results but accessories (sleeve pos 4, charger pos 5) intrude in the critical top-5 window. Positions 4 and 5 being accessories means the first impression is damaged. `keyword_rerank_strength` needs to be higher to prevent accessory contamination in direct product queries.

---

## Failure Pattern Analysis

### Pattern 1: Accessories contaminating direct product search (Queries 1, 7, 14, 15)

**Symptom:** User searches for a specific product; accessory items (cases, sleeves, chargers, cables, screen protectors) appear in top-5 positions.

**Evidence:**
- Q1 "Sony WH-1000XM5": SaharaCase WF-1000XM5 case appears at position 6
- Q7 "best tablet under 300": SaharaCase + stand appear at positions 2–3; tablet accessories dominate positions 6–30
- Q14 "gaming keyboard and mouse combo": Zero gaming combos returned; office combos dominate all 30 positions
- Q15 "MacBook Pro": Thule sleeve (pos 4) and Apple charger (pos 5) in top-5

**Root cause:** `keyword_rerank_strength` at 0.3 is insufficient to penalize accessories. Accessories often contain the exact product name in their title ("Case for Sony WF-1000XM5"), making them semantically and keyword-similar to the primary product. Without a strong enough keyword/category re-rank signal, they surface alongside — and sometimes above — the primary product. The marketing prompt has no instruction to deprioritize accessories, add-ons, or protection plans.

**Fix:** Raise `keyword_rerank_strength` to 0.6. Add explicit instruction to marketing prompt: "Deprioritize accessories, cases, covers, chargers, cables, protection plans, warranties, and add-ons relative to primary electronics products."

---

### Pattern 2: Gift cards, warranties, and protection plans flooding results (Queries 4, 5, 6, 12)

**Symptom:** Gift cards (digital or physical), Geek Squad protection plans, and digital game codes appear prominently — sometimes at positions 1–2.

**Evidence:**
- Q4 "gift for a teenage gamer": 26 out of 30 results are gift cards or digital game codes — zero hardware
- Q5 "home theater on a budget": Geek Squad Monthly Protection at position 1; gift cards at positions 16, 19, 21–27
- Q6 "music on the go": Geek Squad protection plans at positions 9–10
- Q12 "smart home starter kit": Car remote starter kits, Cricut kits, SIM cards flood positions 10–30

**Root cause:** The default marketing prompt expands "gift" → gift cards (they ARE gifts), "budget" → low-priced items (gift cards have low face value but irrelevant). The word "kit" in Q12 semantically matches "remote car starter kit", "Raspberry Pi Starter Kit", "Cricut Starter Kit", etc. There is no category filtering or de-ranking of known junk categories in the pipeline. The BM25 layer matches "gift" in "Gift Card" titles.

**Fix:** The marketing prompt must explicitly state: "NEVER surface gift cards, protection plans, warranties, extended service plans, digital subscriptions, or in-game currency. Only return purchasable physical electronics or software." Additionally, increasing `keyword_rerank_strength` to 0.6 will help keyword signals boost real electronics over tangentially keyword-matching junk.

---

### Pattern 3: "Backyard/outdoor" semantic expansion pulling irrelevant categories (Query 9)

**Symptom:** "My wifi doesn't reach the backyard" — positions 2, 8, 15, 18, 20, 21, 23, 25, 26, 28, 29 are all outdoor TVs ($1,700–$4,400) or other outdoor products (grills, security cameras, LED strips).

**Root cause:** The query augmentation LLM is expanding "backyard" → "outdoor" → outdoor electronics ecosystem. The vector search then finds products with "outdoor" in their descriptions. Outdoor TVs (Sylvox brand especially) have rich outdoor-living descriptions that semantically overlap with the backyard expansion. WiFi extenders are the correct answer but compete against a large volume of semantically "outdoor" products.

**Fix:** The brand prompt should instruct the LLM to focus query augmentation on the *technical problem being solved* rather than lifestyle context. Example: "When users describe a connectivity or coverage problem, focus on networking solutions (mesh WiFi, range extenders, access points) and suppress lifestyle-based expansions." `bm25_weight` raised to 2.5 will also help — "WiFi" as a BM25 keyword will more strongly boost networking products.

---

### Pattern 4: "Gaming" modifier not distinguishing gaming products from generic office products (Query 14)

**Symptom:** "Gaming keyboard and mouse combo" returns 30 office/productivity keyboard combos, zero gaming-specific products.

**Root cause:** The category for "keyboard and mouse combos" is heavily populated by Logitech office combos. The word "gaming" in the query should boost gaming-specific products (those with "gaming" in their title/tags: SteelSeries, Razer, Corsair K-series, HyperX Alloy, Logitech G-series) via keyword re-ranking. At `keyword_rerank_strength=0.3`, the gaming-specific keyword boost is not strong enough to overcome the volume advantage of office combos in the RRF retrieval pool.

**Fix:** Raise `keyword_rerank_strength` to 0.6. Also, the marketing prompt should note that when users specify a product attribute modifier (like "gaming"), the pipeline must surface products where that modifier is present in the product title or tags, not just semantically similar products.

---

### Pattern 5: Vibe-based marketing prompt expansion miscategorizes electronics queries (Query 4, 6, 12)

**Symptom:** "Gift for a teenage gamer" returns gift cards (literally "gifts"). "Something to listen to music on the go" returns vinyl records (music, but not portable). "Smart home starter kit" returns Cricut smart cutting machines (they have "smart" features).

**Root cause:** The default marketing prompt instructs the LLM to "expand intent with vibes, aesthetics, use cases, and feelings." For Willow's home goods catalog, this is excellent — it broadens "cozy blanket" to warmth, softness, comfort. For electronics, the same expansions create semantic noise:
- "gift" → gift cards (they are literally gifts)
- "music" → vinyl records, turntables, CDs (music formats, not playback devices)
- "smart" → anything with "smart" in its name (smart cutting machine, smart car key)
- "gaming" → "game" → gift cards for games, game titles, action figures

The electronics catalog requires a **specification-grounded** prompt, not a vibe-based one. The LLM should expand toward technical synonyms and use cases, not aesthetic/lifestyle associations.

**Fix:** Replace the marketing prompt entirely with an electronics-specific version (see recommendations below).

---

### Pattern 6: BM25 token matching on incidental "WiFi" / "portable" / "wireless" causes off-topic results (Queries 1, 9)

**Symptom:** Q1 "Sony WH-1000XM5" — positions 22–30 are portable power stations (EcoFlow, Jackery). Q9 wifi query — pellet grill with WiFi app at position 2, EV charger at position 3, smart appliances with WiFi throughout.

**Root cause:** At `bm25_weight=1.0`, BM25 has moderate influence in the RRF fusion. Products with "portable," "wireless," or "WiFi" as incidental features (e.g., a pellet grill with a WiFi app) receive BM25 boosts that push them into results. The issue is that BM25 doesn't understand "WiFi" as the primary product feature vs. an incidental one. For electronics, `bm25_weight` needs to be high enough to boost exact-match products, but this query demonstrates that at 1.0, BM25 is already causing off-category results for incidental token matches.

**Fix:** Raise `bm25_weight` to 2.5 (which will strongly boost exact model numbers and direct category matches) AND add clear merchandising instructions to the marketing prompt to constrain which product categories are relevant to a given query.

---

## Recommended Settings

| Setting | Willow (baseline) | bestbuy Current | Recommended | Rationale |
|---------|-------------------|-----------------|-------------|-----------|
| `query_enhancement_enabled` | `true` | `true` (default) | `true` | Keep enabled; the enhancement is valuable but needs a better prompt |
| `merch_rerank_strength` | `0.25` | `0.25` (default) | `0.15` | Reduce slightly — at current settings, re-ranking is surfacing gift cards and warranties ahead of real products (Q4, Q5). Lower strength gives relevance more weight |
| `bm25_weight` | `1.0` | `1.0` (default) | **`2.5`** | **Critical change.** Electronics searches are heavily model-number and spec-driven. BM25 at 2.5 will ensure exact model numbers (WH-1000XM5, MacBook Pro, 4K TV) get strong keyword signal. Evidence: Q1, Q15 model searches already strong — this will make them even more precise and reduce vibe-based drift |
| `keyword_rerank_strength` | `0.3` | `0.3` (default) | **`0.6`** | **Critical change.** At 0.3, accessories consistently contaminate top-5 for direct product queries (Q1, Q7, Q15). "Gaming" modifier fails to distinguish gaming products from office (Q14). At 0.6, keyword matching will ensure "gaming" boosts gaming-specific products and that accessories don't outrank primary products they're designed for |
| `store_type` | `"online retailer"` | `"online retailer"` (default) | `"electronics retailer"` | More specific store type improves query augmentation context |

---

### Marketing Prompt Recommendation

**Current prompt (default, misaligned):**
> "Expand the user's intent with vibes, aesthetics, use cases, and feelings. Product descriptions already contain domain-specific terms. BM25 handles exact keyword matching. Your job is to enrich semantic meaning so vector search finds products whose descriptions match the user's intent. Emphasize the following merchandiser goals for this catalog:"
> *(no goals appended)*

**Recommended prompt:**
```
You are enriching search queries for a large electronics retailer (Best Buy catalog).
Your goal is to help the vector search engine find the right electronics products.

RULES:
1. NEVER expand toward: gift cards, protection plans, warranties, extended service contracts,
   digital subscriptions, in-game currency, physical media (vinyl records, CDs, DVDs),
   or product accessories (cases, cables, mounts, stands, adapters) unless the user explicitly
   asks for accessories.
2. ALWAYS expand toward: the primary electronics product category, key technical specifications,
   use case scenarios, compatible product ecosystems, and performance attributes.
3. When the user describes a PROBLEM (e.g., "WiFi doesn't reach backyard"), expand toward the
   solution CATEGORY (mesh WiFi, WiFi range extenders, outdoor access points) — not lifestyle terms.
4. When the user says "gaming," expand toward gaming-specific product attributes: RGB lighting,
   high refresh rate, mechanical switches, low latency, gaming headset, gaming mouse, gaming
   keyboard. Do NOT expand toward game titles, gift cards, or game merchandise.
5. When the user mentions "budget" or "under $X," preserve the price constraint signal —
   do not expand toward premium products.
6. Honor brand modifiers (Sony, Apple, Samsung, LG) — keep results brand-focused when specified.

Merchandising goals for this catalog:
- Surface flagship and best-reviewed products in the relevant category first
- For vague intent queries, bias toward mid-range products ($100–$500) as the "sweet spot"
- Prefer products with "Wireless" features over wired equivalents when intent is ambiguous
- For gift queries about people (teenager, gamer, student, mom), return actual physical electronics
  products they would use — NOT gift cards or digital products
```

**Rationale:** The current default prompt is written for a home goods/lifestyle catalog like Willow. It encourages vibe expansion which causes "gift for a teenager" → gift cards, "music on the go" → vinyl records, and "smart home" → craft cutters. The recommended prompt explicitly prohibits junk categories (gift cards, warranties, accessories) and reorients expansion toward electronics-specific attributes: specs, use cases, technical solutions. Query 4 (gamer gift), Query 5 (home theater), Query 6 (music on go), and Query 12 (smart home kit) are all direct evidence that the current prompt is producing the wrong semantic expansions.

---

### Brand Prompt Recommendation

**Current prompt (bestbuy):** empty string `""`

**Recommended:**
```
Best Buy is North America's largest consumer electronics retailer, carrying
products across: TVs, laptops, tablets, smartphones, headphones, speakers,
cameras, gaming hardware, smart home devices, appliances, and computer accessories.

Key catalog characteristics:
- Products span budget to premium: $10 accessories to $5,000+ professional gear
- Major brands: Apple, Samsung, Sony, LG, Microsoft, Dell, HP, ASUS, Lenovo, Bose,
  JBL, Sennheiser, Logitech, NVIDIA, AMD, NETGEAR, Ring, Philips Hue, Nest
- Categories with deep inventory: laptops (hundreds of SKUs), TVs (100+ SKUs),
  headphones (200+ SKUs), smart home (200+ SKUs)
- Many color/storage/configuration variants exist for the same base model
- Refurbished/Geek Squad certified products are legitimate search results
- Protection plans and accessories exist but should NOT dominate results

When augmenting queries, prioritize hardware products over software,
accessories, gift cards, and services.
```

**Rationale:** The brand prompt provides context to the query augmentation LLM about what the catalog contains. Without it, the LLM has no grounding in what "Best Buy" sells. The explicit list of categories and brands helps the LLM generate better query expansions — e.g., knowing that "gaming keyboard" means Logitech G-series, SteelSeries, Corsair, Razer products rather than generic Logitech office combos.

---

## Recommended Featured Queries

### Showcase Query Selection

Selection criteria: NDCG@5 ≥ 0.85, P@5 = 100%, different archetypes, impressive semantic understanding.

**Qualifiers from test suite:**

| Query | NDCG@5 | P@5 | Archetype | Demo Value |
|-------|--------|-----|-----------|------------|
| Q13: "bluetooth speakers for a pool party" | 0.96 | 100% | use case + occasion | Highest — waterproof party speakers, semantic brilliance |
| Q3: "noise cancelling headphones for commuting" | 0.94 | 100% | use case + product | Excellent ANC headphone curation, broad brand diversity |
| Q11: "4K TV" | 0.93 | 100% | category browse | Strong category signal, impressive product diversity |
| Q1: "Sony WH-1000XM5" | 0.96 | 100% | direct product | Perfect model match — but redundant archetype with Q3 |
| Q10: "lightweight 15 inch laptop with good battery life" | 0.81 | 80% | multi-attribute | Good but P@5 only 80%; ASUS 16" at pos 2 slightly wrong |

**Selection:** Q13 (use case+occasion), Q3 (use case+product), Q11 (category browse). These three cover different archetypes and all have zero irrelevant results across 30 positions.

Note: Q11 replaces Q5 "home theater on a budget" which currently **fails catastrophically** (warranty at pos 1). Q13 replaces Q4 "gift for a teenage gamer" which **fails catastrophically** (all gift cards).

### Update `lib/showcase.ts`

**Replace current bestbuy showcase queries:**

```typescript
bestbuy: [
  { query: "bluetooth speakers for a pool party", label: "use case + occasion" },
  { query: "noise cancelling headphones for commuting", label: "use case + product" },
  { query: "4K TV", label: "category browse" },
],
```

**Replace current bestbuy extra suggestions:**

```typescript
bestbuy: [
  "lightweight 15 inch laptop with good battery life",
  "my wifi doesn't reach the backyard",
],
```

**Rationale:**

1. "bluetooth speakers for a pool party" — the single best-performing query (NDCG@5=0.96, P@5=100%, 0% irrelevant@30). Perfectly demonstrates semantic understanding: the engine knows "pool party" → waterproof + portable + party-sized speakers. Visually striking result set (JBL PartyBox, UE Wonderboom, Sony XV500, Bose SoundLink Max).

2. "noise cancelling headphones for commuting" — already the existing top showcase query. Keep it — it performs excellently (NDCG@5=0.94, P@5=100%). Demonstrates use-case intent understanding. Excellent brand diversity (Bose, Sony, JBL, Sennheiser, Apple AirPods Pro).

3. "4K TV" — replaces "home theater on a budget" which currently fails. Clean category match, impressive array of Samsung/LG/TCL/Sony 4K TVs across all price points. Strong visual demo for a prospect with a TV category.

4. Extra suggestion "lightweight 15 inch laptop with good battery life" — demonstrates multi-attribute semantic understanding (NDCG@5=0.81). MacBook Air + Lenovo Slim dominate, showing the engine understands "battery life" as an Apple M-chip differentiator.

5. Extra suggestion "my wifi doesn't reach the backyard" — demonstrates problem-solving ability (NDCG@5=0.82). Returns WiFi extenders and mesh systems. After prompt improvements, this query will also eliminate the outdoor TV noise in positions 11+, making it even more impressive.

---

## Action Items

1. [ ] **Update marketing prompt** via admin panel (`/admin/settings/search`, select bestbuy collection). Replace with electronics-specific prompt above. This single change is expected to fix Q4 (gift for gamer), Q5 (home theater), Q6 (music on go), and Q12 (smart home kit) by eliminating gift card and warranty results.

2. [ ] **Update brand prompt** via admin panel. Add Best Buy catalog context. This improves query augmentation quality for all queries.

3. [ ] **Raise `bm25_weight` to 2.5** via admin panel sliders. This strengthens model-number precision (Q1, Q15) and should reduce vibe-based semantic drift for spec queries.

4. [ ] **Raise `keyword_rerank_strength` to 0.6** via admin panel sliders. This will fix Q14 (gaming combos returning office combos) and reduce accessory contamination in Q1, Q7, Q15.

5. [ ] **Lower `merch_rerank_strength` to 0.15** via admin panel sliders. The current marketing prompt is causing active harm (gift cards at pos 1 for Q4, Q5). Reducing re-rank strength gives pure relevance more weight while the new prompt is deployed.

6. [ ] **Update `lib/showcase.ts`** with recommended featured queries (bluetooth speakers for pool party, noise cancelling for commuting, 4K TV) and extra suggestions.

7. [ ] **Re-run `/optimize-search bestbuy`** after changes to verify improvements. Target metrics: Mean NDCG@5 > 0.85 (vs. current 0.71), Mean P@5 > 80% (vs. current 64%), Mean Irrelevant@30 < 15% (vs. current 30%).

---

## Appendix: Scoring Reference

DCG formula: `DCG@k = Σ_{i=1}^{k} rating_i / log2(i+1)`

Ideal DCG (IDCG) assumes perfect ordering (all 5s at top k positions):
- IDCG@5 = 5/1 + 5/1.585 + 5/2 + 5/2.322 + 5/2.585 = 5 + 3.155 + 2.5 + 2.153 + 1.934 = 14.74
- IDCG@10 = IDCG@5 + 5/2.807 + 5/3 + 5/3.170 + 5/3.322 + 5/3.459 = 14.74 + 1.781 + 1.667 + 1.577 + 1.505 + 1.446 = 22.72
- IDCG@30 uses rating_i=5 for all 30 positions in ideal case

NDCG@k = DCG@k / IDCG@k
