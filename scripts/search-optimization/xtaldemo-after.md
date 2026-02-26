# xtaldemo AFTER Diagnostic (New Settings)

**Date:** 2026-02-26
**New backend settings:**
- query_enhancement_enabled: true
- merch_rerank_strength: 0.25
- bm25_weight: 2.0
- keyword_rerank_strength: 0.5
- Marketing prompt: mixed-catalog specific (1203 chars)
- Brand prompt: mixed catalog context (659 chars)

---

## Query 1: "Instant Pot"

**Assessment:** Accessories and replacement parts still dominate the top results, but the catastrophic tail-end drift (fake plants) is gone. A competing multi-cooker (Ninja Speedi, pos 2) now appears — arguably relevant, as it is a direct functional substitute. Result 7 (Hamilton Beach Fondue Pot) and result 8 (OXO Potato Ricer) are weak tangential matches. No actual Instant Pot pressure cooker unit in inventory — likely the collection simply doesn't stock one. Given that constraint, top results are all at minimum IP-adjacent (accessories, compatible parts, multi-cooker alternative). The junk-prompt-driven plant drift (BEFORE positions 9-10) is fully eliminated.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Parts Replacement for Instant Pot Duo 5, 6 Quart Qt Include Sealing Ring, Steam Release Valve and Float Valve Seal Replacement Parts Set | $11.99 | NeoJoy |
| 2 | Ninja SF301 Speedi Rapid Cooker & Air Fryer, 6-Quart Capacity, 12-in-1 Functions to Steam, Bake, Roast, Sear, Sauté, Slow Cook, Sous Vide & More, 15-Minute Speedi Meals All In One Pot, Sea Salt Gray | $129.99 | Ninja |
| 3 | Instant Pot Cheat Sheet Magnet Set Accessories Quick Reference Guide - Healthy Handy Kitchen Recipe Cookbook | $9.95 | OLADOT |
| 4 | Steam Release Valve Handle Replacement for Instant Pot Duo/Duo Plus 3, 5, 6 and 8 Quart, Mini 3 Qt, Duo50 5 Qt, Duo/Duo Plus 60 6 Qt, and Duo/Duo Plus 80 8 Qt | $4.99 | SENLIXIN |
| 5 | Zonefly Original Power Cord Compatible for Instant Pot Electric Pressure Cooker, Power Quick Pot, Rice Cooker, Soy Milk Maker, Microwaves and More Kitchen Appliances Replacement Cable | $7.99 | ZoneFly |
| 6 | Original Electric Pressure Cookers Thermal Fuses for Instant Pot 3,6,8 Qt DUO/ULTRA/LUX, 185 Celsius Thermal Fuses for Pressure Cooker for PowerXL/Quick Pot/ Y4D-36 Y6D-36 Y8D 36 Y10D-36, 3-Pack | $5.98 | ZoneFly |
| 7 | Hamilton Beach 3 Quart / 2.8 Liter 3QT Copper Electric Fondue Pot Set with Temperature Control, 6-Color Coded Forks, for Cheese, Chocolate, Hot Oil, Broth (86201) | $37.62 | Hamilton Beach |
| 8 | OXO Good Grips Stainless Steel Potato Ricer | $28.95 | OXO |
| 9 | Original Condensation Collector Cup Replacement for Instant Pot DUO, ULTRA, LUX, 5, 6, 8 Quart All Series Ultra 60, DUO60, DUO89, and LUX80 by ZoneFly | $5.99 | ZoneFly |
| 10 | Pampered Chef Large Micro Cooker for Microwave 2 Quart | $26.40 | Pampered Chef |

---

## Query 2: "yoga mat"

**Assessment:** Still no actual yoga mats in results — the collection almost certainly doesn't stock them. However the composition has measurably changed vs BEFORE. BEFORE returned a towel rack (#1), a sushi mat, eucalyptus room spray, and an ironing board — items with zero physical resemblance to a yoga mat. AFTER returns bath mats and floor mats (at least flat, rectangular, non-slip surfaces), plus a wall tapestry that explicitly mentions "Yoga Picnic Mat" in its title (pos 8). Result 2 (silicone iron rest pad, pos 2) is still noise. The BM25 boost is pulling "mat" keyword matches more consistently. No catastrophic drift, but also no semantic breakthrough — query enhancement did not surface fitness/sports items.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Black Bath Mat for Bathroom and Shower - 16 x 24 Inches (W x L) Bamboo Wood Rug Pad, Bathmat for Hot Tub Spa Sauna RV Camper Outdoor | $20.97 | ZPirates |
| 2 | SAVINA Silicone Rest Pad for Ironing Board (2 Pack). Heat Resistant Pad, Thicker Version. Perfect Combination with Ironing Board and Mat. | $8.95 | SAVINA |
| 3 | Full Body Bath Pillow - Non-Slip, Plus Konjac Bath Sponge, Luxurious Mat, Bath Pillows for Tub Neck and Back Support | $49.97 | IndulgeMe |
| 4 | YAOSH 3D Visual Optical Floor Mat Black White Plaid Round Rugs Vortex Optical Illusion Rug, Floor mat, Rubber mats for Floor, Floor mats for Home, Rubber Floor mats | $6.36 | NUYKOUY |
| 5 | J&J home fashion Silicone Iron Rest Pad for Ironing Board Hot Resistant Mat White | $2.99 | J&J home fashion |
| 6 | Bath Mat for Tub, 30 x 17 inch Non Slip Bathtub Mat Machine Washable Shower Mat with Suction Cups, Quick Drain Bathtub Mat for Bathroom | $11.99 | Sheepping |
| 7 | 100pointONE Toilet Bath Mat U-Shaped Crystal Clear Commode Contour Rug, Bathroom Mat for Toilet Base Non-Slip, Waterproof, Wipe to Clean and Dries Quickly for Bathroom (27"×22"x0.19") | $29.95 | 100pointONE |
| 8 | NiYoung Hippie Hippy Wall Tapestry Trippy Smoke Cool Girl Art Large Mysterious Tapestry Wall Hanging Tapestry for Bedroom Dorm Accessories Mandala Yoga Picnic Mat Ethnic Tapestry | $12.99 | NiYoung |
| 9 | Nice Rose Flower Area Rugs Soft Non Slip Absorbent Bath Mat Bathroom Rugs Door Mat Kitchen Mat 15.74 x 23.62 Inch | $11.99 | Sytian |
| 10 | Black White Bathroom Rugs 20x32inch Soft Absorbent Cute Bath Mat for Floor, Machine Washable Non-Slip Rug Shower Toilet Tub, Decor Plush Bathmat Carpets | $24.59 | ontinny |

---

## Query 3: "hiking boots for men"

**Assessment:** Mixed regression vs BEFORE. The Merrell Moab 3 (a genuine men's hiking boot) rises from pos 8 to pos 3 — a clear improvement. However socks still dominate positions 1, 2, and 8. The actual boots that appeared BEFORE (Redback, Muck Boot, Justin work boots) are gone, replaced by a Casio watch (pos 5), hunting mittens (pos 6), a boots storage bag (pos 7), a fishing wader bag (pos 9), and a pilot hat (pos 10). The query enhancer may have broadened the query too aggressively into "outdoors/men's gear," surfacing accessories and non-footwear. The Merrell improvement is real, but overall the boot density drops (1 boot AFTER vs ~4 BEFORE) with worse tail quality.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Darn Tough Men's Hiker Merino Wool Cushion Socks Boots, Lime, Small | $22.98 | Darn Tough |
| 2 | 3 Pairs Wool Socks - Calf Socks for Women Men Thick Warm Socks Boot Socks Hiking Crew Socks Soft Winter Socks Long Cozy Socks | $12.99 | fauson |
| 3 | Merrell J036267 Mens Moab 3 Mid WP Granite US Size 10M | $98.65 | Merrell |
| 4 | Darn Tough Coolmax Micro Crew Cushion Socks - Men's (Gray/Black, Large) - 6 Pack Special | $119.75 | Darn Tough |
| 5 | Casio Men's Pro Trek PRW-6900YL-5 Tough Solar Watch | $333.20 | Casio |
| 6 | Nomad Men's Standard Conifer NXT Flip Mitt | Convertible Hunting Mittens, Mossy Oak Droptine Camo, Large-X-Large | $59.00 | NOMAD |
| 7 | Portable 2 Pack Boots Storage, Tall Boots Storage/Protector Bag, Boots Cover Black (18-1/2 inch high X 9-1/2 inches wide X 11-3/8 inch long) | $15.99 | Hewnda |
| 8 | Yeblues 5 Pairs Wool Socks Mens, Thick Warm Winter Socks, Hiking Socks Soft Casual Socks for Men, SIZE 6-13 | $19.99 | Yeblues |
| 9 | fishpond Flattops Fly Fishing Wader and Boot Duffel Bag | Fly Fishing Wader Travel Bag | $149.95 | fishpond |
| 10 | FLIGHT Outfitters Bush Pilot HAT | $27.95 | Flight Outfitters |

---

## Query 4: "affordable queen size sheets"

**Assessment:** Improved vs BEFORE. Top result is the same queen sheets set (#1, unchanged). AFTER drops the Christmas quilt (was pos 5), Christmas pajamas (was pos 8), and bed frame bracket (was pos 9). Replacements include a bassinest fitted sheet (pos 4), Disney Frozen kids sheets (pos 5, still slightly off), Thomas & Friends comforter (pos 7, kids bedding), and a flannel blanket (pos 10). The junk holiday items are gone but kids bedding has emerged as the new noise category. Results 1-3 remain strong for the "affordable queen sheets" intent. The WonderSleep memory foam pillow (pos 8) is related bedding but not sheets. A men's tank top undershirt (pos 9) is a clear miss — likely "cotton" + "queen" term confusion. Overall cleaner than BEFORE but still noisy mid-to-tail.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Shanghan Home Queen Sheets Set, Extra Soft Queen Size Sheets - 4 Piece, Breathable & Cooling Luxury Bedding Sheets & Pillowcases, Fitted Sheet Deep Pocket up to 16" (Floral/White) | $39.99 | Shanghan Home |
| 2 | ND Black Bed Sheets, Hotel Luxury Bedding Sheets & Pillowcases, Extra Soft Deep Pocket up to 14", Wrinkle Fade Stain Resistant, 4 Piece Set (Black, Queen) | $16.49 | N\D |
| 3 | Lasimonne White Pillowcases, Pack of 6, Standard/Queen Size, 200 Thread Count Percale, CVC Pillow Cover | $17.47 | Lasimonne |
| 4 | Halo Bassinest Fitted Sheet for Twin Bassinest, 100% Cotton, Super Soft Bassinet Sheet for Baby Boys, Girls and Unisex, Breathable and Lightweight Mattress Cover, 2 Pack, Solid White | $27.99 | HALO |
| 5 | Disney Frozen 2 Kids Bedding Super Soft Microfiber Sheet Set, Twin, "Official" Disney Product By Franco | $28.61 | Franco |
| 6 | Protect-A-Bed Premium Cotton Terry Cloth Waterproof Mattress Protector, Blocks Dust Mites and Allergens, Machine Washable, White King | $43.89 | PROTECT-A-BED |
| 7 | Franco Thomas & Friends Kids Bedding Super Soft Comforter and Sheet Set, 4 Piece Twin Size, (Official Licensed Thomas & Friends Product) | $69.99 | Franco |
| 8 | WonderSleep Dream Rite Shredded Memory Foam Pillow Series Luxury Adjustable Loft Home Pillow Hotel Collection Grade Washable Removable Cooling Bamboo Derived Rayon Cover - Queen 1 Pack | $25.99 | WonderSleep |
| 9 | Mens 100% Cotton Tank Top A-Shirt Wife Beater Undershirt Ribbed Black 6 Pack (3 Black 3 White, Medium) | $26.90 | Cotton Plus |
| 10 | Blanket Flannel Manga Soft Cozy Throw Blanket for Couch Bed Sofa 52" x 62" | $26.59 | Ningguang |

---

## Query 5: "hosting a dinner party this weekend"

**Assessment:** Significantly improved vs BEFORE. BEFORE returned Nerf party supplies, Baby Shark decorations, Thanksgiving scarecrow figurines, and disposable plastic tablecloths. AFTER returns wine glasses (pos 1), cocktail napkins (pos 2), two charcuterie/cheese boards (pos 3 and 8-9), silverware forks (pos 4), a full dinnerware set for 8 (pos 5), champagne flutes (pos 6), and scalloped sage napkins (pos 7). Every result in the top 9 is directly relevant to hosting a dinner party. The only oddity is pos 10 (Halloween taper candles) — but even that has dinner party utility (candles for ambiance), and "dinner candles" is in the product title. This is the clearest win of the five queries: the new marketing prompt + query enhancement understood the hosting/entertaining semantic intent.

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | AILTEC Wine Glasses Set of 6, Crystal Glass with Stem for Drinking Red/White/Cabernet Wine as Gifts Sets, Clear Lead-Free Premium Blown Glassware (19oz, 6 pack) | $37.99 | AILTEC |
| 2 | Boston International IHR Paper Cocktail Napkins, 5 x 5-Inches | $6.25 | Boston International |
| 3 | Charcuterie Boards Cheese Boards Set with Knife Set for House Warming Gifts New Home Decor, Anniversary Birthday & Wedding Gifts for Couple, Bridal Shower Gift for Women | $49.95 | Petiza |
| 4 | Dinner Forks set of 6, Stainless Steel Silverware Forks, Table Forks, 8 Inches, Silver, Dishwasher Safe | $7.99 | dearithe |
| 5 | DUOLUV Plates and Bowls Sets for 8, 32-Piece Kitchen Dinnerware Set for 8 Tableware Wheat Straw Dinner Plates, Dessert Plates, Bowls and Cups, Dishes Set for Home Parties Camping - Black | $31.99 | DUOLUV |
| 6 | Hand Blown Crystal Champagne Flutes Champagne Glasses Set of 6 Elegant Flutes 100% Lead Free Quality Sparkling Wine Stemware Set Dishwasher Safe Gift for Wedding, Anniversary, Christmas - 8oz Clear | $27.99 | JYB&XY |
| 7 | 100 Pcs Scalloped Sage Cocktail Napkins Sage Green Thick Paper Napkins Disposable Party Napkins Beverage Napkins for Wedding Dinner Birthday Supplies, 5 x 5 Inches | $16.99 | Perthlin |
| 8 | SMIRLY Charcuterie Boards Gift Set: Large Charcuterie Board Set, Bamboo Cheese Board Set - Unique Mothers Day Gifts for Mom - House Warming Gifts New Home, Wedding Gifts for Couple, Bridal Shower Gift | $45.99 | SMIRLY |
| 9 | Stedware Cheese Board Set, Marble Top Charcuterie Board, Bowls & Knife Set with Dip Serving Tray, Extra Large Bamboo Meat & Cheese Platter - Gift for Women, Couples Wedding Anniversary, Housewarming | $41.97 | Stedware |
| 10 | CIPHANDS Halloween 10 inch Black Taper Candles Set of 14 - Dinner Candles Dripless - Tall Candles Long Burning Perfect for Dinner, Party or Wedding Candles Decor | $11.99 | CIPHANDS |

---

## Summary

| Query | BEFORE Score | AFTER Score | Verdict | Notes |
|-------|-------------|-------------|---------|-------|
| "Instant Pot" | ~2/10 | ~4/10 | **Improved** | Fake plant drift (pos 9-10) eliminated; Ninja Speedi multi-cooker appears as relevant substitute; accessories still dominate but all are IP-adjacent |
| "yoga mat" | 0/10 | ~1/10 | **Marginal improvement** | No actual yoga mats in catalog; at least results are now "mat-shaped" flat surfaces rather than a towel rack and eucalyptus spray; one result explicitly says "Yoga Mat" in title |
| "hiking boots for men" | ~4/10 | ~2/10 | **Regressed** | Merrell Moab rises to pos 3 (good), but other actual boots disappear; query enhancer over-broadened into watch/mittens/pilot hat; boot density drops from ~4 to 1 |
| "affordable queen size sheets" | ~5/10 | ~5/10 | **Unchanged / slight shift** | Christmas/holiday junk cleared; kids bedding and a men's tank top introduce new noise; top 3 remain solid; net quality similar |
| "hosting a dinner party this weekend" | ~3/10 | ~9/10 | **Dramatically improved** | Near-perfect semantic intent match; Nerf/Baby Shark/Thanksgiving items fully replaced by wine glasses, silverware, charcuterie boards, dinnerware, napkins; clear win for query enhancement + new prompt |

**Overall verdict:** The new settings deliver a decisive win on semantic/intent queries (Query 5 transforms from unusable to excellent). Keyword-anchor queries (Instant Pot, sheets) show modest cleanup of irrelevant tail results. The main concern is Query 3 (hiking boots): query enhancement appears to have broadened "hiking boots for men" too aggressively into a general "men's outdoors" cluster, trading boot-specific recall for accessory variety. The bm25_weight=2.0 boost helps exact-keyword matches but doesn't compensate when the query enhancement stage introduces non-boot concepts. Consider tuning the brand/marketing prompt to bias footwear queries back toward product-category specificity, or investigate whether query enhancement can be more conservative for explicit product-type queries.
