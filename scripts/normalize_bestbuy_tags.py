"""
Normalize Best Buy attribution tags in Qdrant by adding broad UI groupings.

Existing `tags` (specific, e.g. color_charcoal) are kept intact for search
precision. A new `ui_tags` field is added with broad display-friendly
groupings (e.g. color_black) for the filter rail.

Uses Claude to group specific tag values into broad UI categories, chunked
by prefix to avoid hallucinations.

Usage:
    python scripts/normalize_bestbuy_tags.py run              # full pipeline
    python scripts/normalize_bestbuy_tags.py run --dry-run    # preview only
    python scripts/normalize_bestbuy_tags.py extract           # step 1 only
    python scripts/normalize_bestbuy_tags.py normalize         # step 2 only
    python scripts/normalize_bestbuy_tags.py apply             # step 3 only
    python scripts/normalize_bestbuy_tags.py apply --dry-run   # step 3 preview

Requires:
    QDRANT_URL          Qdrant instance URL
    QDRANT_API_KEY      Qdrant API key (optional for local)
    ANTHROPIC_API_KEY   For the normalize step
"""

import argparse
import json
import os
import time
from datetime import datetime, timezone

import anthropic
from qdrant_client import QdrantClient

COLLECTION = "bestbuy"
BATCH_SIZE = 256
MAX_VALUES_PER_CHUNK = 150
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
INVENTORY_PATH = os.path.join(DATA_DIR, "bestbuy-tag-inventory.json")
MAPPING_PATH = os.path.join(DATA_DIR, "bestbuy-tag-mapping.json")

NORMALIZE_SYSTEM_PROMPT = """\
You are a product taxonomy specialist. Your job is to group specific product \
attribute values into broad, user-friendly UI categories for filter display.

RULES:
1. Return a JSON object mapping each input value to a broad category label.
2. The broad category should be a simple, widely-recognized term that a \
shopper would expect to see in a filter dropdown.
3. Use kebab-case for all values (e.g., "dark-blue" maps to "blue").
4. If a value is already broad enough, map it to itself.
5. Do NOT invent categories that aren't represented — group into the nearest \
natural parent.
6. Every input value MUST appear as a key in your output.

Examples:
- charcoal → black
- midnight-black → black
- jet-black → black
- periwinkle → blue
- dark-blue → blue
- navy → blue
- genuine-leather → leather
- faux-leather → leather
- stainless-steel → steel

Respond with valid JSON only. No markdown fences."""


def get_qdrant_client() -> QdrantClient:
    url = os.environ.get("QDRANT_URL", "")
    api_key = os.environ.get("QDRANT_API_KEY", "")
    if not url:
        raise RuntimeError("QDRANT_URL environment variable is required")
    return QdrantClient(url=url, api_key=api_key if api_key else None)


# ---------------------------------------------------------------------------
# Step 1: Extract
# ---------------------------------------------------------------------------

def cmd_extract(_args):
    """Scroll all Best Buy products and collect tag inventory by prefix."""
    client = get_qdrant_client()

    collections = [c.name for c in client.get_collections().collections]
    if COLLECTION not in collections:
        print(f"ERROR: Collection '{COLLECTION}' not found. Available: {collections}")
        return

    offset = None
    tag_counts: dict[str, dict[str, int]] = {}
    total_products = 0
    products_with_tags = 0

    print(f"Scanning '{COLLECTION}' for tags...")

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

        for point in points:
            total_products += 1
            tags = point.payload.get("tags", [])
            if not tags:
                continue
            products_with_tags += 1

            for tag in tags:
                prefix, sep, value = tag.partition("_")
                if not sep or not value:
                    prefix = "__unstructured__"
                    value = tag
                bucket = tag_counts.setdefault(prefix, {})
                bucket[value] = bucket.get(value, 0) + 1

        if next_offset is None:
            break
        offset = next_offset

        if total_products % (BATCH_SIZE * 10) == 0:
            print(f"  Scanned {total_products:,} products...")

    # Sort values by count descending within each prefix
    inventory = {}
    for prefix in sorted(tag_counts.keys()):
        inventory[prefix] = dict(
            sorted(tag_counts[prefix].items(), key=lambda x: -x[1])
        )

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(INVENTORY_PATH, "w") as f:
        json.dump(inventory, f, indent=2)

    print(f"\nProducts scanned: {total_products:,}")
    print(f"  with tags: {products_with_tags:,}")
    print(f"  without tags: {total_products - products_with_tags:,}")
    print(f"Prefixes found: {len(inventory)}")
    for prefix, values in inventory.items():
        print(f"  {prefix}: {len(values)} unique values, {sum(values.values()):,} occurrences")
    print(f"\nInventory saved to {INVENTORY_PATH}")


# ---------------------------------------------------------------------------
# Step 2: Normalize
# ---------------------------------------------------------------------------

def _chunk_values(values: dict[str, int]) -> list[dict[str, int]]:
    """Split a large values dict into alphabetically-sorted chunks."""
    sorted_items = sorted(values.items(), key=lambda x: x[0].lower())
    chunks = []
    for i in range(0, len(sorted_items), MAX_VALUES_PER_CHUNK):
        chunks.append(dict(sorted_items[i:i + MAX_VALUES_PER_CHUNK]))
    return chunks


def _build_user_prompt(prefix: str, values: dict[str, int]) -> str:
    lines = [f'Attribute prefix: "{prefix}"']
    lines.append(f"Values ({len(values)} unique):")
    for value, count in sorted(values.items(), key=lambda x: -x[1]):
        lines.append(f"  {value} ({count} products)")
    lines.append("")
    lines.append(
        "Return a JSON object mapping EVERY value above to its broad UI category. "
        "If the value is already broad enough, map it to itself."
    )
    return "\n".join(lines)


def _call_llm(
    client: anthropic.Anthropic,
    prefix: str,
    values: dict[str, int],
    model: str,
) -> dict[str, str]:
    """Send a prefix's values to Claude and get back the grouping mapping."""
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        system=NORMALIZE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_user_prompt(prefix, values)}],
    )

    text = response.content[0].text
    # Strip markdown fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]

    try:
        mapping = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  WARNING: Failed to parse LLM response for {prefix}: {e}")
        print(f"  Raw response: {text[:200]}")
        return {v: v for v in values}  # identity fallback

    # Validate: every input value should appear
    validated = {}
    for value in values:
        if value in mapping:
            validated[value] = mapping[value]
        else:
            print(f"  WARNING: LLM missed value '{value}' for {prefix}, keeping as-is")
            validated[value] = value

    return validated


def cmd_normalize(args):
    """Use LLM to group specific tag values into broad UI categories."""
    if not os.path.exists(INVENTORY_PATH):
        print(f"ERROR: Inventory not found at {INVENTORY_PATH}. Run 'extract' first.")
        return

    with open(INVENTORY_PATH) as f:
        inventory = json.load(f)

    model = getattr(args, "model", "claude-sonnet-4-20250514")
    llm_client = anthropic.Anthropic()

    all_mappings: dict[str, dict[str, str]] = {}
    total_grouped = 0

    for prefix, values in inventory.items():
        if prefix == "__unstructured__":
            print(f"Skipping __unstructured__ tags")
            continue

        if len(values) <= 1:
            # Single value — map to itself
            all_mappings[prefix] = {v: v for v in values}
            continue

        print(f"\nNormalizing {prefix} ({len(values)} values)...")

        chunks = _chunk_values(values)
        prefix_mapping: dict[str, str] = {}

        for i, chunk in enumerate(chunks):
            if len(chunks) > 1:
                print(f"  Chunk {i + 1}/{len(chunks)} ({len(chunk)} values)")

            mapping = _call_llm(llm_client, prefix, chunk, model)
            prefix_mapping.update(mapping)
            time.sleep(0.5)  # rate limit courtesy

        all_mappings[prefix] = prefix_mapping

        # Count how many values got grouped (mapped to something different)
        changed = sum(1 for old, broad in prefix_mapping.items() if old != broad)
        unique_groups = len(set(prefix_mapping.values()))
        total_grouped += changed
        print(f"  {len(values)} values → {unique_groups} UI groups ({changed} remapped)")

    output = {
        "_meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model": model,
            "collection": COLLECTION,
            "total_prefixes": len(all_mappings),
            "total_values": sum(len(m) for m in all_mappings.values()),
            "total_remapped": total_grouped,
        },
        "mappings": all_mappings,
    }

    with open(MAPPING_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nMapping saved to {MAPPING_PATH}")
    print(f"Total: {total_grouped} values remapped across {len(all_mappings)} prefixes")


# ---------------------------------------------------------------------------
# Step 3: Apply
# ---------------------------------------------------------------------------

def cmd_apply(args):
    """Read mapping and add ui_tags to each product in Qdrant via set_payload."""
    if not os.path.exists(MAPPING_PATH):
        print(f"ERROR: Mapping not found at {MAPPING_PATH}. Run 'normalize' first.")
        return

    with open(MAPPING_PATH) as f:
        data = json.load(f)

    mappings = data["mappings"]

    # Build flat remap: for each prefix, map "prefix_specific" → "prefix_broad"
    value_remap: dict[str, dict[str, str]] = {}  # prefix → {specific: broad}
    for prefix, prefix_mappings in mappings.items():
        value_remap[prefix] = prefix_mappings

    total_remaps = sum(
        1 for pm in value_remap.values()
        for old, broad in pm.items() if old != broad
    )
    print(f"Loaded mapping: {total_remaps} remaps across {len(value_remap)} prefixes")

    dry_run = getattr(args, "dry_run", False)
    if dry_run:
        print("DRY RUN — no changes will be written\n")

    client = get_qdrant_client()
    offset = None
    total_processed = 0
    total_patched = 0

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

        for point in points:
            tags = point.payload.get("tags", [])
            if not tags:
                continue

            ui_tags = []
            for tag in tags:
                prefix, sep, value = tag.partition("_")
                if not sep or not value:
                    ui_tags.append(tag)
                    continue

                broad = value_remap.get(prefix, {}).get(value, value)
                ui_tags.append(f"{prefix}_{broad}")

            # Deduplicate while preserving order
            ui_tags = list(dict.fromkeys(ui_tags))

            if not dry_run:
                client.set_payload(
                    collection_name=COLLECTION,
                    payload={"ui_tags": ui_tags},
                    points=[point.id],
                )
            total_patched += 1

        total_processed += len(points)

        if total_processed % (BATCH_SIZE * 10) == 0 or next_offset is None:
            print(f"  Processed: {total_processed:,} | Patched: {total_patched:,}")

        if next_offset is None:
            break
        offset = next_offset

    print(f"\n{'DRY RUN ' if dry_run else ''}COMPLETE")
    print(f"  Products processed: {total_processed:,}")
    print(f"  Products with ui_tags: {total_patched:,}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Normalize Best Buy tags — add broad ui_tags for filter display"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # run (full pipeline)
    p_run = subparsers.add_parser("run", help="Run full pipeline: extract → normalize → apply")
    p_run.add_argument("--dry-run", action="store_true", help="Preview apply step without writing")
    p_run.add_argument("--model", default="claude-sonnet-4-20250514", help="Anthropic model")

    # extract
    subparsers.add_parser("extract", help="Scan Qdrant and build tag inventory")

    # normalize
    p_norm = subparsers.add_parser("normalize", help="Use LLM to generate UI groupings")
    p_norm.add_argument("--model", default="claude-sonnet-4-20250514", help="Anthropic model")

    # apply
    p_apply = subparsers.add_parser("apply", help="Apply mapping to Qdrant (add ui_tags)")
    p_apply.add_argument("--dry-run", action="store_true", help="Preview without writing")

    args = parser.parse_args()

    if args.command == "run":
        cmd_extract(args)
        cmd_normalize(args)
        cmd_apply(args)
    elif args.command == "extract":
        cmd_extract(args)
    elif args.command == "normalize":
        cmd_normalize(args)
    elif args.command == "apply":
        cmd_apply(args)


if __name__ == "__main__":
    main()
