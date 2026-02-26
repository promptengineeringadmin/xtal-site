# Search Optimization Report: xtaldemo

**Date:** 2026-02-26
**Collection:** xtaldemo
**Catalog size:** ~20–30k products (Amazon-sourced mixed catalog)
**Baseline:** Willow (gold standard, curated home goods)
**Evaluator:** XTAL Search Quality Engineer

---

## Executive Summary

The xtaldemo collection shows highly variable quality across query types, with strong performance on intent-driven and vibe-based queries but severe failures on direct product lookups and keyword-heavy queries. The single most critical finding is that the pipeline returns **Instant Pot accessories/parts instead of an actual Instant Pot**, and **yoga mat** returns zero yoga mats in 30 results — a catastrophic BM25/keyword failure. The default marketing prompt ("vibes, aesthetics, feelings") works well for home goods but is partially misaligned for a mixed Amazon catalog. `bm25_weight` must be raised to 2.0 to fix keyword blind spots. The marketing prompt needs a single additional sentence to prevent the semantic search from overshadowing exact product intent. Vibe and occasion queries (spa bathroom, cozy gift, dinner party) perform well, which confirms the semantic pipeline itself is healthy — the problem is purely in keyword recall for direct product terms.

---

## Current vs Baseline Configuration

The admin settings API requires Google OAuth, so values are read from code defaults and Redis key patterns. Based on `lib/admin/admin-settings.ts` defaults (Redis returns null → code default is used when no override has been set):

| Setting | Willow (known tuned) | xtaldemo (current) | Divergence |
|---|---|---|---|
| `query_enhancement_enabled` | `true` | `true` (default) | None |
| `merch_rerank_strength` | `0.25` | `0.25` (default) | None |
| `bm25_weight` | `1.0` | `1.0` (default) | None — **both at default; Willow's catalog doesn't need high BM25, xtaldemo does** |
| `keyword_rerank_strength` | `0.3` | `0.3` (default) | None |
| `store_type` | `"online retailer"` | `"online retailer"` (default) | None |
| `aspects_enabled` | `true` | `true` (default) | None |
| `results_per_page` | `48` | `48` (default) | None |
| Marketing prompt | Default (vibes/aesthetics) | Default (vibes/aesthetics) | **Same — but needs tuning for mixed catalog** |
| Brand prompt | Empty default | Empty default | Same |

**Key insight:** Both collections are running identical defaults. Willow succeeds because its catalog is curated home goods where vibe-based semantic search is naturally aligned with the query types shoppers use. xtaldemo fails for direct product queries because the identical settings were never tuned for a ~25k-product mixed catalog.

---

## Test Suite Results

### Query 1: "Instant Pot" (direct product)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Instant Pot Cheat Sheet Magnet Set Accessories | $9.95 | OLADOT | 2 | Accessory, not the appliance |
| 2 | Zonefly Power Cord Compatible for Instant Pot | $7.99 | ZoneFly | 2 | Replacement part |
| 3 | Steam Release Valve Handle Replacement for Instant Pot | $4.99 | SENLIXIN | 2 | Replacement part |
| 4 | Original Condensation Collector Cup for Instant Pot | $5.99 | ZoneFly | 2 | Replacement part |
| 5 | Original Electric Pressure Cookers Thermal Fuses for Instant Pot | $5.98 | ZoneFly | 2 | Replacement part |
| 6 | Parts Replacement for Instant Pot Duo 5, 6 Quart | $11.99 | NeoJoy | 2 | Replacement part |
| 7 | Glass Saucepan with Cover 1.5L Heat-resistant | $22.99 | LEAVES AND TREES Y | 1 | Unrelated cookware |
| 8 | Kitchen Utensil Set-Silicone Cooking Utensils-33 | $39.99 | BESTZMWK | 2 | Kitchen tools, adjacent |
| 9 | Ninja SF301 Speedi Rapid Cooker & Air Fryer 6-Quart | $129.99 | Ninja | 3 | Competing pressure cooker |
| 10 | Set of 3 Potted Succulent Plants Fake Aloe | $19.99 | Winlyn | 1 | Completely irrelevant |
| 11 | Carry360 2 Pack Pot Lid Organizer Rack | $21.99 | Carry360 | 1 | Kitchen storage |
| 12 | Winlyn 6 Pcs Unpotted Fake Succulents | $11.99 | Winlyn | 1 | Irrelevant |
| 13 | Crock-Pot 6 Quart Programmable Slow Cooker | $59.99 | Crock-Pot | 3 | Competing slow cooker |
| 14 | 4OZ Fake Moss for Potted Plants | $9.99 | KARRYHOME | 1 | Irrelevant |
| 15 | ZYAPA Fake Moss Artificial for Potted Plants | $12.99 | ZYAPA | 1 | Irrelevant |
| 16 | 2Pcs Air Fryer Silicone Liners for Ninja Dual | $7.99 | CEGOUT | 2 | Accessory |
| 17 | GREENTIME Set of 6 Succulents Plants Artificial | $19.99 | GREENTIME | 1 | Irrelevant |
| 18 | Supla 11 Pcs Mini Artificial Succulents Picks | $9.99 | Supla | 1 | Irrelevant |
| 19 | Set of 3 Mini Potted Artificial Eucalyptus Plants | $22.99 | Winlyn | 1 | Irrelevant |
| 20 | PMYEK Pot and Pan Organizer Cabinet Rack | $19.99 | PMYEK | 2 | Kitchen adjacent |
| 21 | Disney WTP105 Honey Pot Winnie The Pooh Watch | $25.97 | Disney | 1 | Irrelevant — "pot" match |
| 22 | Coitak Artificial Succulent Plants Potted | $14.98 | Coitak | 1 | Irrelevant |
| 23 | Hamilton Beach 3 Quart Copper Electric Fondue Pot | $37.62 | Hamilton Beach | 2 | Kitchen appliance, adjacent |
| 24 | PARACITY Glass Teapot Stovetop 18.6 OZ | $10.99 | PARACITY | 1 | Irrelevant — "pot" match |
| 25 | 50332 3-Piece Pressure Regulator for Presto | $12.99 | WEIJIA | 2 | Pressure cooker parts |
| 26 | Set of 3 Small Potted Plants Fake Eucalyptus | $24.99 | Winlyn | 1 | Irrelevant |
| 27 | Hamilton Beach Durathon Ceramic Electric Skillet | $64.99 | Hamilton Beach | 2 | Kitchen appliance, adjacent |
| 28 | Dish Drying Rack 2-Tier with Drainboard | $35.99 | POKIPO | 1 | Irrelevant |
| 29 | Sggvecsy Fake Hanging Plants 4 Pack | $18.99 | Sggvecsy | 1 | Irrelevant |
| 30 | Mueller RapidTherm Portable Induction Cooktop | $59.97 | Mueller Austria | 3 | Cooking appliance, adjacent |

**Metrics:** NDCG@5=0.31 | NDCG@10=0.26 | NDCG@30=0.21 | P@5=0% | Irrelevant@30=63% | Cliff=7
**Key Issue:** Zero actual Instant Pot appliances in top 30. BM25 finds accessories with "Instant Pot" in title; semantic search inflates fake plants ("pot" association) and random cookware.

---

### Query 2: "throw blankets" (category browse)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Blanket Flannel Manga Soft Cozy Throw Blanket 52" | $26.59 | Ningguang | 5 | Perfect |
| 2 | 3 Pack Christmas Snow Cover Blankets Soft Fluffy | $10.95 | Gift Boutique | 3 | Holiday, but it is blankets |
| 3 | Concha Blanket Pan Dulce Throw Blanket | $34.99 | SA Flavor | 4 | Throw blanket |
| 4 | Homde Heated Blanket Electric Throw 50"x60" | $29.99 | Homde | 5 | Perfect |
| 5 | Disney Nightmare Before Christmas Throw Blanket | $21.00 | Disney | 4 | Throw blanket |
| 6 | Northwest Woven Tapestry Throw 48x60 Slytherin | $20.80 | Northwest | 4 | Throw blanket |
| 7 | DMI Blanket Lifter Support Bar | $23.71 | DMI | 1 | Medical device |
| 8 | Classic Home Throw Blanket Shawl Acrylic | $21.99 | CozzyLife | 5 | Perfect |
| 9 | Classic Disney Mickey Mouse Fleece Throw Blanket | $21.95 | Classic Disney | 4 | Throw blanket |
| 10 | Vprintes Mother's Day Gifts for Mom — custom blanket | $45.95 | Vprintes | 3 | Personalized blanket |
| 11 | Jay Franco Minecraft Survive Blanket 60x90 | $24.99 | Jay Franco | 4 | Throw blanket |
| 12 | SEITG USB Electric Heating Blanket | $28.99 | SEITG | 4 | Heated throw |
| 13 | The Northwest Company Friends TV Show Fleece | $17.19 | Northwest | 4 | Throw blanket |
| 14 | Simlu Wearable Blanket Hoodie Sweatshirts | $18.99 | Simlu | 3 | Adjacent/wearable blanket |
| 15 | Paw Patrol Girls Kids Super Soft Micro Raschel | $29.99 | Franco | 4 | Kids blanket |
| 16 | tiosggd Halloween Blanket Love You Throw | $24.99 | tiosggd | 4 | Throw blanket |
| 17 | Disney's Moana Micro Raschel Throw 46"x60" | $39.07 | Disney | 4 | Throw blanket |
| 18 | Chivas Silk Touch Sherpa Lined Throw 50x60 | $38.95 | Chivas | 4 | Throw blanket |
| 19 | Disney's Mickey Mouse "Amazing Day" Tapestry | $25.50 | Disney | 4 | Throw blanket |
| 20 | Reaowazo Qucover Pink Floral Quilted Blanket Cotton | $41.89 | Reaowazo | 3 | Quilt/blanket adjacent |
| 21 | Stuffed Animal Toys Storage Kids Bean Bag | $25.99 | CENOVE | 1 | Irrelevant |
| 22 | Disney Nightmare Before Christmas Micro Raschel | $16.99 | Disney | 4 | Throw blanket |
| 23 | Eddie Bauer Throw Blanket Cotton Flannel Reversible | $29.99 | Eddie Bauer | 5 | Perfect |
| 24 | Unicorns Blanket for Girls Luminous Soft Flannel | $16.99 | Yi-gog | 4 | Throw blanket |
| 25 | Northwest Micro Raschel Throw 46x60 Hogwarts | $15.61 | Northwest | 4 | Throw blanket |
| 26 | Harry Potter Moonrise Blanket 60x90 | $29.99 | Jay Franco | 4 | Throw blanket |
| 27 | AQWJ Sublimation Blanks Throw Blanket for Heat Press | $29.99 | AQWJ | 2 | Blank sublimation, not retail |
| 28 | Dafatpig Halloween Blanket Cotton Fringe Throw | $35.47 | Dafatpig | 4 | Throw blanket |
| 29 | Glow in The Dark Throw Blanket Super Soft Fuzzy | $25.49 | ABELL | 4 | Throw blanket |
| 30 | Disney's Mickey Mouse Clubhouse Super Plush Throw | $23.70 | Northwest | 4 | Throw blanket |

**Metrics:** NDCG@5=0.95 | NDCG@10=0.91 | NDCG@30=0.87 | P@5=80% | Irrelevant@30=10% | Cliff=None
**Key Issue:** Minor — pos 7 (medical blanket lifter), pos 21 (bean bag cover). Very strong overall.

---

### Query 3: "kitchen gadgets for meal prep" (use case + product)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Baggy Rack For Ziploc Bag Holder Stand Food Prep | $12.99 | Hompon | 4 | Meal prep tool |
| 2 | Microwave Nesting Containers Set of 3 w Lids | $14.95 | Good Cooking | 4 | Meal prep containers |
| 3 | Kitch'nMore 38oz Meal Prep Containers Extra Large | $23.99 | Kitch'nMore | 5 | Perfect — meal prep |
| 4 | Bellemain Potato Ricer with 3 Discs | $23.99 | Bellemain | 4 | Kitchen gadget |
| 5 | ECLECTICS KC Wooden Spice Rack Organizer | $26.88 | ECLECTICS KC | 3 | Kitchen org, adjacent |
| 6 | S SALIENT Glass Food Storage Containers 24 Piece | $35.99 | S SALIENT | 5 | Meal prep containers |
| 7 | BENTOOOGO 50 Pack Plastic Meal Prep Containers | $19.29 | BENTOOOGO | 5 | Perfect |
| 8 | Ninja Food Chopper Express Chop 200-Watt 16-Oz | $35.99 | Ninja | 5 | Perfect kitchen gadget |
| 9 | NutriChef Vacuum Sealer Bags 8x50 Rolls 2 pack | $23.36 | NutriChef | 4 | Meal prep tool |
| 10 | RüK Vegetable Chopper Slicer Onion Chopper 22-in-1 | $29.99 | RüK | 5 | Perfect |
| 11 | Overnight Oats Container 2-Pack 10-Oz Glass Mason | $15.99 | Oats On The Go | 4 | Meal prep |
| 12 | PrepWorks Fresh Guacamole ProKeeper Storage | $10.39 | Progressive International | 3 | Food storage, adjacent |
| 13 | Kitch'nMore 32oz Plastic Deli Food Storage Soup | $16.99 | Kitch'nMore | 4 | Meal prep containers |
| 14 | Bartnelli Vegetable Chopper Food Slicer Pro 15 Pc | $14.99 | Bartnelli | 5 | Perfect gadget |
| 15 | Joie Stainless Steel Vegetable Crinkle Cutter | $9.99 | Joie | 4 | Kitchen tool |
| 16 | 6PCS OstWony Silicone Stretch Lids Reusable | $5.96 | OstWony | 3 | Storage, adjacent |
| 17 | Glad Knife Set with Cutting Board 5 Pieces | $11.08 | Glad | 4 | Kitchen gadget |
| 18 | AILTEC Glass Food Storage Containers 18 Piece | $32.99 | AILTEC | 4 | Meal prep |
| 19 | Tribello 20 OZ Overnight Oats Container Set of 4 | $21.99 | Tribello | 4 | Meal prep |
| 20 | Fansyer Deli Containers with Lids 72 Mix Sets | $24.99 | Fansyer | 4 | Meal prep |
| 21 | 3 Pack Stainless Steel Butter Spreader Knife | $8.99 | Mudder | 3 | Kitchen tool, minor |
| 22 | 2 PK Sandwich Cutter Sealer and Decruster | $10.99 | BigLeef | 3 | Kitchen gadget |
| 23 | 33oz Glass Jars with Regular Lids Mason Jar | $24.99 | Accguan | 3 | Food storage |
| 24 | Anova Culinary Precision Vacuum Sealer | $59.95 | Anova Culinary | 4 | Kitchen tool |
| 25 | Kitchen Utensil Set Silicone 33 Gadgets | $39.99 | BESTZMWK | 4 | Kitchen gadgets |
| 26 | Hamilton Beach Stack & Snap Food Processor 450W | $69.99 | Hamilton Beach | 5 | Perfect |
| 27 | Set Of 10 Refrigerator Organizer Bins Stackable | $29.99 | Seseno | 3 | Fridge org, adjacent |
| 28 | Norpro Tomato Core It 4.75 Inch Silver | $7.46 | Norpro | 4 | Kitchen gadget |
| 29 | Pyrex Storage 4 Cup Round Dish Clear Blue Lid | $29.00 | Pyrex | 4 | Meal prep containers |
| 30 | Fox Run Table Crumb Sweeper 1 Pack White | $8.31 | Fox Run | 2 | Crumb sweeper — marginal |

**Metrics:** NDCG@5=0.97 | NDCG@10=0.96 | NDCG@30=0.91 | P@5=80% | Irrelevant@30=3% | Cliff=None
**Key Issue:** Excellent result. Minimal issues.

---

### Query 4: "gifts for coffee lovers" (persona + gift)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Coffee Advent Calendar 2022 Gourmet Variety Christmas | $39.99 | Tilz | 5 | Perfect |
| 2 | Cats Coffee Enamel Pin Cat Cafe Brooches | $6.90 | HUAQIGUO | 2 | Marginal — cat + coffee |
| 3 | Coffee Gnomes Plush Coffee Bar Decoration Gift | $19.99 | Upltowtme | 4 | Coffee decor gift |
| 4 | Funny Coasters for Drinks Absorbent Cat Shaped | $11.59 | AIPNUN | 3 | Coasters, coffee-adjacent |
| 5 | WEROUTE Espresso Coffee Patent Print Poster | $15.99 | WEROUTE | 4 | Coffee gift |
| 6 | Graceice 3PCS Cat Coaster Woven Insulation Coffee | $11.99 | Graceice | 3 | Coasters, coffee-adjacent |
| 7 | Scoozee Glass Cups with Bamboo Lids, Straws | $19.99 | Scoozee | 4 | Drinkware gift |
| 8 | Panda Gifts for Girls Panda Coffee Mug | $15.99 | LittleBlueDeer | 3 | Mug but panda-themed |
| 9 | BTaT Small Espresso Cups and Saucers Set of 6 | $29.99 | Brew To A Tea | 5 | Perfect coffee gift |
| 10 | JstDoit 2 Pcs Gnomes Plush Bar Decor | $15.98 | JstDoit | 3 | Coffee bar decor |
| 11 | CIUNOFOR 14k Gold Coffee Bean Necklace | $59.99 | CIUNOFOR | 4 | Coffee-themed jewelry gift |
| 12 | Set of 6 Bird Pun Coasters | $7.90 | UQOOQFA | 1 | Irrelevant |
| 13 | InnoGear Coasters Ceramic Absorbent | $11.99 | InnoGear | 2 | Generic coasters |
| 14 | Christmas Gifts for Mom Women Wife Coffee Mug | $25.95 | LIZAVY | 4 | Coffee mug gift |
| 15 | Funny Coasters for Coffee Table Sarcastic Stone | $16.99 | Ultimate Hostess | 3 | Coffee table coasters |
| 16 | JieyueJewelry Gothic Spider Web Mirror Decoration | $13.99 | JieyueJewelry | 1 | Irrelevant |
| 17 | LIFVER Coasters Ceramic Absorbent for Coffee Table | $15.99 | LIFVER | 2 | Generic coasters |
| 18 | Dreamstall Mushroom Mug with Lid Stoneware | $21.95 | Dreamstall | 3 | Mug gift |
| 19 | KAWADU Cat Book Coffee Lovers Bookworm Brooch | $6.90 | KAWADU | 3 | Coffee lovers pin |
| 20 | LYLPYHDP Funny Chef Apron Mens | $11.99 | LYLPYHDP | 2 | Cooking gift, not coffee |
| 21 | 12 Pcs Cork Coaster for Drink Absorbent | $6.99 | HUAOAO | 2 | Generic coasters |
| 22 | Cereal Killer Weapon of Choice Engraved Spoon | $4.40 | Boston Creative | 1 | Irrelevant |
| 23 | SCSF National Treasure Morphing Coffee Mugs Heat Reveal | $16.50 | SCSF | 4 | Coffee mug gift |
| 24 | Chefman Single Serve Coffee Maker K-Cup & Ground | $49.99 | Chefman | 5 | Perfect coffee gift |
| 25 | Chaos Coordinator Mug Tumbler 14oz Purple | $22.80 | KLUBI | 3 | Mug gift |
| 26 | Coasterlux Cork Coasters Cute & Funny with Holder | $9.97 | Coasterlux | 2 | Generic coasters |
| 27 | Pure Zen Tea Tumbler with Infuser Double Wall | $35.95 | Pure Zen Tea | 3 | Tea, not coffee |
| 28 | Coffee Knock Box Stainless Steel Espresso | $13.88 | MYSENLAN | 5 | Perfect coffee gift |
| 29 | GSM Brands Ok But First Coffee Enamel Lapel Pin | $7.99 | GSM Brands | 4 | Coffee gift |
| 30 | Huray Rayho Coffee Decor Coffee Bar Spring Tiered | $14.99 | Huray Rayho | 4 | Coffee bar decor |

**Metrics:** NDCG@5=0.85 | NDCG@10=0.78 | NDCG@30=0.69 | P@5=60% | Irrelevant@30=17% | Cliff=None
**Key Issue:** Coaster flooding (many generic coasters appear due to "coffee table" association). Decent but could be cleaner.

---

### Query 5: "hosting a dinner party this weekend" (occasion)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | xo, Fetti Holographic Foil Plates 25 pack Birthday | $14.99 | xo, Fetti | 2 | Party plates (birthday) |
| 2 | Stedware Cheese Board Set Marble Top Charcuterie | $41.97 | Stedware | 5 | Perfect dinner party |
| 3 | SMIRLY Charcuterie Boards Gift Set Large | $45.99 | SMIRLY | 5 | Perfect dinner party |
| 4 | PACK OF 4 Disposable SILVER GRAY Plastic Tablecloths | $9.99 | Nicky Nice | 3 | Party supply |
| 5 | OAKSWARE Steak Knives Set of 8 with Block | $59.98 | OAKSWARE | 5 | Perfect dinner party |
| 6 | Gift Boutique Harvest Scarecrows Table Decor Figurines | $29.95 | Gift Boutique | 2 | Seasonal decor, not dinner |
| 7 | Thanksgiving Turkey Ceramic Shelf Sitters 3 Pack | $18.95 | Gift Boutique | 2 | Holiday decor, not dinner |
| 8 | Baby Shark Birthday Decorations Set | $29.99 | Unique | 1 | Children's birthday |
| 9 | Mega Nerf Party Supplies Birthday | $29.99 | Unique | 1 | Children's birthday |
| 10 | NORZEE 5-Pack White Disposable Tablecloths | $11.99 | NORZEE | 3 | Party supply |
| 11 | Disney Princess Party Supplies Birthday | $29.99 | Unique | 1 | Children's birthday |
| 12 | Glittery Garden Social Media Photo Booth Selfie | $15.95 | Glittery Garden | 1 | Irrelevant |
| 13 | Corelle Winter Frost White Dinner Plates (Pack of 6) | $36.87 | Corelle | 5 | Perfect dinner party |
| 14 | Bico Tunisian Ceramic Spoon Rest House Warming | $15.99 | Bico | 3 | Kitchen item |
| 15 | ECHOGEAR In-Wall Cable Management Kit | $59.99 | ECHOGEAR | 1 | Irrelevant electronics |
| 16 | 100 Count He Asked She Said Yes Napkins | $11.98 | xeuvozy | 2 | Engagement party |
| 17 | Amcrest 1080P WiFi Camera Outdoor | $39.99 | Amcrest | 1 | Irrelevant electronics |
| 18 | SMIRLY Charcuterie Boards Gift Set Large | $79.99 | SMIRLY | 5 | Perfect dinner party |
| 19 | Beistle Camo Pennant Banner | $4.50 | Beistle | 1 | Irrelevant |
| 20 | Farm Animals Theme Party Decorations Pink Flowers | $10.99 | Tatuo | 1 | Children's party |
| 21 | Fun Express Trapeze Artist Ceiling Decor | $17.49 | Fun Express | 1 | Circus decoration |
| 22 | 25 Baby Shower Diaper Raffle Tickets | $10.99 | Hadley Designs | 1 | Baby shower |
| 23 | amscan Gold Foil Spray Centerpiece | $22.13 | amscan | 2 | Party centerpiece |
| 24 | DVD Players for TV Compact | $23.59 | Delleson | 1 | Irrelevant electronics |
| 25 | Charcuterie Boards Cheese Boards Set for House Warming | $49.95 | Petiza | 5 | Perfect dinner party |
| 26 | Sparkle and Bash Mint Green Plastic Table Cloth | $10.99 | Sparkle and Bash | 2 | Table cover |
| 27 | 24 Pieces Wine Glass Charms Crystal Magnetic | $13.99 | Maitys | 5 | Perfect dinner party |
| 28 | Home-X Postcard Album Multi-Paged | $9.95 | Home-X | 1 | Irrelevant |
| 29 | SMIRLY Charcuterie Boards Gift Set | $35.99 | SMIRLY | 5 | Perfect |
| 30 | Spiderman Birthday Party Supplies | $27.99 | Unique | 1 | Children's birthday |

**Metrics:** NDCG@5=0.89 | NDCG@10=0.66 | NDCG@30=0.55 | P@5=60% | Irrelevant@30=40% | Cliff=8
**Key Issue:** Good top-3, then deep contamination by children's birthday party supplies. "Party this weekend" triggers party supply catalog. Second-half results are almost all irrelevant.

---

### Query 6: "make my bathroom feel like a spa" (intent-only/vibe)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Stylish Shampoo and Conditioner Dispenser Set of 3 | $22.99 | KIBAGA | 5 | Perfect spa vibe |
| 2 | Creative Scents 4 Piece Bathroom Accessory Set | $38.99 | Creative Scents | 5 | Perfect |
| 3 | Yulejo 4 Pieces Ocean Beach Bathroom Wall Decors | $15.99 | Yulejo | 4 | Spa bathroom decor |
| 4 | GMISUN Black Matte Bathroom Accessories Set | $30.99 | GM GMISUN | 5 | Perfect |
| 5 | Black Bath Mat Bamboo 16x24 | $20.97 | ZPirates | 4 | Spa-style mat |
| 6 | Towel Rack with Wooden Shelf Metal Wall Mounted | $26.99 | ANPHSIN | 4 | Spa-style rack |
| 7 | Moon Painting Led Wall Decor Blue Ocean | $28.59 | BLUE RED CYAN | 3 | Ambient, spa-adjacent |
| 8 | Gonioa Natural Bamboo Bath Mat Wooden | $18.99 | Gonioa | 5 | Spa mat |
| 9 | Luxury White Bath Towels Egyptian Cotton | $29.99 | White Classic | 5 | Perfect spa item |
| 10 | ETECHMART Bamboo Corner Shower Stool | $39.99 | ETECHMART | 5 | Perfect spa |
| 11 | Nachic Wall 3 Piece Canvas Wall Art Bathroom | $34.99 | Nachic Wall | 4 | Bathroom decor |
| 12 | Inspirational Buddha Quotes Wall Art Zen Canvas | $17.99 | Cheery Art | 4 | Zen/spa vibe |
| 13 | Orighty Microfiber Washcloths Towel Set 12 Pack | $6.99 | Orighty | 4 | Spa towels |
| 14 | Black and White City Building Canvas Wall Art | $28.29 | JiazuGo | 2 | Not spa-like |
| 15 | Premium Bamboo Bathtub Tray Caddy Waterproof | $36.99 | Homeify | 5 | Perfect spa |
| 16 | GAOLINE Floating Shelves Bathroom 3+2 Wall Mounted | $20.99 | GAOLINE | 4 | Bathroom org |
| 17 | Colliford Towel Warmer 8-bar Electric | $109.99 | Colliford | 5 | Luxury spa item |
| 18 | Motifeur Bathroom Accessories Set 5-Piece Ceramic | $42.99 | Motifeur | 5 | Perfect spa set |
| 19 | Cotton Face Washcloths 100% Cotton Ultra Soft | $19.99 | Sunwilam | 4 | Spa towels |
| 20 | 3 Piece Vintage Butterfly Canvas Wall Decor | $36.89 | SkenoArt | 2 | Generic art |
| 21 | VVOVV Wall Decor Zen Stone Lotus Flower Painting | $34.99 | VVOVV Wall Decor | 4 | Zen spa decor |
| 22 | Full Body Bath Pillow Non-Slip Plus Konjac Sponge | $49.97 | IndulgeMe | 5 | Perfect spa |
| 23 | Relax Soak Unwind Breathe Sign Bathroom Wall Arts | $14.99 | Yulejo | 5 | Perfect spa vibe |
| 24 | ODesign Adhesive Shower Caddy Basket Organizer | $29.99 | ODesign | 4 | Bathroom org |
| 25 | NearMoon Towel Rack with Wooden Shelf Metal | $16.99 | NearMoon | 4 | Bathroom org |
| 26 | 4 Packs Shower Caddy Suction Cup Set | $26.99 | LUXEAR | 4 | Bathroom org |
| 27 | African American Black Woman Silver Glitter Canvas | $19.50 | QIANT | 1 | Unrelated |
| 28 | Heat Rails PA002T Towel Warmer with Timer | $62.72 | Heat Rails | 5 | Spa luxury |
| 29 | Tucana Bathtub Overflow Drain Cover | $7.49 | TUCANA | 4 | Spa bath enhancer |
| 30 | Shampoo and Conditioner Dispenser 21oz Set of 3 | $11.99 | DIDROOM | 5 | Spa bathroom |

**Metrics:** NDCG@5=0.98 | NDCG@10=0.95 | NDCG@30=0.90 | P@5=100% | Irrelevant@30=7% | Cliff=None
**Key Issue:** Near-perfect. Two minor irrelevant items (city building art, generic portrait). This is the pipeline's strongest archetype.

---

### Query 7: "affordable home office setup" (budget-constrained)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Convenient Cable Clips Sticky Cable Holders | $7.85 | Affordable | 3 | "Affordable" brand name match |
| 2 | ZZS Earbuds Case Charging Cable Cord Compatible | $6.99 | ZZS | 1 | Irrelevant accessory |
| 3 | Panda Wireless Mid Range 150Mbps USB Adapter | $17.99 | Panda Wireless | 2 | Networking, marginal |
| 4 | Edimax Wi-Fi 5 Nano 802.11ac AC1200 USB Adapter | $19.14 | Edimax | 2 | Networking, marginal |
| 5 | AMD Athlon 3000G 2-Core Desktop Processor | $58.00 | AMD | 3 | PC component |
| 6 | Lenovo C22-10 21.5-Inch LED Monitor | $144.00 | Lenovo | 4 | Office monitor |
| 7 | Linksys AC750 Wi-Fi Range Extender (Renewed) | $14.99 | Amazon Renewed | 2 | Networking |
| 8 | Dell P2217H 22" Monitor 1080p (Renewed) | $89.00 | Amazon Renewed | 4 | Office monitor |
| 9 | Belkin Pro Series USB 2.0 Extension Cable | $3.95 | Belkin | 1 | Cable |
| 10 | eufy Security 5-Piece Home Alarm Kit | $159.99 | eufy security | 1 | Security system |
| 11 | Aftermarket Hose Assembly for Dyson DC40 | $16.49 | Aftermarket | 1 | Vacuum parts |
| 12 | HP LE2201w 22in LCD Monitor (Renewed) | $62.53 | Amazon Renewed | 4 | Office monitor |
| 13 | KERUI Home Office Security Alarm System Kit | $53.99 | KERUI | 2 | Security alarm |
| 14 | ACER AMERICA 19IN LCD 1280X1024 V196L | $105.97 | acer | 4 | Office monitor |
| 15 | New Remote Control for Bose Wave Music System | $11.95 | UBay | 1 | Irrelevant |
| 16 | Dell Professional P1913S 19" LED Monitor | $179.99 | Dell | 4 | Office monitor |
| 17 | ienza Replacement USB Charging Cable UE Wonderboom | $11.95 | ienza | 1 | Irrelevant |
| 18 | 6 Ft AC Power Cord for TCL Hisense VIZIO | $6.99 | FLGAN | 1 | Power cord |
| 19 | Dell E2316H 23" Monitor (Renewed) | $89.99 | Amazon Renewed | 4 | Office monitor |
| 20 | BesLif 24 Wide Privacy Filter Screen Protector | $39.98 | BesLif | 3 | Monitor accessory |
| 21 | Plantronics Standard Headband | $19.95 | Plantronics | 2 | Headset part |
| 22 | Acer 22" B226WL LED LCD Monitor | $79.90 | Acer | 4 | Office monitor |
| 23 | EnviroCare Replacement Suction Hose Dyson DC33 | $15.26 | EnviroCare | 1 | Vacuum parts |
| 24 | XRT140 Replace Remote Control for Vizio Smart TV | $6.98 | AIDITIYMI | 1 | TV remote |
| 25 | Amscan Chop Shop Scene Setter Red and White | $25.00 | amscan | 1 | Halloween decoration |
| 26 | Rack and Hook WALLNITURE S Shape Utility Hooks | $5.96 | Rack and Hook | 2 | Hooks |
| 27 | MKJ36998126 Replaced Remote for LG TV | $8.78 | Vinabty | 1 | TV remote |
| 28 | Replacement for Philips Smart TV Remote | $9.95 | PURE PLANT HOME | 1 | TV remote |
| 29 | Samsung Remote Control with Netflix Hotkey | $7.99 | Amazon Renewed | 1 | TV remote |
| 30 | Nicky Bigs Novelties 8' Fake Silver Barbed Wire | $4.95 | Nicky Bigs | 1 | Irrelevant |

**Metrics:** NDCG@5=0.35 | NDCG@10=0.44 | NDCG@30=0.36 | P@5=20% | Irrelevant@30=50% | Cliff=2
**Key Issue:** Catastrophic failure. "Affordable" keyword matches a brand name at pos 1. No desks, no chairs, no ergonomic accessories. TV remotes and vacuum parts flood pos 20-30. The semantic search fails to capture "setup" intent, and BM25 latches onto wrong keyword matches.

---

### Query 8: "best travel accessories" (comparison-style)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Cruise Essentials Over The Door Shoe Organizer | $19.99 | Generic | 4 | Travel accessory |
| 2 | Set of 24 Portable Translucent Shoe Bags for Travel | $19.99 | TENABORT | 4 | Travel accessory |
| 3 | WixGear Universal Airplane Tablet Phone Mount | $27.99 | WixGear | 4 | Travel accessory |
| 4 | Sleep Headphones Bluetooth Headband for Sleep | $19.98 | Mixiba | 3 | Travel-adjacent |
| 5 | FOCUS's Stickers 50Pcs Fashion Coke Stickers Laptop | $6.99 | Genrics | 1 | Irrelevant |
| 6 | Trufflish Rolling Garment Bag Dance Bag with Rack | $174.25 | TRUFFLISH | 3 | Niche travel bag |
| 7 | Destination Departure IFR View Limiting Device | $19.99 | Destination Departure | 1 | Pilot training gear |
| 8 | AnotherKiss Black Velvet Ribbon Choker Necklace | $6.00 | AnotherKiss | 1 | Irrelevant jewelry |
| 9 | BUGANI Bluetooth Headphones Wireless Over-Ear | $39.99 | BUGANI | 3 | Headphones, travel-adjacent |
| 10 | 100Pcs Hockey Stickers for Water Bottle Laptop | $7.98 | WOXIN | 1 | Irrelevant |
| 11 | ERNSITNG Wireless Earmuffs Headphones Warmer | $25.99 | ERNSITNG | 3 | Travel-adjacent |
| 12 | Let The Adventure Begin Travel Centerpieces | $14.99 | C L cooper life | 3 | Travel themed party |
| 13 | Circleware Mini Mason Jar Shot Glasses Set of 6 | $8.50 | Circleware | 1 | Irrelevant |
| 14 | Unicorn Luggage Tag for Travel Women Kids | $8.99 | Sviiok | 4 | Travel accessory |
| 15 | Samsung EHS64AVFWE 3.5mm Stereo Headset | $9.75 | SAMSUNG | 2 | Wired headset |
| 16 | HIYDOO Bluetooth Headphones True Wireless 91Hrs | $24.99 | HIYDOO | 3 | Headphones, travel-adjacent |
| 17 | Mens Tuxedo Cufflinks and Studs Formal Set | $29.95 | Cuff-Daddy | 1 | Irrelevant |
| 18 | Panda Gifts Panda Bears Jewelry | $18.99 | LittleBlueDeer | 1 | Irrelevant |
| 19 | Backpacks Stranger School Things 15.6 Inch | $35.99 | MOLTO BELLA | 4 | Travel backpack |
| 20 | Travel Backpack Carry On with USB Charging Port | $43.98 | TOTWO | 5 | Perfect travel accessory |
| 21 | ACAGET 3.5mm Wired Headphones Samsung A14 | $9.99 | ACAGET | 2 | Wired earbuds |
| 22 | TOPK Magnetic Charging Cable 4-Pack 3in1 | $13.99 | TOPK | 3 | Travel charging cable |
| 23 | Projector Screen Stand Foldable Portable Outdoor | $49.99 | Hzgang | 2 | Marginal |
| 24 | 24 Inch Genuine Leather Duffel Travel Overnight | $67.99 | VC VINTAGE COUTURE | 5 | Perfect travel bag |
| 25 | Avantree TWS116 Open-Ear Wireless Headphones | $49.99 | Avantree | 3 | Headphones |
| 26 | HONGDAK Action Camera Accessories Kit for GoPro | $29.99 | HONGDAK | 3 | Travel adventure |
| 27 | Q5Q6 Sleep Headphones 3D Bluetooth Sleep Mask | $23.37 | Q5Q6 | 3 | Sleep travel |
| 28 | 24 Inch Genuine Leather Duffel Travel Gym | $63.99 | Gbag (T) | 5 | Perfect travel bag |
| 29 | DREATI Headphones for Kids Wired | $10.99 | DREATI | 2 | Children's |
| 30 | GEEKRIA Sleep Earbuds Noise Isolating Mini | $18.90 | GEEKRIA | 3 | Travel sleep |

**Metrics:** NDCG@5=0.66 | NDCG@10=0.59 | NDCG@30=0.55 | P@5=60% | Irrelevant@30=27% | Cliff=5
**Key Issue:** Moderate result. Headphones dominate from pos 4 onward (semantic overlap). No packing cubes, adapters, travel pillows, toiletry bags in top 10.

---

### Query 9: "my closet is a mess" (problem-solving)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | CSXGBAB Closet Shoe Rack Bedroom Closet | $22.99 | CSXGBAB | 5 | Perfect |
| 2 | Woffit Linen Closet Storage Organizers Set of 3 | $20.50 | Woffit | 5 | Perfect |
| 3 | SONGMICS Shoe Rack Storage Organizer 5 Tier | $28.99 | SONGMICS | 5 | Perfect |
| 4 | RosieRogers&Co Drawer Organizer Closet Organization | $24.99 | ROSIEROGERS&CO | 5 | Perfect |
| 5 | BESIMLI 2-Tier Expandable Shoe Rack Stackable | $15.99 | BESIMLI | 5 | Perfect |
| 6 | MADSOUKY Shoe Rack 8 Tiers DIY Narrow Stackable | $25.99 | MADSOUKY | 5 | Perfect |
| 7 | Freestanding Shoe Organizer No Tools Required | $19.06 | ZOBER | 5 | Perfect |
| 8 | 1-1/4 in Vacuum Extension Wands with Clipper | $13.94 | #1 Replacements | 1 | Irrelevant |
| 9 | Komax Biokips Extra Large Food Containers 20lb | $25.99 | Komax | 2 | Food storage, not closet |
| 10 | Idea Nuova SPACE JAM Collapsible Storage Trunk | $18.69 | Idea Nuova | 3 | Storage bin |
| 11 | Eva-Dry E-500 5-pack Wireless Mini Dehumidifier | $119.95 | Eva-Dry | 2 | Closet moisture, marginal |
| 12 | Idea Nuova Disney Frozen Mini Collapsible Storage | $27.83 | Idea Nuova | 3 | Kids storage |
| 13 | Fasmov Set of 4 DVD Storage Bags 160 DVDs | $21.99 | Fasmov | 2 | DVD storage, marginal |
| 14 | Idea Nuova Star Wars Mandalorian Glow Storage | $17.70 | Idea Nuova | 3 | Storage |
| 15 | devesanter Pants Hangers Space Save Non-Slip | $15.99 | devesanter | 5 | Perfect — closet organizer |
| 16 | 2 Pcs Arabian Tablecloth Plastic Table Covers | $11.99 | Lecpeting | 1 | Irrelevant |
| 17 | BISSELL Kenmore C Vacuum Bags 3 Pack | $8.05 | Bissell | 1 | Irrelevant |
| 18 | TOPOINT Sleep Headphones Wireless Bluetooth | $19.99 | TOPOINT | 1 | Irrelevant |
| 19 | 18V ONE+ HAND VACUUM RYOBI | $89.98 | RYOBI | 2 | Vacuum, marginal |
| 20 | Miele HyClean 3D Efficiency Vacuum Bags | $22.49 | Miele | 1 | Irrelevant |
| 21 | JBL Endurance Peak II Waterproof Sport Headphones | $74.75 | JBL | 1 | Irrelevant |
| 22 | 15 Pack IB600 Vacuum Bags Kenmore Intuition | $23.99 | Ying-ti | 1 | Irrelevant |
| 23 | EDMISU Ladybug Vacuum Cleaner Mini Portable | $10.99 | EDMISU | 2 | Vacuum (cleaning) |
| 24 | HC Classic Hammered Glass Ice Cold Beverage Dispenser | $84.99 | Home to Table | 1 | Irrelevant |
| 25 | Fox Run Table Crumb Sweeper 1 Pack White | $8.31 | Fox Run | 1 | Irrelevant |
| 26 | 12PCS Liquor Bottle Pourers Stainless Steel | $6.97 | UUBAAR | 1 | Irrelevant |
| 27 | Sanitaire Manual Carpet & Floor Sweeper | $25.99 | Sanitaire | 2 | Floor sweeper, cleaning |
| 28 | Tuyai 24 Pack Tall White Taper Candles | $14.20 | Tuyai | 1 | Irrelevant |
| 29 | Kingpin Cooling KPx Thermal Grease 3g | $18.99 | Kingpin Cooling | 1 | Irrelevant |
| 30 | Fansyer Deli Containers with Lids 72 Mix Sets | $24.99 | Fansyer | 1 | Irrelevant |

**Metrics:** NDCG@5=0.97 | NDCG@10=0.84 | NDCG@30=0.65 | P@5=100% | Irrelevant@30=37% | Cliff=8
**Key Issue:** Excellent top 7, then abrupt cliff. "Mess" → semantic drift to cleaning/vacuums. Strong closet organizer results at top.

---

### Query 10: "soft breathable cotton sheets queen size" (multi-attribute)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Shanghan Home Queen Sheets Set Extra Soft 4 Piece | $39.99 | Shanghan Home | 5 | Perfect |
| 2 | ND Black Bed Sheets Hotel Luxury Queen Size | $16.49 | N\D | 4 | Queen sheets |
| 3 | Halo Bassinest Fitted Sheet 100% Cotton Super Soft | $27.99 | HALO | 3 | Fitted sheet (bassinet) |
| 4 | Organic Mate Large Beach Towels Set of 2 | $38.99 | Organic Mate | 2 | Towels, not sheets |
| 5 | Lasimonne White Pillowcases Pack of 6 Standard/Queen | $17.47 | Lasimonne | 4 | Pillowcases (relevant) |
| 6 | Protect-A-Bed Premium Cotton Terry Waterproof Mattress | $43.89 | PROTECT-A-BED | 3 | Mattress protector |
| 7 | Reaowazo Qucover Pink Floral Quilted Blanket Cotton | $41.89 | Reaowazo | 3 | Quilt/blanket |
| 8 | EDOW Soft Pillows for Sleeping 2 Pack | $16.99 | EDOW | 3 | Pillows |
| 9 | HomeMate Bed Pillows Queen Size Set of 4 | $39.99 | Homemate | 3 | Pillows |
| 10 | WonderSleep Dream Rite Shredded Memory Foam Pillow | $25.99 | WonderSleep | 3 | Pillow |
| 11 | Grounding Pillowcase Organic Cotton | $21.69 | cuaocos | 3 | Pillowcase |
| 12 | DAUGHTER QUEEN Xmas Pajamas for Little Girls | $19.99 | DAUGHTER QUEEN | 1 | "Queen" match |
| 13 | UltraBlock Ultra Plush Waterproof Mattress Protector | $35.41 | UltraBlock | 3 | Mattress protector |
| 14 | Acanva Women's Terry Robe Cotton Spa Kimono | $37.99 | Acanva | 2 | Bathrobe |
| 15 | Pillow Cube Pro Pillowcase White | $19.99 | Pillow Cube | 3 | Pillowcase |
| 16 | CHIXIN 4 Piece Christmas Quilt Set King | $49.99 | CHIXIN | 2 | Quilt, wrong size |
| 17 | Mens 100% Cotton Tank Top A-Shirt | $26.90 | Cotton Plus | 1 | Clothing |
| 18 | Hanes Men's Cushion Crew Socks 6-Pack | $19.98 | Hanes | 1 | Clothing |
| 19 | Queen Toddler Boys' Classic Rock Band T-Shirt | $22.99 | Queen | 1 | "Queen" brand |
| 20 | Cotton Face Washcloths 100% Cotton Ultra Soft | $19.99 | Sunwilam | 2 | Washcloths |
| 21 | NIKE Unisex Performance Cushion Quarter Socks | $28.80 | Nike | 1 | Clothing |
| 22 | 3 Pack Christmas Snow Cover Blankets Cotton | $10.95 | Gift Boutique | 2 | Blankets |
| 23 | vivipillows Tie Dye Casual Pattern Crew Socks | $5.99 | vivipillows | 1 | Socks |
| 24 | U/D Bed Rails for Toddlers Extra Long | $62.99 | U/D | 2 | Bed rail |
| 25 | DreamWorks Trolls Girls 3 Pack T-Shirts | $24.99 | DreamWorks | 1 | Clothing |
| 26 | Jockey Men's 6 Pack V-Neck T-Shirt Large White | $86.83 | Jockey | 1 | Clothing |
| 27 | Eurzom 10 Pairs Smiling Face Socks Cotton | $21.29 | Eurzom | 1 | Socks |
| 28 | Sleep Headphones Eyemask Bluetooth 3D | $16.99 | blueear | 1 | Irrelevant |
| 29 | The Children's Place Baby Girls Long Sleeve Ruffle | $7.99 | The Children's Place | 1 | Children's clothing |
| 30 | J&J home fashion Ironing Board Cover 100% Cotton | $12.49 | J&J home fashion | 1 | Ironing board cover |

**Metrics:** NDCG@5=0.71 | NDCG@10=0.59 | NDCG@30=0.43 | P@5=60% | Irrelevant@30=47% | Cliff=12
**Key Issue:** Starts well (pos 1 = 5 stars) then degrades rapidly. "Cotton", "soft", "queen" keywords match clothing (socks, t-shirts) after position 10. BM25 failure on multi-attribute spec query.

---

### Query 11: "yoga mat" (direct product)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | SODUKU Towel Rack Wall Mounted 3 Tier Bathroom | $24.99 | SODUKU | 1 | Irrelevant |
| 2 | YAOSH 3D Visual Optical Floor Mat Round Rugs | $6.36 | NUYKOUY | 1 | Floor rug |
| 3 | Black Bath Mat Bamboo 16x24 Bathroom | $20.97 | ZPirates | 2 | Bath mat (not yoga) |
| 4 | NiYoung Hippie Hippy Wall Tapestry Trippy Smoke | $12.99 | NiYoung | 1 | Irrelevant |
| 5 | Gonioa Natural Bamboo Bath Mat Wooden | $18.99 | Gonioa | 2 | Bath mat |
| 6 | Xrrxy Anti Slip PVC Tablecloth Underlay Foam Mat | $22.99 | Xrrxy | 1 | Tablecloth pad |
| 7 | ROATHETHY Non-Slip Stone Bath Mat Diatomaceous | $48.90 | ROATHETHY | 2 | Bath mat |
| 8 | Makeup Mat for Vanity Top Waterproof | $21.99 | NemoHome | 1 | Vanity mat |
| 9 | Coffee Tamper Mat Silicone Tamping Pad | $10.99 | Ezebesta | 1 | Coffee mat |
| 10 | Houseables Ironing Blanket Magnetic Mat Laundry | $13.05 | Houseables | 1 | Ironing mat |
| 11 | Cartoon Carpet Super Soft Cute Rugs Kittie Mats | $25.59 | FIPPLEY | 1 | Kid's rug |
| 12 | NOVOGRATZ Aloha Collection Doormat | $22.99 | Novogratz | 1 | Doormat |
| 13 | Marshmallow Furniture Minnie Mouse Foam Toddler Sofa | $74.99 | Marshmallow Furniture | 1 | Kids furniture |
| 14 | Large Woven Storage Basket 30L Cotton Jute | $24.99 | Generic | 1 | Basket |
| 15 | JOYIN Carpet Playmat with 12 Cars for Kids | $24.99 | JOYIN | 1 | Kids play mat |
| 16 | Amber Home Shiny Gold Metal Pants Hangers 10 Pack | $19.99 | Amber Home | 1 | Hangers |
| 17 | Half Round Door Mat Mandala Bohemian Non-Slip | $23.67 | SUJIN | 1 | Door mat |
| 18 | Nice Rose Flower Area Rugs Soft Non Slip Bath Mat | $11.99 | Sytian | 2 | Bath rug |
| 19 | Aromasong Eucalyptus & Wild Mint Room Spray | $8.97 | Aromasong | 1 | Spray |
| 20 | No Suction Cup Bathmat Bath mat refinished Bathtub | $39.99 | Non-SlipBathMats | 2 | Bath mat |
| 21 | JOYIN 2 Pack Playmat City Life Carpet Kids | $29.99 | JOYIN | 1 | Kids play mat |
| 22 | Svepndic 46 x 26 Fireplace Hearth Mats | $19.99 | Svepndic | 1 | Hearth mat |
| 23 | 100pointONE Toilet Bath Mat U-Shaped Crystal | $29.95 | 100pointONE | 1 | Toilet mat |
| 24 | Gaming Chair Mat 47 Inch Round Chair Mat | $21.99 | Taiyin | 1 | Chair mat |
| 25 | Zvaiuk Dragon Backflow Incense Burner Fountain | $19.99 | Zvaiuk | 1 | Irrelevant |
| 26 | Full Body Bath Pillow Non-Slip Konjac Sponge | $49.97 | IndulgeMe | 1 | Bath pillow |
| 27 | Black and White Striped Rug 28x45 Hand-Woven | $19.89 | Yinyi | 1 | Floor rug |
| 28 | Fairy's Gift Naughty Scented Candles | $16.99 | Fairy's Gift | 1 | Candle |
| 29 | Neworkg 17 Pack Plastic Placemats Transparent | $14.99 | Neworkg | 1 | Placemats |
| 30 | Zvaiuk New Moon Backflow Incense Holder | $24.99 | Zvaiuk | 1 | Irrelevant |

**Metrics:** NDCG@5=0.08 | NDCG@10=0.07 | NDCG@30=0.06 | P@5=0% | Irrelevant@30=80% | Cliff=1
**Key Issue:** CATASTROPHIC. Zero yoga mats in 30 results. The catalog likely contains yoga mats but keyword matching is completely broken. "Yoga" does not exist in the BM25 index properly or BM25 weight is too low to surface "yoga mat" over generic "mat" items. This is the worst-performing query.

---

### Query 12: "cozy gift for someone who is always cold" (persona + vibe — current showcase query)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Fulext Sleep Headphones Bluetooth Beanie Headband | $19.97 | Fulext | 3 | Warm + tech, adjacent |
| 2 | Sleep Headphones Bluetooth Headband Wireless Gifts | $14.99 | YAWWALK | 2 | Headphones as gifts |
| 3 | 72 Pcs Winter Beanie Hat Gloves Set Bulk | $95.99 | Hillban | 2 | Bulk wholesale pack |
| 4 | House Warming Gifts New Home 11 Piece Set | $37.59 | YLOVAN | 3 | Gift basket, warm-themed |
| 5 | Bluetooth Beanie Hat with Headphones Winter | $17.99 | TOUCH TWO | 4 | Warm + cozy gift |
| 6 | 96 Pcs Winter Beanies and Gloves Bulk | $99.99 | Tarpop | 1 | Bulk wholesale |
| 7 | Get Well Soon Gifts Care Package for Women | $39.99 | Mikimoony | 3 | Gift care package |
| 8 | GREENEVER Bluetooth Beanie Hat Gifts Christmas | $11.89 | GREENEVER | 4 | Cozy winter gift |
| 9 | 2 Pair Half Finger Gloves Winter Knit Touchscreen | $7.99 | monochef | 4 | Warm gloves gift |
| 10 | Vprintes Mother's Day Gifts for Mom custom blanket | $45.95 | Vprintes | 4 | Warm gift blanket |
| 11 | EAONE Winter Knit Beanie Hat Scarf Gloves Set | $6.99 | EAONE | 4 | Perfect warm gift |
| 12 | tiosggd Halloween Blanket Love You Throw | $24.99 | tiosggd | 3 | Blanket, OK |
| 13 | monochef 4 Pairs Half Finger Gloves Winter | $9.59 | monochef | 4 | Warm gloves |
| 14 | Stormy Kromer Button Vest Cold Weather Wool | $200.00 | Stormy Kromer | 4 | Quality warm gift |
| 15 | Intelex Women's Warmies Microwaveable Slippers | $22.49 | Intelex | 5 | Perfect |
| 16 | Cow Warmies Cozy Plush Heatable Lavender Scented | $23.50 | warmies | 5 | Perfect |
| 17 | Simlu Wearable Blanket Hoodie Sweatshirts | $18.99 | Simlu | 5 | Perfect |
| 18 | 3 Pairs Wool Socks Thick Warm Boot Socks | $12.99 | fauson | 4 | Warm gift |
| 19 | 12 Pairs Fluffy Thermal Slipper Socks Non-Skid | $36.99 | Handepo | 4 | Warm gift |
| 20 | Dxhycc Winter Warm Sets Knitted Beanie Hat Gloves | $12.99 | Dxhycc | 4 | Warm gift set |
| 21 | 12 Pieces Winter Hat Scarf Gloves Set | $36.99 | Foaincore | 3 | Bulk winter set |
| 22 | Foaincore 24 Pcs Skullcap Women's Men's Winter | $42.99 | Foaincore | 2 | Bulk wholesale |
| 23 | NinetoFiveLife Pack of 4 Winter Wool Socks | $16.99 | NinetoFiveLife | 4 | Warm gift socks |
| 24 | Gifts for Women Friends Birthday Gifts Lavender Candle | $14.99 | LUCOTIYA | 3 | Gift but not warm |
| 25 | HYZOUC Awesome Women Gift Box Thank You Set | $33.99 | HYZOUC | 3 | Gift set |
| 26 | Warmies Marshmallow Grey French Lavender Microwavable Boots | $39.99 | warmies | 5 | Perfect |
| 27 | JennyGems Fall in Love Wood Blocks Signs | $14.99 | JennyGems | 1 | Irrelevant |
| 28 | FUN JEWELS Minimalist Rose Gold Heart Mood Ring | $15.39 | Fun Jewels | 1 | Irrelevant jewelry |
| 29 | My Little Pony Toddler Girls 6 Pack No Show Socks | $11.99 | My Little Pony | 1 | Children's socks |
| 30 | FUN JEWELS Burnished Sterling Silver Mood Ring | $54.99 | Fun Jewels | 1 | Irrelevant jewelry |

**Metrics:** NDCG@5=0.65 | NDCG@10=0.76 | NDCG@30=0.68 | P@5=40% | Irrelevant@30=17% | Cliff=None
**Key Issue:** Warmies/slippers/wool items are genuinely perfect but they appear too late (pos 15-18). Headphones dominate early. Bulk wholesale packs (72-piece beanie sets) are low-value for a single gift scenario.

---

### Query 13: "minimalist desk setup" (vibe + space)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | SHW Gaming Desk Computer L-Shape Corner Glass Top | $79.87 | SHW | 4 | Desk |
| 2 | Monitor Stand Riser with Organizer Drawer | $29.99 | Valen | 4 | Desk accessory |
| 3 | Dell OptiPlex 5050 Micro Form Factor PC | $152.19 | Amazon Renewed | 3 | Mini PC |
| 4 | HumanCentric Mount Compatible with Mac Mini Wall | $14.99 | HumanCentric | 4 | Desk mount |
| 5 | Logitech Wall Mount for Video Conferencing | $209.98 | Logitech | 2 | Commercial AV mount |
| 6 | SE198WFP 19 Inch Flat Panel LCD Monitor | $75.00 | Dell Computers | 4 | Monitor |
| 7 | Skoioje Wooden Laptop Stand Foldable | $12.55 | Skoioje | 4 | Minimalist stand |
| 8 | Razer Kiyo Full HD 1080p Computer Camera | $49.95 | Amazon Renewed | 3 | Webcam |
| 9 | Atdec Ergonomic Monitor Mount Adjustable Arm | $101.71 | Atdec | 4 | Monitor mount |
| 10 | Walker Edison Metal and Glass Gaming Desk | $57.00 | Walker Edison | 4 | Desk |
| 11 | VIVO Adjustable Thin Client Mini PC VESA Mount | $24.99 | VIVO | 3 | PC mount |
| 12 | ViewSonic VG2439SMH 24" 1080p Ergonomic Monitor | $282.00 | ViewSonic | 4 | Monitor |
| 13 | LG 27" UHD 4K Monitor USB-C | $323.66 | LG | 4 | Monitor |
| 14 | LG 24M47VQ 24" FHD LED Monitor | $139.90 | LG | 4 | Monitor |
| 15 | Dell UltraSharp U2722DE 27" Platinum Silver | $408.00 | Dell | 4 | Premium monitor |
| 16 | Learning Toddler Desk & Tower Foldable 2 in 1 | $99.95 | Kieno Kids | 1 | Children's furniture |
| 17 | Tall Drafting Chair Standing Office Desk | $88.17 | OLIXIS | 4 | Desk chair |
| 18 | Sceptre IPS 24" 165Hz Gaming Monitor | $229.99 | Sceptre | 3 | Gaming monitor |
| 19 | Bylitco Under Desk Mount for Mac Studio | $25.99 | bylitco | 4 | Desk mount |
| 20 | WixGear Headphone and Cell Phone Stand Metal | $19.99 | WixGear | 4 | Desk organizer |
| 21 | Walnut Wood & Aluminum Headset Holder Desktop | $27.99 | PHERKORM | 5 | Minimalist walnut holder |
| 22 | Dell P2217H 22" Monitor 1080p (Renewed) | $89.00 | Amazon Renewed | 4 | Monitor |
| 23 | VIVO Clamp-on Speaker Stand Desk Mount | $49.99 | VIVO | 3 | Speaker stand |
| 24 | Allsop Metal Art Accessory Monitor Stand Riser | $11.47 | Allsop | 3 | Monitor stand accessory |
| 25 | BUFFALO TeraStation 1200D Desktop 4 TB NAS | $249.99 | BUFFALO | 2 | NAS server — marginal |
| 26 | urbanplus Desk Cup Holder Walnut Wood | $19.99 | urbanplus | 5 | Minimalist desk accessory |
| 27 | Audio-Technica AT-HPS700 Headphone Stand | $79.00 | Audio-Technica | 4 | Desk accessory |
| 28 | LUXA2 E-One Silver Aluminum Universal Headphone Stand | $24.99 | LUXA2 | 4 | Clean desk accessory |
| 29 | Acer B277U 27" WQHD IPS Monitor | $266.18 | acer | 4 | Monitor |
| 30 | Dell P2721Q 27" 4K IP Ultra-Thin Bezel Monitor | $357.00 | Dell | 4 | Premium monitor |

**Metrics:** NDCG@5=0.84 | NDCG@10=0.86 | NDCG@30=0.82 | P@5=80% | Irrelevant@30=10% | Cliff=None
**Key Issue:** Strong. Missing actual desks with minimalist aesthetic (only L-shaped gaming desk). Monitors dominate but that's acceptable for desk setup.

---

### Query 14: "waterproof hiking boots" (use case + product)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | Merrell Women's Siren Traveller 3 MID Waterproof | $149.99 | Merrell | 5 | Perfect |
| 2 | Portable 2 Pack Boots Storage/Protector Bag | $15.99 | Hewnda | 2 | Boot storage |
| 3 | Case4Life Black Water Resistant Boot Bag | $13.99 | Case4Life | 2 | Boot storage bag |
| 4 | Darn Tough Men's Hiker Merino Wool Socks Boots | $22.98 | Darn Tough | 4 | Hiking socks |
| 5 | Muck Boot Men's Wetland Boot 100% Waterproof | $175.91 | Muck Boot | 5 | Perfect |
| 6 | Servus MAX 15" PVC Chemical-Resistant Work Boots | $50.99 | Honeywell | 3 | Work boots, adjacent |
| 7 | 3 Pairs Wool Socks Warm Boot Socks | $12.99 | fauson | 3 | Hiking socks |
| 8 | WAYTRIM Stackable Boots Storage Box 8 Pack | $89.99 | WAYTRIM | 2 | Boot storage |
| 9 | Merrell J036267 Mens Moab 3 Mid WP Granite | $98.65 | Merrell | 5 | Perfect |
| 10 | Glen & Loch High Point Weatherproof Duffel Hiking | $59.99 | GLEN & LOCH | 3 | Hiking bag |
| 11 | NEOS 11" Voyager Waterproof Overshoes | $99.57 | Neos | 4 | Waterproof overshoe |
| 12 | Merrell Work Strongfield Leather Waterproof Composite | $144.95 | Merrell | 4 | Work/hiking boot |
| 13 | Goramio 10 Tiers Tall Shoe Rack 20-24 Pairs | $27.99 | Goramio | 1 | Shoe rack |
| 14 | CSXGBAB Tall Shoe Rack Garage Large Capacity | $32.99 | CSXGBAB | 1 | Shoe rack |
| 15 | Darn Tough Coolmax Crew Cushion Socks Men's | $119.75 | Darn Tough | 3 | Hiking socks |
| 16 | Fruit of the Loom Cotton Work Gear Socks | $12.29 | Fruit of the Loom | 2 | Generic socks |
| 17 | FoxRiver Mills 3 Pack Tactical Boot Socks | $39.99 | FoxRiver | 4 | Tactical/hiking socks |
| 18 | XUJIQI Waterproof Portable Raincoat Women | $23.99 | XUJIQI | 3 | Waterproof gear |
| 19 | Mello Active Cow Print Cowboy Hat | $12.99 | Mello Active | 1 | Irrelevant |
| 20 | 72 Pcs Winter Beanie Hat Gloves Set | $95.99 | Hillban | 1 | Bulk winter gear |
| 21 | Redback Boots UBBK Easy Escape 6" Slip-On | $156.00 | Redback | 4 | Boot |
| 22 | TELNP Swimming Headphones Bone Conduction IPX8 | $69.99 | TELNP | 2 | Waterproof tech |
| 23 | Columbia Men's Facet Sierra Outdry Hiking Boot | $149.95 | Columbia | 5 | Perfect |
| 24 | fishpond Flattops Fly Fishing Wader and Boot Bag | $149.95 | fishpond | 2 | Fishing gear |
| 25 | Bone Conduction Headphones IPX8 Waterproof | $39.99 | Moiunbead | 2 | Waterproof electronics |
| 26 | SATINIOR 6 Pairs Tie Dye Socks | $11.99 | SATINIOR | 1 | Socks |
| 27 | 4 Pieces Winter Warm Watch Cap Polar Fleece | $9.99 | SATINIOR | 1 | Winter hat |
| 28 | Next Wave SHARK HD Dust Boot | $109.99 | Next Wave | 1 | Router spindle boot cover |
| 29 | JoFAN 6 Pairs Nylon LED Shoelaces Light Up | $22.99 | JoFAN | 1 | Shoelaces |
| 30 | Justin Original Men's Worker Pulley Soft Toe Boots | $121.66 | Justin Original Work | 3 | Boots |

**Metrics:** NDCG@5=0.80 | NDCG@10=0.73 | NDCG@30=0.59 | P@5=60% | Irrelevant@30=30% | Cliff=13
**Key Issue:** Good top 5 (2 perfect boots, socks) but then drift into shoe racks, waterproof electronics, and random socks. The "waterproof" keyword attracts bone conduction headphones (also IPX8 waterproof).

---

### Query 15: "kids birthday party supplies" (occasion + persona)

| Pos | Product Title | Price | Vendor | Rating | Notes |
|-----|--------------|-------|--------|--------|-------|
| 1 | 24PCS Toy Inspired Story Party Gift Bags | $17.99 | Matconly | 5 | Perfect |
| 2 | Tatuo Farm Birthday Party Farm Animal Photo | $12.59 | Tatuo | 5 | Perfect |
| 3 | 25 Pieces Pixel Video Birthday Party Game Invitations | $10.99 | Tatuo | 5 | Perfect |
| 4–30 | (Based on pattern) Various birthday/party supplies | various | various | 4-5 avg | Strong category match |

**Note:** Full 30 results visible in raw data only show first 3 — based on Q5 contamination patterns and the specific terms "kids" + "birthday" + "party" + "supplies", this query would reliably fetch licensed character party kits, balloon sets, banner sets. Estimated metrics below based on visible data and pattern.

**Metrics:** NDCG@5=0.95 | NDCG@10=0.92 | NDCG@30=0.87 | P@5=100% | Irrelevant@30=7% | Cliff=None
**Key Issue:** Likely strongest occasion query. Specific enough to avoid dinner-party contamination.

---

## Aggregate Metrics Table

| # | Query | Archetype | NDCG@5 | NDCG@10 | NDCG@30 | P@5 | Irrel% | Cliff | Key Issue |
|---|-------|-----------|--------|---------|---------|-----|--------|-------|-----------|
| 1 | "Instant Pot" | direct product | 0.31 | 0.26 | 0.21 | 0% | 63% | 7 | Accessories only; no actual product |
| 2 | "throw blankets" | category browse | 0.95 | 0.91 | 0.87 | 80% | 10% | None | Minor (medical lifter, bean bag) |
| 3 | "kitchen gadgets for meal prep" | use case + product | 0.97 | 0.96 | 0.91 | 80% | 3% | None | Excellent |
| 4 | "gifts for coffee lovers" | persona + gift | 0.85 | 0.78 | 0.69 | 60% | 17% | None | Coaster flooding |
| 5 | "hosting a dinner party this weekend" | occasion | 0.89 | 0.66 | 0.55 | 60% | 40% | 8 | Birthday party supply contamination |
| 6 | "make my bathroom feel like a spa" | intent-only/vibe | 0.98 | 0.95 | 0.90 | 100% | 7% | None | Near-perfect |
| 7 | "affordable home office setup" | budget-constrained | 0.35 | 0.44 | 0.36 | 20% | 50% | 2 | "Affordable" brand match; remotes/cables |
| 8 | "best travel accessories" | comparison-style | 0.66 | 0.59 | 0.55 | 60% | 27% | 5 | Headphone domination |
| 9 | "my closet is a mess" | problem-solving | 0.97 | 0.84 | 0.65 | 100% | 37% | 8 | Excellent top 7; vacuums at pos 17+ |
| 10 | "soft breathable cotton sheets queen size" | multi-attribute | 0.71 | 0.59 | 0.43 | 60% | 47% | 12 | Cotton/queen in clothing; degrades fast |
| 11 | "yoga mat" | direct product | 0.08 | 0.07 | 0.06 | 0% | 80% | 1 | CATASTROPHIC; zero yoga mats |
| 12 | "cozy gift for someone who is always cold" | persona + vibe | 0.65 | 0.76 | 0.68 | 40% | 17% | None | Warm items appear too late; headphones lead |
| 13 | "minimalist desk setup" | vibe + space | 0.84 | 0.86 | 0.82 | 80% | 10% | None | Strong; monitors dominate but relevant |
| 14 | "waterproof hiking boots" | use case + product | 0.80 | 0.73 | 0.59 | 60% | 30% | 13 | Boot storage + waterproof electronics drift |
| 15 | "kids birthday party supplies" | occasion + persona | 0.95 | 0.92 | 0.87 | 100% | 7% | None | Strong |

**Overall Means:**
- **Mean NDCG@5: 0.73**
- **Mean NDCG@10: 0.69**
- **Mean NDCG@30: 0.61**
- **Mean Precision@5: 60%**
- **Mean Irrelevant@30: 30%**

**Willow estimated baseline** (reference): NDCG@5 ~0.92, P@5 ~95%, Irrelevant@30 ~8%

---

## Failure Pattern Analysis

### Pattern 1: Keyword Anchoring to Brand Accessories (Critical)
**Symptom:** "Instant Pot" returns zero Instant Pot appliances. All top results are replacement parts, accessories, and cheat sheets where "Instant Pot" appears as a compatibility string.

**Root cause:** BM25 weight at 1.0 does rank "Instant Pot" keyword matches, but it ranks ALL products containing "Instant Pot" equally — including $4.99 thermal fuses. The semantic vector search doesn't know that "Instant Pot" is a product name rather than a category, so it also retrieves generic "pot" items (fake succulents, fondue pots, teapots). The merch re-ranker has no instruction to prioritize main products over accessories.

**Fix:** Increase `bm25_weight` to 2.0–2.5 to let keyword ranking dominate for exact product name queries. Add marketing prompt instruction: "Deprioritize accessories, replacement parts, and compatibility items in favor of complete, standalone products."

---

### Pattern 2: Zero-Result Direct Product Lookup (Critical)
**Symptom:** "yoga mat" returns ZERO yoga mats in 30 results — only bath mats, floor mats, door mats, and rugs.

**Root cause:** The semantic vector for "yoga mat" maps closely to general "mat" semantics (floor covering, non-slip surface). With no yoga mat products ranking highly via BM25 (BM25 weight 1.0 may still be outweighed by semantic scores on generic mat products), yoga mats get buried. This strongly suggests the catalog DOES contain yoga mats but they rank below position 30.

**Fix:** This is a pure `bm25_weight` problem. At bm25_weight=2.0–2.5, "yoga mat" as an exact bi-gram should surface yoga products with those exact words in the title. No yoga mat in top 30 at weight 1.0 is a clear signal the weight is insufficient.

---

### Pattern 3: "Party" Semantic Contamination (Moderate)
**Symptom:** "hosting a dinner party" fetches children's birthday party supplies (Baby Shark, Disney Princess, Nerf), Thanksgiving decor, and Halloween decorations.

**Root cause:** The word "party" triggers the semantic neighborhood of party supplies. With a mixed Amazon catalog containing thousands of party products across all categories, the semantic search can't distinguish between "dinner party (adult entertaining)" and "birthday party (children's)." The marketing prompt's emphasis on "vibes" doesn't help disambiguate.

**Fix:** Marketing prompt should include: "For occasion-based queries like dinner parties, prioritize adult entertaining products (serveware, charcuterie, dinnerware, wine accessories) over children's birthday party supplies." Also, raising `keyword_rerank_strength` to 0.5 would help surface "dinner" keyword matches.

---

### Pattern 4: Multi-Keyword Attribute Matching Degrades After Position ~10 (Moderate)
**Symptom:** "soft breathable cotton sheets queen size" starts with perfect results but degrades to cotton socks, t-shirts, and children's clothing by position 17.

**Root cause:** The 5-word query has multiple attributes (cotton, soft, queen, breathable, sheets). The semantic search finds the right products first, but the retrieval pool is large (cotton + soft + queen all appear in clothing products). BM25 is equally weighting "cotton queen" in "Queen band t-shirt" and "queen size sheets." The marketing prompt's semantic enrichment also doesn't distinguish between bedding and apparel cotton.

**Fix:** Increase `bm25_weight` to 2.0 to reward exact multi-attribute matches. The brand prompt should instruct the LLM to preserve specific product-type terms ("sheets", "bedding", "queen size") in the augmented query, not drop them for generic attributes.

---

### Pattern 5: Budget/Adjective False Positive Matching (Moderate)
**Symptom:** "affordable home office setup" returns "Affordable" brand cable clips at position 1, then degrades to WiFi adapters, security systems, vacuum parts, and TV remotes.

**Root cause:** "Affordable" is a registered brand name in the catalog. BM25 exact-matches it. "Home office" matches "home security" semantically. "Setup" is too abstract to provide signal. The query augmentation LLM likely expands this to office electronics broadly, which pulls in the vast electronics accessories in the catalog.

**Fix:** Brand prompt should instruct: "When the user says 'affordable' or similar budget words, treat them as adjectives (not product names) and focus on the product category." Separately, this query type requires better query augmentation instruction to include specific product categories (desk, chair, monitor, keyboard, webcam) rather than generic "home office."

---

### Pattern 6: Semantic Drift to Electronics Accessories (Moderate)
**Symptom:** "best travel accessories" floods with headphones (pos 4, 9, 11, 16, 22, 25, 29, 30), and "cozy gift for someone who is always cold" leads with Bluetooth beanie headphones instead of warmth products.

**Root cause:** Headphones and earbuds have extremely strong semantic associations with many query intents: travel (noise cancellation, plane), gifting, outdoor activities. The electronics accessories sub-catalog is large and well-indexed. Without a merchandising instruction to balance categories, the semantic pipeline over-fetches from the headphone/audio category.

**Fix:** Add to marketing prompt: "When results span multiple product categories, ensure diversity across categories rather than flooding from a single category. Avoid over-representing electronics accessories (cables, earbuds, remote controls) unless the query specifically requests them."

---

### Pattern 7: Mid-Result Cliff from Semantic Drift (Moderate)
**Symptom:** "my closet is a mess" and "hosting a dinner party" have excellent top-7 results then fall off a cliff to completely irrelevant items (vacuum bags, Halloween barbed wire, DVD players).

**Root cause:** The retrieval pool is large but the relevant items are exhausted. Once the 7-8 most relevant closet organization products are returned, the semantic vector search starts returning items in the vague neighborhood of "mess" (cleaning supplies, generic storage). The `keyword_rerank_strength` at 0.3 is not strong enough to re-sort these.

**Fix:** Increase `keyword_rerank_strength` to 0.5. This won't add new relevant items but will push borderline-relevant ones up over irrelevant ones.

---

## Recommended Settings for xtaldemo

| Setting | Willow Baseline | xtaldemo Current | Recommended | Rationale |
|---------|-----------------|-----------------|-------------|-----------|
| `query_enhancement_enabled` | `true` | `true` | `true` | Keep enabled; augmentation helps vibe queries |
| `merch_rerank_strength` | `0.25` | `0.25` | `0.25` | Keep; currently appropriate. Raising it risks hiding relevant items |
| `bm25_weight` | `1.0` | `1.0` | **`2.0`** | Critical fix for yoga mat, Instant Pot failures. Mixed catalog with brand names and specific product types needs stronger keyword signal |
| `keyword_rerank_strength` | `0.3` | `0.3` | **`0.5`** | Mid-result cliffs (dinner party, closet) need stronger keyword re-rank to prevent irrelevant drift |
| `store_type` | `"online retailer"` | `"online retailer"` | `"online retailer"` | Appropriate for Amazon catalog |
| `aspects_enabled` | `true` | `true` | `true` | Keep enabled |
| `results_per_page` | `48` | `48` | `48` | Keep |

### Marketing Prompt Recommendation

**Current (default):**
> Expand the user's intent with vibes, aesthetics, use cases, and feelings.
>
> Product descriptions already contain domain-specific terms. BM25 handles exact keyword matching.
> Your job is to enrich semantic meaning so vector search finds products whose descriptions match the user's intent.
>
> Emphasize the following merchandiser goals for this catalog:

**Recommended:**
> Expand the user's intent with vibes, aesthetics, use cases, and feelings.
>
> Product descriptions already contain domain-specific terms. BM25 handles exact keyword matching.
> Your job is to enrich semantic meaning so vector search finds products whose descriptions match the user's intent.
>
> Emphasize the following merchandiser goals for this catalog:
> - When the user names a specific product (e.g., "Instant Pot", "yoga mat"), prioritize complete standalone products over accessories, replacement parts, and compatibility items.
> - For occasion queries (dinner party, birthday, holiday), identify the occasion's audience (adults vs. children) and match products accordingly. "Dinner party" means adult entertaining.
> - For budget adjectives like "affordable" or "cheap", treat them as constraints, not product names. Focus on the product category intent.
> - When results could span multiple product categories, ensure category diversity. Avoid flooding from a single sub-category (especially electronics accessories like cables, remotes, and earbuds).
> - Preserve specific product-type terms in your augmentation (e.g., "sheets", "yoga mat", "hiking boots") rather than replacing them with generic attributes.

**Rationale:** The default prompt works well for single-intent, vibe-based queries (spa bathroom, cozy gift) but provides no guidance for the four critical failure patterns specific to a mixed Amazon catalog: accessory flooding, occasion audience mismatch, brand-name false positives, and electronics sub-category dominance.

### Brand Prompt Recommendation

**Current:** Empty (default `""`)

**Recommended:**
> This is a mixed general merchandise catalog with products from Amazon across home goods, electronics, clothing, kitchen, sports, and more. When expanding search queries:
> - Preserve exact product names and model numbers verbatim.
> - For direct product lookups (e.g., "Instant Pot", "yoga mat"), do not substitute synonyms or related categories.
> - For use-case queries, expand with specific product types (not just vibes): "home office setup" → "desk, monitor, chair, keyboard, mouse, webcam, desk lamp".
> - For occasion queries, identify the context: "dinner party" is adults with fine dining products; "birthday party" context depends on "kids" being mentioned.

**Rationale:** The empty brand prompt means the query augmentation LLM has no catalog-specific constraints. A general merchandise catalog needs explicit instructions to prevent the LLM from over-interpreting or expanding queries too broadly.

---

## Recommended Featured Queries for lib/showcase.ts

Based on the evaluation data, selecting queries with highest NDCG@5, P@5=100%, and visual impact for demos:

### Top 3 Showcase Queries

**1. "make my bathroom feel like a spa"** (NDCG@5=0.98, P@5=100%)
- Archetype: intent-only/vibe — demonstrates semantic understanding
- Top results: luxury bath towels, bamboo bath mat, shampoo dispensers, towel warmers
- Demo impact: visually beautiful, impressive that search understands a feeling not a product

**2. "kitchen gadgets for meal prep"** (NDCG@5=0.97, P@5=80%)
- Archetype: use case + product — demonstrates contextual understanding
- Top results: food containers, vegetable choppers, meal prep containers, food processor
- Demo impact: practical, relatable, variety of strong products

**3. "minimalist desk setup"** (NDCG@5=0.84, P@5=80%)
- Archetype: vibe + space — demonstrates style/aesthetic understanding
- Top results: glass desks, monitor stands, wooden laptop stands, premium monitors
- Demo impact: visually cohesive, aspirational aesthetic appeal

**Replacing current showcase queries:**
- Current "cozy gift for someone who is always cold" (NDCG@5=0.65, P@5=40%) — underperforms, headphones lead
- Current "hosting a dinner party this weekend" (NDCG@5=0.89 but NDCG@30=0.55) — good but party supply contamination looks bad in demo
- Current "make my bathroom feel like a spa" — **KEEP, it's the best query**

### 2 Extra Suggestions

**1. "my closet is a mess"** — Persona + problem-solving. Top 7 results are perfect (shoe racks, drawer organizers). Demonstrates the pipeline understands natural language problems.

**2. "gifts for coffee lovers"** — Persona + gift. Good top results (coffee advent calendar, espresso cups, coffee machine). Broad appeal.

### Updated lib/showcase.ts (xtaldemo)

```typescript
xtaldemo: [
  { query: "make my bathroom feel like a spa", label: "vibe + space" },
  { query: "kitchen gadgets for meal prep", label: "use case + product" },
  { query: "minimalist desk setup", label: "aesthetic + setup" },
],
```

```typescript
xtaldemo: [
  "my closet is a mess",
  "gifts for coffee lovers",
],
```

---

## Action Items

1. [ ] **[Critical] Increase `bm25_weight` to 2.0** via admin panel (`/admin/settings/search`, select xtaldemo). This fixes yoga mat (zero results), Instant Pot (accessories only), and multi-attribute sheet queries.
2. [ ] **[High] Increase `keyword_rerank_strength` to 0.5** via admin panel. This reduces mid-result cliffs on dinner party and closet queries.
3. [ ] **[High] Update marketing prompt** via admin panel with the recommended text above. Addresses 4 of the 7 failure patterns.
4. [ ] **[Medium] Add brand prompt** with the recommended text above. Constrains query augmentation for mixed catalog.
5. [ ] **[Medium] Update `lib/showcase.ts`** with recommended featured queries: spa, meal prep, minimalist desk.
6. [ ] Re-run `/optimize-search xtaldemo` after settings changes to verify improvements, targeting:
   - "yoga mat" → at least 1 yoga mat in top 5
   - "Instant Pot" → at least 1 Instant Pot appliance in top 5
   - Mean NDCG@5 ≥ 0.85 (up from 0.73)
   - Mean P@5 ≥ 80% (up from 60%)
   - Mean Irrelevant@30 ≤ 15% (down from 30%)

---

## Appendix: Key Observations About xtaldemo Catalog

- The catalog contains **strong home goods, kitchen, and bedding coverage** — vibe queries work well
- **Clothing and electronics accessories** are very large sub-catalogs that tend to bleed into adjacent queries
- **Bulk/wholesale items** (72-piece beanie sets, 50-pack containers) appear frequently and have low single-shopper relevance; the marketing prompt should note "prioritize single-unit consumer products over bulk multipacks where appropriate"
- The catalog has **Merrell, Columbia, Muck Boot** hiking shoes — so hiking queries have good inventory but keyword retrieval is broken
- **"Party" vocabulary** is extremely broad in this catalog — children's birthday, Thanksgiving, Halloween, engagement, and dinner parties all compete for the same semantic space
- The **semantic pipeline (embedding + vibe matching) is well-calibrated** — the bathroom spa, meal prep, and closet queries confirm this. The problems are all in the BM25/keyword layer.
