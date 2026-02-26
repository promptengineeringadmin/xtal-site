# xtaldemo BEFORE Diagnostic (Current Settings)

**Date:** 2026-02-26
**Current backend settings:**
- query_enhancement_enabled: false
- merch_rerank_strength: 0
- bm25_weight: 1.0
- keyword_rerank_strength: 0.5
- Marketing prompt: backend=404 (using default), Redis=junk ("halloween is tomorrow...")
- Brand prompt: empty (backend 404)

---

## Query 1: "Instant Pot"

**Assessment:** Mostly accessories/parts for the Instant Pot (power cords, sealing rings, fuses, cheat sheets). No actual Instant Pot pressure cooker unit returned. Results 9-10 are completely irrelevant (fake hanging plants, artificial succulents) — total query drift.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Zonefly Original Power Cord Compatible for Instant Pot Electric Pressure Cooker, Power Quick Pot, Rice Cooker... | $7.99 | ZoneFly |
| 2 | Parts Replacement for Instant Pot Duo 5, 6 Quart Qt Include Sealing Ring, Steam... | $11.99 | NeoJoy |
| 3 | Instant Pot Cheat Sheet Magnet Set Accessories Quick Reference Guide - Healthy H... | $9.95 | OLADOT |
| 4 | Original Condensation Collector Cup Replacement for Instant Pot DUO, ULTRA, LUX... | $5.99 | ZoneFly |
| 5 | Original Electric Pressure Cookers Thermal Fuses for Instant Pot 3,6,8 Qt DUO/UL... | $5.98 | ZoneFly |
| 6 | Steam Release Valve Handle Replacement for Instant Pot Duo/Duo Plus 3, 5, 6 and... | $4.99 | SENLIXIN |
| 7 | Glass Saucepan with Cover, 1.5L/50 FL OZ Heat-resistant Glass Stovetop Pot and P... | $22.99 | LEAVES AND TREES Y |
| 8 | Hamilton Beach 3 Quart / 2.8 Liter 3QT Copper Electric Fondue Pot Set with Tempe... | $37.62 | Hamilton Beach |
| 9 | Sggvecsy Fake Hanging Plants 4 Pack Artificial Hanging Eucalyptus Plants Fake Po... | $18.99 | Sggvecsy |
| 10 | Coitak Artificial Succulent Plants Potted, Assorted Decorative Faux Succulent Po... | $14.98 | Coitak |

---

## Query 2: "yoga mat"

**Assessment:** Zero actual yoga mats returned. Top result is a towel rack with "yoga mat storage" mentioned in description. Results are entirely off-topic: floor mats, tapestries, sushi mats, bath mats, ironing boards. Complete failure to match intent.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | SODUKU Towel Rack Wall Mounted 3 Tier Modern Decorative Bathroom Towel Holder Pr... | $24.99 | SODUKU |
| 2 | YAOSH 3D Visual Optical Floor Mat Black White Plaid Round Rugs Vortex Optical Il... | $6.36 | NUYKOUY |
| 3 | NiYoung Hippie Hippy Wall Tapestry Trippy Smoke Cool Girl Art Large Mysterious T... | $12.99 | NiYoung |
| 4 | FUNGYAND Bamboo Sushi Rolling Mat with 2 Pairs of Chopsticks Natural Bamboo 9.5"... | $5.99 | FUNGYAND |
| 5 | Nice Rose Flower Area Rugs Soft Non Slip Absorbent Bath Mat Bathroom Rugs Door M... | $11.99 | Sytian |
| 6 | Cramer Kik-Step Step Stool Top Mat Replacement Part | $17.90 | Cramer |
| 7 | NOVOGRATZ Aloha Collection You Look Good Doormat, 1'6" x 2'6", Natural Brown | $22.99 | Novogratz by Momeni Rugs |
| 8 | Aromasong All Natural Eucalyptus & Wild Mint Room & Linen Spray for Bedding, She... | $8.97 | Aromasong |
| 9 | Portable Ironing Mat Blanket (Iron Anywhere) Ironing Board Replacement, Iron Boa... | $14.99 | BNYD |
| 10 | Epica Non Slip Bathtub Mat | Real Rubber Bath Mat for Tub & Shower, Bath Mat for... | $16.80 | Epica |

---

## Query 3: "hiking boots for men"

**Assessment:** Top 2 results are hiking socks, not boots. Result 3 is a women's boot (not men's). A few actual boots appear (Redback, Muck Boot, Justin, Merrell Moab) but mixed with work boots and socks. Result 9 is a 6-pack of socks. Result 10 is a boots storage bag. Poor relevance — gender filter ignored, accessories mixed in.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Darn Tough Men's Hiker Merino Wool Cushion Socks Boots, Lime, Small | $22.98 | Darn Tough |
| 2 | 3 Pairs Wool Socks - Calf Socks for Women Men Thick Warm Socks Boot Socks Hiking... | $12.99 | fauson |
| 3 | Merrell Women's Siren Traveller 3 MID Waterproof Hiking Boot, Brindle/Boulder, 9... | $149.99 | Merrell |
| 4 | Redback Boots UBBK Easy Escape, 6" Slip-On Black Leather Boots, Non Steel Toe (U... | $156.00 | Redback |
| 5 | Servus MAX 15" PVC Chemical-Resistant Soft Toe Men's Work Boots, Olive, Green &... | $50.99 | Honeywell |
| 6 | Muck Boot Men's Wetland Boot, Bark - 11 | $175.91 | Muck Boot |
| 7 | Justin Original Men's Worker Pulley Soft Toe Work Boots, Rugged Tan, 13 2E US | $121.66 | Justin Original Work |
| 8 | Merrell J036267 Mens Moab 3 Mid WP Granite US Size 10M | $98.65 | Merrell |
| 9 | Darn Tough Coolmax Micro Crew Cushion Socks - Men's (Gray/Black, Large) - 6 Pack | $119.75 | Darn Tough |
| 10 | Portable 2 Pack Boots Storage,Tall Boots Storage/Protector Bag, Boots Cover Blac... | $15.99 | Hewnda |

---

## Query 4: "affordable queen size sheets"

**Assessment:** Top result is a legitimate queen sheet set. Results 2-4 are also reasonably relevant (bed sheets, pillowcases, mattress protector). However results 5, 8 are Christmas-themed (quilt, pajamas) and result 9 is a bed frame bracket — off-topic drift starting mid-results. Price range is reasonable for "affordable" intent.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Shanghan Home Queen Sheets Set, Extra Soft Queen Size Sheets - 4 Piece, Breathab... | $39.99 | Shanghan Home |
| 2 | ND Black Bed Sheets, Hotel Luxury Bedding Sheets & Pillowcases, Extra Soft Deep... | $16.49 | N\D |
| 3 | Lasimonne White Pillowcases, Pack of 6, Standard/Queen Size, 200 Thread Count Pe... | $17.47 | Lasimonne |
| 4 | Queen Size Vinyl Mattress Protector Zippered Encasement Cover 100% Waterproof Pr... | $17.27 | Dependable Industries inc. Essentials |
| 5 | CHIXIN 4 Piece Christmas Quilt Set King, Reindeer Santa Claus Snowflake Pattern... | $49.99 | CHIXIN |
| 6 | Zufio Mosquito Net for Bed, Extra-Long Bed Canopy for Girls 12.5M Coverage Mosqu... | $16.99 | ZUFIO |
| 7 | WonderSleep Dream Rite Shredded Memory Foam Pillow Series Luxury Adjustable Loft... | $25.99 | WonderSleep |
| 8 | DAUGHTER QUEEN Xmas Pajamas for Little Girls Deer Pjs 4T Toddler Kids Christmas... | $19.99 | DAUGHTER QUEEN |
| 9 | Kings Brand Furniture Bed Frame Footboard Extension Brackets Set Attachment Kit... | $20.99 | Kings Brand Furniture |
| 10 | HomeMate Bed Pillows for Sleeping - Queen Size(20"x28") Set of 4 Pillows Allergy... | $39.99 | Homemate |

---

## Query 5: "hosting a dinner party this weekend"

**Assessment:** Partial success. Top result (Stedware cheese board) and result 4 (SMIRLY charcuterie board) are genuinely useful for a dinner party host. However results 2-3, 7 are birthday party decorations (Nerf, Baby Shark), results 5, 9 are Thanksgiving decor, and results 6, 8 are generic plastic tablecloths. The engine picks up on "party" but fails to understand the "dinner" + "hosting" semantic intent.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Stedware Cheese Board Set, Marble Top Charcuterie Board, Bowls & Knife Set with... | $41.97 | Stedware |
| 2 | xo, Fetti Holographic Foil Plates - 25 pack | Happy Birthday Party Decorations... | $14.99 | xo, Fetti |
| 3 | Mega Nerf Party Supplies for Birthday, Decorations, and Favors, Serves 16 Guests | $29.99 | Unique |
| 4 | SMIRLY Charcuterie Boards Gift Set: Large Charcuterie Board Set, Bamboo Cheese B... | $45.99 | SMIRLY |
| 5 | Thanksgiving Turkey Ceramic Shelf Sitters Decorations 3 Pack Desk Mantel Table T... | $18.95 | Gift Boutique |
| 6 | NORZEE 5-Pack White Disposable Plastic Tablecloths, Gold Dot Confetti Rectangular | $11.99 | NORZEE |
| 7 | Baby Shark Birthday Decorations Set | Baby Shark Party Supplies | For Boys and G... | $29.99 | Unique |
| 8 | PACK OF 4: Disposable SILVER GRAY Plastic Tablecloths/Table Covers, 54 x 108 inc... | $9.99 | Nicky Nice |
| 9 | Gift Boutique Harvest Scarecrows Table Decor Figurines with Pumpkins - 3 Thanksg... | $29.95 | Gift Boutique |
| 10 | SMIRLY Charcuterie Boards Gift Set: Large Charcuterie Board Set, Bamboo Cheese B... | $79.99 | SMIRLY |

---

## Summary

| Query | Top Relevant Hits | Notes |
|-------|-------------------|-------|
| "Instant Pot" | 0/10 (no actual IP unit) | Accessories-only, complete product category miss; results 9-10 are plants (total drift) |
| "yoga mat" | 0/10 | No yoga mats at all; keyword "mat" matched floor/bath mats; catastrophic failure |
| "hiking boots for men" | ~4/10 | Boots appear but socks and accessories dominate; women's boot in top 3; gender signal ignored |
| "affordable queen size sheets" | ~5/10 | Partial success in top 4; Christmas/holiday items creep in mid-results |
| "hosting a dinner party" | ~3/10 | Two relevant charcuterie boards; birthday/Nerf/Baby Shark party supplies pollute results |

**Overall verdict:** Keyword-heavy queries ("Instant Pot", "queen size sheets") show partial relevance on exact-match products. Semantic/intent queries ("yoga mat" finding no mats, "dinner party" returning Nerf supplies) are severely degraded — consistent with no query enhancement and weak BM25 weighting. The junk Redis marketing prompt ("halloween is tomorrow") is likely injecting seasonal/party noise.
