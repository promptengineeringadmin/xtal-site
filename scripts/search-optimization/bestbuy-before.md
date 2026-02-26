# Best Buy BEFORE Diagnostic (Current Settings)

**Date:** 2026-02-26
**Current backend settings:**
- query_enhancement_enabled: false
- merch_rerank_strength: 0.25
- bm25_weight: 3.5
- keyword_rerank_strength: 0.8
- Marketing prompt: default (vibes/aesthetics)
- Brand prompt: empty

---

## Query 1: "gift for a teenage gamer"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Sony - PlayStation PC Marvel Spiderman Miles Morales [Digital] | $20.00 | Sony |
| 2 | H&M - $25 Gift Card [Digital] | $20.00 | H&M |
| 3 | H&M - $50 Gift Card [Digital] | $40.00 | H&M |
| 4 | Riot Games - Valorant $25 (Digital Delivery) [Digital] | $25.00 | Riot Games |
| 5 | NECA - Teenage Mutant Ninja Turtles 7" The Last Ronin - Ultimate Foot Bot | $27.99 | NECA |
| 6 | TOMY - Club Mocchi Mocchi - Leonardo 11" Plush | $27.99 | TOMY |
| 7 | Funko - POP! Movies: Teenage Mutant Ninja Turtles Mutant Mayhem - Raphael - Multi | $11.99 | Funko |
| 8 | NECA - Teenage Mutant Ninja Turtles 1/4 Scale Action Figure - Baby Turtle Accessory Set (1990 Movie) | $41.99 | NECA |
| 9 | Wizards of The Coast - Magic: The Gathering | Teenage Mutant Ninja Turtles - Play Booster Sleeve | $6.99 | Wizards of The Coast |
| 10 | Wizards of The Coast - Magic: The Gathering | Teenage Mutant Ninja Turtles - Tin - Styles May Vary | $20.99 | Wizards of The Coast |

**Notes:** Results severely keyword-biased — "teenage" latched onto TMNT collectibles. No actual gaming hardware (controllers, headsets, gaming chairs) or gaming-specific gift cards (Xbox, PlayStation Store, Steam). Only 1 marginally relevant result (Spider-Man game at pos 1). H&M gift cards at pos 2-3 are completely off-topic.

---

## Query 2: "setting up a home theater on a budget"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Monthly Best Buy Protection (up to 24 mo.) | $8.99 | BBY Protection |
| 2 | 2-Year Standard Geek Squad Protection | $279.99 | Geek Squad® |
| 3 | Insignia™ - 3-Device Universal Remote - Black | $19.99 | Insignia™ |
| 4 | MartinLogan - Motion Foundation C1 2.5-Way Center Channel Speaker with Dual 5.5" Midbass Drivers (Each) - Satin White | $549.99 | MartinLogan |
| 5 | MartinLogan - Motion Foundation F2 3-Way Floorstanding Speaker with 5.5" Midrange and Triple 6.5" Bass Drivers (Each) - Black | $1,149.99 | MartinLogan |
| 6 | MartinLogan - Motion Foundation F1 3-Way Floorstanding Speaker with 5.5" Midrange and Triple 5.5" Bass Drivers (Each) - Satin White | $849.99 | MartinLogan |
| 7 | Best Buy essentials™ - Thin Indoor HDTV Antenna - 35 Mile Range - Black/White | $19.99 | Best Buy essentials™ |
| 8 | AudioQuest - Rocket 33 15' Speaker Cable with Banana > Banana SureGrip 300 Connectors - Red on Black | $1,219.95 | AudioQuest |
| 9 | AudioQuest - Rocket 33 10' Speaker Cable with Banana > Banana SureGrip 300 Connectors - Red on Black | $484.98 | AudioQuest |
| 10 | Amazon - Fire HD 8 tablet, 8" HD Display, 3GB memory, 32GB, designed for portable entertainment (2024 release) - Emerald | $99.99 | Amazon |

**Notes:** "Budget" signal completely ignored — top results include $1,150+ speakers and $1,220 cables. Pos 1-2 are warranty/protection plans (irrelevant). No TVs, no soundbars, no budget AV receivers. The model does not understand the price constraint intent.

---

## Query 3: "gaming keyboard and mouse combo"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Best Buy essentials™ - Full-size Wireless Membrane Keyboard and Mouse Bundle with USB Receiver - Black | $19.99 | Best Buy essentials™ |
| 2 | Logitech - MK250 Full-size Bluetooth Wireless Keyboard and Mouse Combo for Windows/MacOS with Fast & Easy Connectivity - Rose | $19.99 | Logitech |
| 3 | Logitech - MX Keys Combo for Business Full-size Wireless Scissor Keyboard and Mouse Bundle for Windows/Mac/Chrome/Linux - Graphite | $199.99 | Logitech |
| 4 | Logitech - MK710 Full-size Ergonomic Wireless Membrane Keyboard and Mouse Bundle for PC with 3-Year Battery Life - Black | $84.99 | Logitech |
| 5 | Logitech - Wave Keys and Lift Vertical Mouse Wireless Ergonomic Keyboard and Mouse Bundle with Cushioned Palm Rest - Graphite | $99.99 | Logitech |
| 6 | Logitech - Wave Keys MK670 Combo Ergonomic Wireless Membrane Keyboard and Mouse Bundle for PC/Mac with Integrated Palm-rest - Graphite | $89.99 | Logitech |
| 7 | Logitech - MK270 Full-size Wireless Membrane Keyboard and Mouse Bundle for PC - Black | $19.99 | Logitech |
| 8 | Logitech - Signature Slim MK955 For Business Full-Size Wireless Scissor Keyboard and Mouse Bundle With Quiet Typing & Clicking - Graphite | $119.99 | Logitech |
| 9 | Adesso - Tru-Form Media WKB-1150CB Ergonomic Wireless Membrane Optical Keyboard and Mouse - Black | $62.99 | Adesso |
| 10 | Logitech - Wave Keys and Lift Vertical Mouse Wireless Ergonomic Keyboard and Mouse Bundle with Cushioned Palm Rest - Off-White | $99.99 | Logitech |

**Notes:** This query performed best — keyboard+mouse combos are correctly returned. However, none of these are gaming peripherals (RGB, mechanical switches, gaming-brand marketed). Results skew office/productivity (MX Keys for Business, ergonomic bundles). No Razer, SteelSeries, Corsair, or HyperX gaming sets surfaced.

---

## Query 4: "smart home starter kit"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Lutron - Caseta Wireless Smart Lighting Dimmer Switch Starter Kit - White | $114.95 | Lutron |
| 2 | Lutron - Caséta Wireless Smart Lighting Dimmer Switch Starter Kit - White | $114.95 | Lutron |
| 3 | Philips - Hue Essential Starter Kit - White and Color Ambiance | $99.99 | Philips |
| 4 | Lutron - Diva Smart Dimmer Switch Starter Kit - White | $124.95 | Lutron |
| 5 | Philips - Hue Color A19 Smart LED Bulb Starter Kit - White and Color Ambiance | $139.99 | Philips |
| 6 | Philips - Hue 75W A19 Starter Kit - White and Color Ambiance | $204.99 | Philips |
| 7 | Lutron - Caseta Smart Switch Starter Kit - White | $104.95 | Lutron |
| 8 | Philips - Hue A19 Bluetooth 75W Smart LED Starter Kit - White | $69.99 | Philips |
| 9 | Swann - Home 4-Channel, 4-Camera Indoor/Outdoor 1080p DVR 1TB HDD with Video Doorbell & Alarm New Home Security Starter Kit - White | $449.99 | Swann |
| 10 | Ring - Alarm Security Kit 5-Piece (2nd Gen) - White | $149.99 | Ring |

**Notes:** Solid category-match — all results are legitimately smart home starter kits. Pos 1-2 are near-duplicate Lutron listings (same product, different accent on "é"). Category coverage is narrow: only lighting (Lutron/Philips) and security (Swann/Ring). Missing: smart speakers (Amazon Echo, Google Nest), smart plugs, smart thermostats (Nest/Ecobee), multi-device hubs. Best performing query of the set.

---

## Query 5: "best tablet under 300"

| Pos | Title | Price | Vendor |
|-----|-------|-------|--------|
| 1 | Samsung - Galaxy Tab A9+ 11" 256GB - Wi-Fi - Graphite | $259.99 | Samsung |
| 2 | SaharaCase - Kids Protective Non-Toxic EVA Foam Case for Samsung Galaxy Tab A11+ & Galaxy Tab A9+ (Shockproof) - Black | $39.95 | SaharaCase |
| 3 | SaharaCase - Long Arm Stand Holder for Most Cell Phones and Tablets - Black | $49.99 | SaharaCase |
| 4 | Samsung - Galaxy Tab A9+ 11" 128GB - Wi-Fi - Silver | $199.99 | Samsung |
| 5 | Amazon - Fire HD 10 Cover | Protective Cover (Fits the Fire HD 10 tablet 2023 release) - Black | $39.99 | Amazon |
| 6 | Logitech - Flip Folio Keyboard Case for iPad Pro 11-inch - Latest Model (M4 & M5), iPad Air 11-inch (M2 & M3)(5th Gen) - Graphite | $119.99 | Logitech |
| 7 | CORSAIR - NAUTILUS RS LCD Module - Black | $49.99 | CORSAIR |
| 8 | Corel - Draw GO - Windows, Mac OS [Digital] | $69.99 | Corel |
| 9 | MSI - MAG A650GLS PCIE5 650W ATX 3.1 & PCIe 5.1 Ready Fully modular 80 Plus Gold Energy Efficiency Gaming Power Supply - Black | $109.99 | MSI |
| 10 | Insignia™ - 22-Key Bluetooth Scissor Switch Number Keypad for Windows, macOS, ChromeOS, iPadOS and Android - Black | $19.99 | Insignia™ |

**Notes:** Two actual tablets at pos 1 and 4 (both Samsung Galaxy Tab A9+). Pos 2-3 are tablet accessories (cases), 5 is another accessory. Pos 6 is an iPad keyboard case — tangentially related. Pos 7-9 are completely irrelevant (PC power supply, graphics software, Corsair case module). "Under 300" constraint ignored — no price filtering, and other in-budget tablets (Amazon Fire HD 10 at $149, Lenovo Tab M10) are missing. Only 2 of 10 results are actual tablets.

---

## Summary Assessment

| Query | Relevant Results (of 10) | Key Issues |
|-------|--------------------------|------------|
| gift for a teenage gamer | 1-2 | "teenage" → TMNT keyword match; no gaming hardware |
| home theater on a budget | 3-4 | "budget" ignored; warranty plans at top; $1000+ items |
| gaming keyboard and mouse combo | 6-7 | Right category, wrong sub-category (office not gaming) |
| smart home starter kit | 8-9 | Good! Narrow coverage, near-duplicate at pos 1-2 |
| best tablet under 300 | 2 | Price constraint ignored; accessories pollute results |

**Overall relevance score: ~4.4/10**

**Root causes:**
1. `query_enhancement_enabled: false` — no LLM stage to expand/reinterpret intent (e.g., "teenage gamer" → gaming hardware, not TMNT)
2. `bm25_weight: 3.5` — over-weighting BM25 causes keyword-literal matches ("teenage" → TMNT) that override semantic intent
3. Default marketing prompt tuned for "vibes/aesthetics" (Willow home goods) — poor fit for Best Buy's spec/performance catalog
4. No price-constraint understanding at any pipeline stage
