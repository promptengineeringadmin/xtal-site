"""
Multiply Best Buy prices by 100 in Qdrant (payload-only, no re-embedding).

All prices in the XTAL system are stored in CENTS (integer).
The Best Buy API returns prices in DOLLARS (decimal).
This script patches the existing Qdrant data to convert dollars → cents.

Usage (run from the xtal-shopify-backend repo root):
    python -m scripts.fix_bestbuy_prices          # live run
    python -m scripts.fix_bestbuy_prices --dry-run # preview changes only

Requires the backend virtualenv with Qdrant credentials configured.
"""

import argparse
import statistics
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
import os

COLLECTION = "bestbuy"
BATCH_SIZE = 256

# If median price in the first batch exceeds this, data is likely already in cents.
# For electronics, $500 in cents = 50000. We use a conservative threshold.
ALREADY_CENTS_THRESHOLD = 50000


def get_qdrant_client() -> QdrantClient:
    """Initialize Qdrant client from environment variables."""
    url = os.environ.get("QDRANT_URL", "")
    api_key = os.environ.get("QDRANT_API_KEY", "")
    if not url:
        raise RuntimeError("QDRANT_URL environment variable is required")
    return QdrantClient(url=url, api_key=api_key if api_key else None)


def convert_price(value, field_name: str = "price") -> tuple:
    """Convert a price value from dollars to cents. Returns (new_value, was_converted)."""
    if value is None or value == 0:
        return value, False
    if isinstance(value, (int, float)):
        # Guard: skip if already looks like cents (very large number)
        if value > ALREADY_CENTS_THRESHOLD:
            return value, False
        return round(value * 100), True
    return value, False


def convert_variant_prices(variants) -> tuple:
    """Convert prices in a list of variant dicts. Returns (new_variants, any_converted)."""
    if not isinstance(variants, list):
        return variants, False

    new_variants = []
    any_converted = False
    for v in variants:
        if not isinstance(v, dict):
            new_variants.append(v)
            continue
        nv = dict(v)
        for key in ("price", "compare_at_price"):
            if key in nv:
                new_val, converted = convert_price(nv[key], key)
                if converted:
                    nv[key] = new_val
                    any_converted = True
        new_variants.append(nv)
    return new_variants, any_converted


def main():
    parser = argparse.ArgumentParser(
        description="Fix Best Buy prices in Qdrant (dollars → cents)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing to Qdrant",
    )
    args = parser.parse_args()

    client = get_qdrant_client()

    # Verify collection exists
    collections = [c.name for c in client.get_collections().collections]
    if COLLECTION not in collections:
        print(f"ERROR: Collection '{COLLECTION}' not found. Available: {collections}")
        return

    offset = None
    total_processed = 0
    total_patched = 0
    first_batch_prices = []
    all_original_prices = []
    all_new_prices = []

    print(f"{'DRY RUN — ' if args.dry_run else ''}Patching prices in '{COLLECTION}'...")
    print(f"Batch size: {BATCH_SIZE}")
    print()

    while True:
        points, next_offset = client.scroll(
            collection_name=COLLECTION,
            limit=BATCH_SIZE,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )

        if not points:
            break

        # Double-patch guard on first batch
        if total_processed == 0:
            first_batch_prices = [
                p.payload.get("price", 0)
                for p in points
                if isinstance(p.payload.get("price"), (int, float))
                and p.payload.get("price", 0) > 0
            ]
            if first_batch_prices:
                median = statistics.median(first_batch_prices)
                print(f"First batch median price: {median:.2f}")
                if median > ALREADY_CENTS_THRESHOLD:
                    print(
                        f"WARNING: Median price ({median:.2f}) exceeds {ALREADY_CENTS_THRESHOLD}. "
                        f"Data appears to already be in cents. Aborting to prevent double-patching."
                    )
                    return

        for point in points:
            price = point.payload.get("price")
            new_payload = {}
            changed = False

            # Convert main price field
            if price is not None:
                new_price, converted = convert_price(price, "price")
                if converted:
                    new_payload["price"] = new_price
                    all_original_prices.append(price)
                    all_new_prices.append(new_price)
                    changed = True

            # Convert compare_at_price if present
            cap = point.payload.get("compare_at_price")
            if cap is not None:
                new_cap, converted = convert_price(cap, "compare_at_price")
                if converted:
                    new_payload["compare_at_price"] = new_cap
                    changed = True

            # Convert variant prices if present
            variants = point.payload.get("variants")
            if variants is not None:
                new_variants, converted = convert_variant_prices(variants)
                if converted:
                    new_payload["variants"] = new_variants
                    changed = True

            if changed:
                if not args.dry_run:
                    client.set_payload(
                        collection_name=COLLECTION,
                        payload=new_payload,
                        points=[point.id],
                    )
                total_patched += 1

        total_processed += len(points)

        if total_processed % (BATCH_SIZE * 10) == 0 or next_offset is None:
            print(
                f"  Processed: {total_processed:,} | Patched: {total_patched:,}"
            )

        if next_offset is None:
            break
        offset = next_offset

    # Summary
    print()
    print("=" * 60)
    print(f"{'DRY RUN ' if args.dry_run else ''}COMPLETE")
    print(f"  Total points processed: {total_processed:,}")
    print(f"  Total points patched:   {total_patched:,}")
    if all_original_prices:
        print(
            f"  Price range (before):   "
            f"${min(all_original_prices):.2f} – ${max(all_original_prices):.2f}"
        )
        print(
            f"  Price range (after):    "
            f"{min(all_new_prices):,} – {max(all_new_prices):,} cents"
        )
    print("=" * 60)


if __name__ == "__main__":
    main()
