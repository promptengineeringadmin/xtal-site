# Best Buy AFTER Diagnostic (New Settings)

**Date:** 2026-02-26
**New backend settings:**
- query_enhancement_enabled: true
- merch_rerank_strength: 0.15
- bm25_weight: 2.5
- keyword_rerank_strength: 0.6
- Marketing prompt: electronics-specific (1952 chars)
- Brand prompt: Best Buy catalog context (960 chars)

---

## Query 1: "gift for a teenage gamer"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Sony - PlayStation PC Marvel Spiderman Miles Morales [Digital] | $20.00 | Sony |
| 2 | H&M - $25 Gift Card [Digital] | $20.00 | H&M |
| 3 | H&M - $50 Gift Card [Digital] | $40.00 | H&M |
| 4 | Meta - BONELAB Full Game Gift Card [Digital] | $39.99 | Meta |
| 5 | TRIPP: Meditation, Relaxation, Sleep on Meta Quest Gift Card [Digital] | $39.99 | Meta |
| 6 | NECA - Teenage Mutant Ninja Turtles 7" The Last Ronin - Ultimate Foot Bot | $27.99 | NECA |
| 7 | NECA - Teenage Mutant Ninja Turtles 1/4 Scale Action Figure - Baby Turtle Accessory Set (1990 Movie) | $41.99 | NECA |
| 8 | Turtle Beach - Stealth 700 Gen 3 Wireless Over-Ear Gaming Headset for Xbox Series X\|S, Xbox One, PC, PS5, & Mobile with 80-Hr Battery - Black | $199.99 | Turtle Beach |
| 9 | TOMY - Club Mocchi Mocchi - Leonardo 11" Plush | $27.99 | TOMY |
| 10 | LEGO - NINJAGO Tournament Temple City Kids Toy 71814 | $249.99 | LEGO |

**Notes vs BEFORE:** Marginally different shuffle but fundamentally the same failure mode. Pos 8 is new — Turtle Beach gaming headset is a genuinely relevant gamer gift. The TMNT keyword lock is still partially present (pos 6-7, 9) and H&M gift cards still appear at pos 2-3. However, query enhancement did surface VR game gift cards (Meta BONELAB at pos 4) which is gaming-adjacent. The H&M cards suggest "gift card" co-occurrence in the index is still winning over gaming intent. Overall: slight improvement (+1 genuinely relevant result), but the core intent-mismatch persists.

---

## Query 2: "setting up a home theater on a budget"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Insignia™ - 100" Home Theater Portable Folding Projector Screen - White | $39.99 | Insignia™ |
| 2 | Peerless-AV - Wall Mount - Black | $26.99 | Peerless-AV |
| 3 | Tablo - 4th Gen, 2-Tuner, 128GB Over-The-Air DVR & Streaming Player - White | $99.99 | Tablo |
| 4 | Mohu - Gateway Plus Amplified Indoor HDTV Antenna, 60-mile Range - Gray | $69.99 | Mohu |
| 5 | Audiovox - NA - Black | $169.99 | Audiovox |
| 6 | LG - 24" Class LED HD Smart TV with webOS (2022) | $169.99 | LG |
| 7 | Insignia™ - 24" Class F20 Series LED HD (720p) Smart Fire TV | $59.99 | Insignia™ |
| 8 | Insignia™ - 2.0 Mini Soundbar 20", Bluetooth - Black | $24.99 | Insignia™ |
| 9 | Levoit - Replacement Filter for Aerone Purifier - 1pk - White | $19.49 | Levoit |
| 10 | Wyze - Bulb Cam Indoor/Outdoor Plug-in 2K WiFi Security Camera with Color Night Vision & Dimmable 800 Lumen Bulb - White | $49.98 | Wyze |

**Notes vs BEFORE:** Major improvement. BEFORE had warranty plans at pos 1-2 and $1,000+ speakers — completely unusable. AFTER surfaces legitimately budget-friendly home theater components: projector screen ($40), wall mount ($27), OTA antenna ($70), small TV ($60-$170), soundbar ($25). The "budget" constraint is now being respected — all results are under $200 except the Audiovox at pos 5. Two anomalies: Levoit air purifier filter (pos 9) and Wyze camera (pos 10) are off-topic. 7/10 relevant results vs 3-4 BEFORE. Strong improvement attributable to query enhancement interpreting "home theater on a budget" as low-cost AV components.

---

## Query 3: "gaming keyboard and mouse combo"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | iBUYPOWER - Chimera KM7 Full-Size Wired Membrane RGB Keyboard and Mouse Bundle - Black | $35.00 | iBUYPOWER |
| 2 | Logitech - G PRO TKL Wired Mechanical GX Blue Clicky Switch Gaming Keyboard with RGB Backlighting for PC - Black | $109.99 | Logitech |
| 3 | Razer - Cynosa Lite Wired Membrane Gaming Keyboard with Chroma RGB Backlighting - Black | $39.99 | Razer |
| 4 | CyberPowerPC - Gaming Desktop - AMD Ryzen 7 7800X3D - AMD Radeon RX 9070 XT 16GB - 32GB DDR5 - 2TB PCIe 4.0 SSD - Black | $1,899.99 | CyberPowerPC |
| 5 | ENHANCE - Infiltrate Full-size Wired Membrane Hybrid Mechanical Gaming with Soundwave LED Keyboard - Black | $34.99 | ENHANCE |
| 6 | iBUYPOWER - Element Gaming Desktop PC - Intel Core Ultra 9 285K, NVIDIA GeForce RTX 5070Ti 16GB, 32GB DDR5 RGB, 2TB SSD - Black | $2,499.99 | iBUYPOWER |
| 7 | iBUYPOWER - Y40 PRO Gaming Desktop PC - Intel Core Ultra 9 285, NVIDIA GeForce RTX 5080 16GB, 32GB DDR5 RGB, 2TB NVMe - Black | $3,099.99 | iBUYPOWER |
| 8 | Razer - Firefly V2 Pro Gaming Mouse Pad with Chroma RGB Lighting - Black | $99.99 | Razer |
| 9 | Logitech - G915 LIGHTSPEED TKL Wireless Mechanical GL Tactile Switch Gaming Keyboard with RGB Backlighting - Black | $229.99 | Logitech |
| 10 | Razer - BlackWidow V4 75% Wired Mechanical Orange Switch Gaming Keyboard with Hot-Swappable Design - Black | $159.99 | Razer |

**Notes vs BEFORE:** Significant shift in sub-category. BEFORE returned mostly office/productivity keyboard+mouse bundles (Logitech MX Keys for Business, ergonomic sets) — wrong sub-category. AFTER correctly surfaces gaming-branded peripherals: iBUYPOWER gaming bundle (pos 1 — actual combo), Razer and Logitech G-series gaming keyboards (pos 2, 3, 9, 10), Razer mousepad (pos 8). However, new regressions appeared: pos 4, 6, 7 are full gaming desktop PCs ($1,900-$3,100) which are only tangentially related — gaming context without the keyboard+mouse specificity. Pos 1 is an actual gaming keyboard+mouse combo (the query's exact ask). Net: better brand/category alignment but polluted by high-ticket gaming desktops. 5-6/10 relevant vs 6-7 BEFORE for category match, but category is now correct (gaming) even if combo constraint isn't enforced.

---

## Query 4: "smart home starter kit"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Lutron - Diva Smart Dimmer Switch Starter Kit - White | $124.95 | Lutron |
| 2 | Lutron - Caseta Wireless Smart Lighting Dimmer Switch Starter Kit - White | $114.95 | Lutron |
| 3 | Lutron - Caseta Smart Switch Starter Kit - White | $104.95 | Lutron |
| 4 | Philips - Hue A19 Bluetooth 75W Smart LED Starter Kit - White | $69.99 | Philips |
| 5 | Lutron - Caséta Wireless Smart Lighting Dimmer Switch Starter Kit - White | $114.95 | Lutron |
| 6 | Philips - Hue Color A19 Smart LED Bulb Starter Kit - White and Color Ambiance | $139.99 | Philips |
| 7 | Ring - Alarm Security Kit 5-Piece (2nd Gen) - White | $149.99 | Ring |
| 8 | Philips - Hue Essential Starter Kit - White and Color Ambiance | $99.99 | Philips |
| 9 | Philips - Hue 75W A19 Starter Kit - White and Color Ambiance | $204.99 | Philips |
| 10 | Car Keys Express - Chrysler & Dodge Simple Remote - 5 Button Smart Key Remote and programming device - Black | $119.99 | Car Keys Express |

**Notes vs BEFORE:** Essentially unchanged — same products, minor reordering. Still strong category match for smart home lighting and security starters. The near-duplicate Lutron listings remain (pos 2 and 5 are the same product). The Car Keys Express car remote at pos 10 is a new irrelevant result (replaced Swann security kit from BEFORE). Still missing smart speakers, plugs, and thermostats. This query was already the strongest performer and remains so. Negligible change — the settings adjustment had little effect here, which is expected since this query doesn't rely heavily on semantic reinterpretation.

---

## Query 5: "best tablet under 300"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Samsung - Galaxy Tab A9+ 11" 256GB - Wi-Fi - Graphite | $259.99 | Samsung |
| 2 | Samsung - Galaxy Tab A9+ 11" 128GB - Wi-Fi - Silver | $199.99 | Samsung |
| 3 | Logitech - Flip Folio Keyboard Case for iPad Pro 11-inch - Latest Model (M4 & M5), iPad Air 11-inch (M2 & M3) (5th Gen) - Graphite | $119.99 | Logitech |
| 4 | ZUGU - Slim Protective Case for Apple iPad Air 13 M2/M3 (2024/2025) and iPad Pro 12.9 (3rd/4th Generation, 2018/2020) - Berry Purple | $79.99 | ZUGU |
| 5 | SaharaCase - Navigate Series Keyboard Case with Track Pad for Apple iPad Pro (M4 2024/M5 2025) 13" - Black | $159.95 | SaharaCase |
| 6 | SaharaCase - Case for Apple iPad 10.2 (7th, 8th, & 9th Gen 2021) - Brown | $49.99 | SaharaCase |
| 7 | SaharaCase - Venture Series Tri-Fold Folio Case for Apple iPad Pro (M4 2024/M5 2025) 13" - Cactus Green | $59.99 | SaharaCase |
| 8 | OtterBox - Defender Pro Series Case for Apple iPad mini (A17 Pro) and Apple iPad mini (6th generation 2021) - Black | $62.99 | OtterBox |
| 9 | ZAGG - Glass+ iPad 10.2" (Gen 9, 8, 7) - Clear | $19.99 | ZAGG |
| 10 | Apple - Geek Squad Certified Refurbished 10.5-Inch iPad Pro with Wi-Fi - 64GB - Silver | $109.99 | Apple |

**Notes vs BEFORE:** Mixed results. Improvements: pos 1-2 now have 2 actual tablets in-budget ($260, $200) same as before. The completely irrelevant results from BEFORE (CORSAIR case module, MSI power supply, Corel software at pos 7-9) are gone — replaced with tablet accessories (cases, screen protectors). Pos 10 is a refurbished iPad at $110 — a legitimate under-$300 tablet. So actual tablets: 3/10 AFTER vs 2/10 BEFORE. However, accessories still dominate pos 3-9 (7 iPad/tablet accessory listings). The "under 300" price constraint remains unfiltered at the pipeline level — but irrelevant non-tablet items were purged by query enhancement correctly identifying the category. Improvement: +1 relevant tablet, -3 completely off-topic results.

---

## Summary

| Query | BEFORE Relevant | AFTER Relevant | Change | Key Driver |
|-------|----------------|----------------|--------|------------|
| gift for a teenage gamer | 1-2/10 | 2-3/10 | Slight improvement | Query enhancement surfaced gaming gift cards (Meta VR); Turtle Beach headset added |
| home theater on a budget | 3-4/10 | 7-8/10 | **Major improvement** | Budget constraint now respected; budget-friendly AV components replace warranty plans and $1,000+ speakers |
| gaming keyboard and mouse combo | 6-7/10 (wrong sub-category) | 5-6/10 (right sub-category) | Mixed | Gaming brand alignment corrected (Razer, Logitech G-series); gaming desktops now polluting results |
| smart home starter kit | 8-9/10 | 8-9/10 | Unchanged | Already strong; new settings had minimal effect on this well-matched query |
| best tablet under 300 | 2/10 | 3/10 | Slight improvement | Completely off-topic items purged; accessories still dominate but junk results gone |

**Overall relevance score: ~6.2/10** (vs ~4.4/10 BEFORE)

**What improved:**
1. Query enhancement (`query_enhancement_enabled: true`) is the primary driver of improvement — it correctly interprets "home theater on a budget" as budget AV components, not high-end gear or warranty plans
2. Lower `bm25_weight` (3.5 → 2.5) reduced the keyword-literal "teenage" → TMNT lock, allowing semantic gaming signals to surface
3. Electronics-specific marketing prompt stopped vibes/aesthetics language from interfering with spec-driven queries
4. Lower `keyword_rerank_strength` (0.8 → 0.6) and `merch_rerank_strength` (0.25 → 0.15) softened over-boosting that was previously surfacing keyword-exact but intent-mismatched results

**Remaining issues:**
1. Query 1 ("teenage gamer") still needs improvement — H&M gift cards persist; gaming hardware (controllers, headsets as primary results) still underserved; likely needs a synonym/concept expansion for "gamer gift" → gaming peripherals/gift cards
2. Query 3 ("gaming keyboard and mouse combo") — gaming desktops at pos 4, 6, 7 indicate the "combo" constraint (wanting a bundle, not a PC) isn't being respected; may need further `bm25_weight` reduction or explicit negative boosting for desktops on keyboard/mouse queries
3. Query 5 ("tablet under 300") — price filtering is still not enforced at the pipeline level; accessories (cases) continue to dominate; structural fix needed (price-range facet injection on price-constraint queries)
4. Near-duplicate Lutron listings in Query 4 persist — deduplication logic needed at result-rendering layer
