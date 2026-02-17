# Willow QA — Quick Fixes

Fixes that can be shipped in a single session using existing infrastructure.
Estimated total: **3-4 hours**

---

## Fix 1: Replace default suggestions for /willow

**Effort**: 30 min | **Impact**: First impression — exec sees irrelevant "dainty jewelry" on landing page

### Problem
`/willow/page.tsx` passes `collection="willow"` but no `suggestions` prop, so `SearchBar.tsx` falls back to generic `DEFAULT_SUGGESTIONS` (jewelry, cocktail bars, spa). The `/demo/[slug]` route already does this correctly — fetches per-collection suggestions from Redis.

### Root Cause
Willow is a hardcoded static route, not using the dynamic demo system that was built later. The "Generate queries" infrastructure exists (`/admin/demos` page) but the suggestions pipeline seeds from a hardcoded generic candidate list — see **Major Initiative #2** for fixing that.

### Fix
Wire the `/willow` page the same way `/demo/[slug]` works:

**File**: `src/app/(public)/willow/page.tsx`
```tsx
import { getAllCollections } from "@/lib/admin/demo-collections"

export default async function WillowPage() {
  const collections = await getAllCollections()
  const willow = collections.find((c) => c.id === "willow")

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#FCFDFF]">
        <TrySearch collection="willow" suggestions={willow?.suggestions} />
      </main>
    </>
  )
}
```

**Then**: Manually save good Willow-specific suggestions via the admin UI at `/admin/demos` (edit button), or wait for Major Initiative #2 to fix the AI generation pipeline. Good manual examples:
- "rustic gift basket containers for spring"
- "wholesale planters for garden center displays"
- "seasonal packaging for holiday gifts"
- "wood trays and serving pieces"
- "bulk shredded fill and packaging supplies"

---

## Fix 2: Filter $0 prices from search results

**Effort**: 30 min | **Impact**: 3 products with $0.00 appearing in results

### Problem
Products with zero/null prices (`OV GREEN WILLOW MINI WASH`, `OV TIN TUB SH`, `PVC LINER FOR 871`) display as "$0.00" and pollute price-filtered searches like "planters under $50".

### Note on penny fix
The recently deployed penny fix (`scripts/fix_willow_prices.py`) addressed cents-to-dollars conversion. This may have fixed the "over $200 returns $2 item" issue (QA P0 #2). **Re-run QA to verify.** The $0 products are a separate data quality issue — those items genuinely have no price in the source data.

### Fix
Add a default `price > 0` condition in the Qdrant filter builder.

**File**: `xtal-shopify-backend/app/services/vector_search.py`
**Function**: `_build_qdrant_filter()` (~line 556)

Add at the top of the conditions list, before any user filters:
```python
conditions = []

# Default: exclude zero/null prices (unpublished or missing data)
conditions.append(
    FieldCondition(key="price", range=Range(gt=0))
)

# Handle price and categorical filters (existing behavior)
if filters:
    # ... existing code
```

### Verify
Re-run search for "planters under $50" — the three $0 products should no longer appear.

---

## Fix 3: Skipped

---

## Fix 4: Strip HTML from vendor field (2 affected products)

**Effort**: 1 hr | **Impact**: 2 products show raw `<p>` HTML as vendor text

### Problem
Two products (`OV WILLOW/SEAGRASS OH`, `RECT LINER 8 L 5.25 W 3 H`) have HTML from the product body bleeding into the vendor field, causing a wall of text in the card UI.

### Fix — Qdrant payload patch (no re-ingestion)
Write a small script modeled after the existing `scripts/fix_willow_prices.py` pattern. Use `set_payload` to update just the `vendor` field on affected records.

**File**: `xtal-shopify-backend/scripts/fix_willow_vendor.py`
```python
"""Strip HTML tags from vendor field in Qdrant (payload-only, no re-embedding)."""
import re
from app.services.ingestion.qdrant_client import QdrantClient

def strip_html(text: str) -> str:
    return re.sub(r'<[^>]+>', '', text).strip()

def main():
    qdrant = QdrantClient(collection_name="willow")
    points, _ = qdrant.client.scroll(collection_name="willow", limit=200, with_payload=True)

    fixed = 0
    for point in points:
        vendor = point.payload.get("vendor", "")
        if "<" in vendor and ">" in vendor:
            clean = strip_html(vendor) or "Willow Group Ltd."
            qdrant.client.set_payload(
                collection_name="willow",
                payload={"vendor": clean},
                points=[point.id],
            )
            fixed += 1
            print(f"Fixed: {point.payload.get('title', '?')} → vendor='{clean}'")

    print(f"Done. Fixed {fixed} records.")

if __name__ == "__main__":
    main()
```

### Prevent future occurrences
Also add HTML stripping to the CSV converter's `_col()` method:

**File**: `xtal-shopify-backend/app/services/ingestion/shopify_csv_converter.py` (line 129)
```python
import re

def _col(self, row: dict, *candidates: str) -> str:
    for name in candidates:
        val = str(row.get(name, "")).strip()
        if val:
            val = re.sub(r'<[^>]+>', '', val).strip()
            return val
    return ""
```

### Frontend defense-in-depth
**File**: `components/try/ProductCard.tsx` (line 87-90)
```tsx
{product.vendor && (
  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
    {product.vendor.replace(/<[^>]*>/g, '').substring(0, 60)}
  </span>
)}
```

---

## Fix 5: Verify penny fix resolved "over $200" issue

**Effort**: 15 min | **Impact**: P0 if still broken

### Problem
"Premium display pieces over $200" returned a $2.00 plastic liner. This was likely caused by the cents/dollars mismatch that `fix_willow_prices.py` addressed.

### Action
Re-run the QA script after the deploy:
```bash
export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
npx tsx scripts/qa-willow.ts
```

Check the specific query "premium display pieces over $200" in the output. If fixed, close this item. If still broken, escalate to **Major Initiative #3** (price extraction debugging).

---

## Summary

| # | Fix | Status | Depends on |
|---|-----|--------|------------|
| 1 | Wire willow suggestions | Ready | Manual entry or MI #2 |
| 2 | Filter $0 prices | Ready | Backend deploy |
| 3 | Strip price aspect chips | Ready | Frontend deploy |
| 4 | Fix vendor HTML | Ready | Script + backend deploy |
| 5 | Verify penny fix | Ready | Re-run QA |
