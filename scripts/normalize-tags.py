"""
Normalize attribution tags in Qdrant by adding broad UI groupings.

Scrolls a collection, dumps all tags, asks Claude to consolidate them
into broad shopper-friendly ui_tags, then upserts back into Qdrant.

Usage:
    python scripts/normalize-tags.py --collection willow              # run on one
    python scripts/normalize-tags.py --collection all                 # run on all
    python scripts/normalize-tags.py --collection willow --dry-run    # preview only

Requires:
    QDRANT_URL          Qdrant instance URL
    QDRANT_API_KEY      Qdrant API key (optional for local)
    ANTHROPIC_API_KEY   For the LLM normalization
"""

import argparse
import json
import os

import anthropic
from qdrant_client import QdrantClient

BATCH_SIZE = 256

SYSTEM_PROMPT = """\
You are a product taxonomy specialist. You will receive a list of product \
tags in "prefix_value" format (e.g. color_midnight-blue, material_genuine-leather).

Your job: return a JSON object mapping each EXACT input tag to a broader, \
shopper-friendly version. Same "prefix_value" format, but with the value \
simplified to what a shopper would expect in a filter dropdown.

Rules:
- Keep the prefix, only simplify the value
- Use kebab-case: "color_dark-blue" -> "color_blue"
- If already broad enough, map to itself: "color_blue" -> "color_blue"
- Do NOT invent prefixes or values not represented in the input
- Every input tag MUST appear as a key in your output
- Respond with valid JSON only, no markdown fences"""


def get_qdrant_client() -> QdrantClient:
    url = os.environ.get("QDRANT_URL", "")
    api_key = os.environ.get("QDRANT_API_KEY", "")
    if not url:
        raise RuntimeError("QDRANT_URL environment variable is required")
    return QdrantClient(url=url, api_key=api_key if api_key else None)


def resolve_collections(client: QdrantClient, arg: str) -> list[str]:
    available = sorted(c.name for c in client.get_collections().collections)
    if arg == "all":
        print(f"Found {len(available)} collections: {', '.join(available)}")
        return available
    if arg not in available:
        print(f"ERROR: '{arg}' not found. Available: {available}")
        return []
    return [arg]


def extract_tags(client: QdrantClient, collection: str) -> dict[str, int]:
    """Scroll collection and return {tag: count} for all prefix_value tags."""
    tag_counts: dict[str, int] = {}
    offset = None
    total = 0

    while True:
        points, next_offset = client.scroll(
            collection_name=collection, limit=BATCH_SIZE,
            offset=offset, with_payload=True, with_vectors=False,
        )
        if not points:
            break
        for point in points:
            total += 1
            for tag in point.payload.get("tags", []):
                if "_" in tag and not tag.startswith("_"):
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        offset = next_offset
        if offset is None:
            break

    print(f"  Scanned {total:,} products, found {len(tag_counts):,} unique tags")
    return tag_counts


def normalize_tags(tag_counts: dict[str, int], model: str) -> dict[str, str]:
    """Send all tags to Claude, get back {specific_tag: broad_tag} mapping."""
    # Sort by count descending so LLM sees the important ones first
    sorted_tags = sorted(tag_counts.keys(), key=lambda t: -tag_counts[t])
    tag_list = "\n".join(sorted_tags)

    client = anthropic.Anthropic()
    text = ""
    with client.messages.stream(
        model=model,
        max_tokens=32000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content":
            f"Here are {len(sorted_tags)} product tags to normalize:\n\n{tag_list}"}],
    ) as stream:
        for chunk in stream.text_stream:
            text += chunk
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]

    try:
        mapping = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  WARNING: Failed to parse LLM response: {e}")
        return {t: t for t in sorted_tags}

    # Validate: fill in any missing tags with identity
    for tag in sorted_tags:
        if tag not in mapping:
            mapping[tag] = tag

    changed = sum(1 for t, broad in mapping.items() if t != broad)
    print(f"  LLM normalized {len(mapping)} tags ({changed} remapped)")
    return mapping


def apply_mapping(client: QdrantClient, collection: str,
                  mapping: dict[str, str], dry_run: bool):
    """Scroll collection, compute ui_tags from mapping, upsert to Qdrant."""
    offset = None
    total = 0
    patched = 0

    while True:
        points, next_offset = client.scroll(
            collection_name=collection, limit=BATCH_SIZE,
            offset=offset, with_payload=True, with_vectors=False,
        )
        if not points:
            break

        for point in points:
            tags = point.payload.get("tags", [])
            if not tags:
                continue

            ui_tags = []
            for tag in tags:
                broad = mapping.get(tag, tag)
                ui_tags.append(broad)

            # Deduplicate preserving order
            ui_tags = list(dict.fromkeys(ui_tags))

            if not dry_run:
                client.set_payload(
                    collection_name=collection,
                    payload={"ui_tags": ui_tags},
                    points=[point.id],
                )
            patched += 1

        total += len(points)
        offset = next_offset
        if offset is None:
            break

    label = "DRY RUN " if dry_run else ""
    print(f"  {label}Applied: {total:,} products, {patched:,} patched")


def process_collection(client: QdrantClient, collection: str,
                       model: str, dry_run: bool):
    print(f"\n{'='*60}\n{collection}\n{'='*60}")

    # 1. Extract
    tag_counts = extract_tags(client, collection)
    if not tag_counts:
        print("  No tags found, skipping.")
        return

    # 2. Normalize
    mapping = normalize_tags(tag_counts, model)

    # 3. Apply
    apply_mapping(client, collection, mapping, dry_run)


def main():
    parser = argparse.ArgumentParser(
        description="Normalize tags -> add broad ui_tags for filter display"
    )
    parser.add_argument("--collection", required=True, help="Collection name or 'all'")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--model", default="claude-sonnet-4-6", help="Anthropic model")
    args = parser.parse_args()

    client = get_qdrant_client()
    for collection in resolve_collections(client, args.collection):
        process_collection(client, collection, args.model, args.dry_run)


if __name__ == "__main__":
    main()
