# Willow QA — Backlog

Lower-priority items that don't block the demo but would improve quality over time.

---

## Response time optimization
**Current**: 3.6s avg (range 2.3-5.6s). First searches hit 5+ seconds.
**Target**: <2s average.
**Options**:
- Caching repeat queries (Redis, TTL-based)
- Reducing AI augmentation stage timeout
- Pre-warming: background search on page load for popular queries
- Note: Aspect grounding (MI #1) moves aspect gen server-side, adding ~300ms to search but eliminating the parallel aspect call. Net impact should be roughly neutral.

## Missing product images
3 products have no image: `OV WILLOW/SEAGRASS OH`, `RECT LINER 8 L 5.25 W 3 H`, `OV GREEN WILLOW MINI WASH`.
**Status**: Data quality issue. Images may not exist in the source system. Can't fix without source data.

## SKU-style product titles
77% of titles are internal codes ("RD TIN PLANTER SH", "S/3 SQ PPRBRD BOXES W/ LID").
**Status**: This is how Willow's product data comes from their system. Changing titles would require either an LLM title-expansion pass during ingestion or a frontend display transform. Willow team would need to approve any title rewrites since these are their canonical product names.

## Intent-based relevance gaps
"Gifts for someone who loves gardening" returns Christmas items (`RD FELT SANTA SLEEVE W/GLASS`). "Wholesale display shelving" returns moss baskets. These are semantic search relevance issues where the AI augmentation over-generalizes.
**Fix**: Brand/marketing prompts tuning + weight optimization once ANTHROPIC_API_KEY is deployed and optimizer is built.

## Facet filter completeness
Sidebar shows Material, Shape, Use Case, Room, Style, Feature, Size, Quantity sections (all collapsed). Need manual review to verify values are useful and complete for Willow's catalog. This depends on ingestion tag quality.

## Weight optimizer not implemented
`/api/vendor/optimize-weights` endpoint references `app/services/weight_optimizer.py` which doesn't exist yet. This is a stub. ANTHROPIC_API_KEY is in the ECS task definition (`infra/ecs.tf` line 134) but the SSM parameter may not be populated.
**Prerequisite**: Build the optimizer service, then populate the SSM param.

## Price-range aspect chips (interim)
Quick Fix #3 strips price chips from the frontend. This is a band-aid. Initiative #1 (grounded aspects) will eliminate price chip generation at the source by constraining the LLM to real catalog attributes.

---

## Not fixing (by design)

| Item | Reason |
|------|--------|
| SKU-style titles | Client's canonical product names |
| Missing images | Source data gap — no images exist |
| Weight optimizer | Feature not yet built |
