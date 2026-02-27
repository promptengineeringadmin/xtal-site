"""
Normalize attribution tags in Qdrant by adding broad UI groupings.

Scrolls a collection, dumps all tags, asks Claude to consolidate them
into broad shopper-friendly ui_tags, then upserts back into Qdrant.

Usage:
    python scripts/normalize-tags.py --collection willow              # run on one
    python scripts/normalize-tags.py --collection all                 # run on all
    python scripts/normalize-tags.py --collection willow --dry-run    # preview only
    python scripts/normalize-tags.py --collection all --reset         # ignore progress, redo all

Requires:
    QDRANT_URL          Qdrant instance URL
    QDRANT_API_KEY      Qdrant API key (optional for local)
    ANTHROPIC_API_KEY   For the LLM normalization
"""

import argparse
import json
import os
import time

import anthropic
from qdrant_client import QdrantClient

BATCH_SIZE = 256
CHUNK_SIZE = 200
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
PROGRESS_PATH = os.path.join(DATA_DIR, "normalize-progress.json")

SYSTEM_PROMPT = """\
You are a product taxonomy specialist. You will receive a CSV of product tags \
in "prefix_value" format. Fill in the "broad" column with a shopper-friendly \
version of each tag.

Rules:
- Keep the prefix, only simplify the value part
- Use kebab-case: color_dark-blue -> color_blue
- If already broad enough, map to itself: color_blue -> color_blue
- Do NOT invent prefixes or values not in the input
- Output ONLY the CSV rows (tag,broad) with no header, no markdown fences, \
no extra text
- Every input row MUST have a corresponding output row"""


# ---------------------------------------------------------------------------
# Resume tracking
# ---------------------------------------------------------------------------

def load_progress() -> dict:
    if os.path.exists(PROGRESS_PATH):
        with open(PROGRESS_PATH) as f:
            return json.load(f)
    return {}


def save_progress(progress: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(PROGRESS_PATH, "w") as f:
        json.dump(progress, f, indent=2)


# ---------------------------------------------------------------------------
# Retry helper
# ---------------------------------------------------------------------------

def retry(fn, retries=3, backoff=(5, 10, 20)):
    """Call fn(), retrying on exception with exponential backoff."""
    for attempt in range(retries):
        try:
            return fn()
        except Exception as e:
            if attempt == retries - 1:
                raise
            wait = backoff[min(attempt, len(backoff) - 1)]
            print(f"    Retry {attempt + 1}/{retries} after error: {e} (waiting {wait}s)")
            time.sleep(wait)


# ---------------------------------------------------------------------------
# Core functions
# ---------------------------------------------------------------------------

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


def build_chunks(tag_counts: dict[str, int]) -> list[list[str]]:
    """Group tags by prefix, then pack into chunks of <= CHUNK_SIZE."""
    by_prefix: dict[str, list[str]] = {}
    for tag in tag_counts:
        prefix = tag.split("_", 1)[0]
        by_prefix.setdefault(prefix, []).append(tag)

    chunks: list[list[str]] = []
    current: list[str] = []
    for prefix in sorted(by_prefix):
        group = by_prefix[prefix]
        if len(current) + len(group) > CHUNK_SIZE and current:
            chunks.append(current)
            current = []
        if len(group) > CHUNK_SIZE:
            for i in range(0, len(group), CHUNK_SIZE):
                chunks.append(group[i:i + CHUNK_SIZE])
        else:
            current.extend(group)
    if current:
        chunks.append(current)
    return chunks


def parse_csv_response(text: str, expected_tags: list[str]) -> dict[str, str]:
    """Parse LLM CSV response into {tag: broad} mapping."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    # Skip header row if present
    lines = text.splitlines()
    if lines and lines[0].lower().startswith("tag"):
        lines = lines[1:]

    mapping: dict[str, str] = {}
    for line in lines:
        line = line.strip()
        if not line or "," not in line:
            continue
        tag, broad = line.split(",", 1)
        tag, broad = tag.strip(), broad.strip()
        if tag:
            mapping[tag] = broad if broad else tag

    # Fill in any missed tags with identity
    for tag in expected_tags:
        if tag not in mapping:
            mapping[tag] = tag
    return mapping


def normalize_tags(tag_counts: dict[str, int], model: str) -> dict[str, str]:
    """Chunk tags by prefix, send CSV to LLM, accumulate mapping."""
    chunks = build_chunks(tag_counts)
    print(f"  Split {len(tag_counts):,} tags into {len(chunks)} chunk(s)")

    client = anthropic.Anthropic()
    full_mapping: dict[str, str] = {}
    established: list[str] = []  # already-decided CSV rows for context

    for i, chunk in enumerate(chunks):
        csv_rows = "\n".join(f"{tag}," for tag in chunk)
        context = ""
        if established:
            context = (
                "Already decided (use these broad values where appropriate, "
                "do not modify):\ntag,broad\n"
                + "\n".join(established)
                + "\n\n"
            )
        user_msg = (
            f"{context}"
            f"Fill in the broad column for these {len(chunk)} tags:\n"
            f"tag,broad\n{csv_rows}"
        )

        # Per-chunk try/catch with retry (ETL rules 3 & 4)
        try:
            response = retry(lambda: client.messages.create(
                model=model, max_tokens=8192, system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_msg}],
            ))
            text = response.content[0].text
            chunk_mapping = parse_csv_response(text, chunk)
        except Exception as e:
            print(f"    ERROR chunk {i + 1}: {e} -- falling back to identity")
            chunk_mapping = {t: t for t in chunk}

        full_mapping.update(chunk_mapping)
        established.extend(f"{t},{b}" for t, b in chunk_mapping.items())

        changed = sum(1 for t, b in chunk_mapping.items() if t != b)
        print(f"    Chunk {i + 1}/{len(chunks)}: {len(chunk)} tags, {changed} remapped")

    total_changed = sum(1 for t, b in full_mapping.items() if t != b)
    print(f"  Total: {len(full_mapping)} tags, {total_changed} remapped")
    return full_mapping


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
                retry(lambda p=point, ut=ui_tags: client.set_payload(
                    collection_name=collection,
                    payload={"ui_tags": ut},
                    points=[p.id],
                ))
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

    # 3. Apply (upserts to Qdrant immediately, per collection)
    apply_mapping(client, collection, mapping, dry_run)


def main():
    parser = argparse.ArgumentParser(
        description="Normalize tags -> add broad ui_tags for filter display"
    )
    parser.add_argument("--collection", required=True, help="Collection name or 'all'")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--model", default="claude-sonnet-4-6", help="Anthropic model")
    parser.add_argument("--reset", action="store_true", help="Clear progress and start fresh")
    args = parser.parse_args()

    # Resume tracking
    progress = {} if args.reset else load_progress()
    if args.reset and os.path.exists(PROGRESS_PATH):
        os.remove(PROGRESS_PATH)
        print("Progress reset.")

    client = get_qdrant_client()
    for collection in resolve_collections(client, args.collection):
        if collection in progress and not args.reset:
            print(f"\nSkipping {collection} (already done, use --reset to redo)")
            continue

        process_collection(client, collection, args.model, args.dry_run)

        if not args.dry_run:
            progress[collection] = "done"
            save_progress(progress)


if __name__ == "__main__":
    main()
