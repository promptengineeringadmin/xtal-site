#!/usr/bin/env bash
# Gap-fill all 23 remaining partial/empty/new collections
# Run this AFTER headphones-com task completes and cleanup runs
#
# Order: CSV-wipe collections first (fresh ingest), then JSONL-partial (dedup), then empty/new

set -e
cd "$(dirname "$0")/.."
export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)

log() { echo "[$(date -u +%H:%M:%S)] $1"; }

# Helper: ingest a single vendor and wait
ingest() {
  local vendor="$1"
  log "═══ Ingesting: $vendor ═══"
  npx tsx scripts/bulk-store-setup.ts --vendor "$vendor" --step ingest --force
  log "  Done: $vendor"
}

log "═══════════════════════════════════════════════════"
log "  Gap-Fill All Collections"
log "═══════════════════════════════════════════════════"

# Phase 1: CSV collections — wiped to 0, fresh ingest (all products processed)
# Ordered by size (smallest first to validate quickly)
log ""
log "=== Phase 1: CSV collections (fresh ingest) ==="
ingest "fenty-beauty-kendo-brands"    # 894 products
ingest "maiden-home"                  # 7328 products
ingest "abc-carpet-and-home"          # 17272 products
ingest "arhaus"                       # 8048 products

# Phase 2: JSONL partial collections — dedup skips enriched, only gap processed
log ""
log "=== Phase 2: JSONL partial (dedup gap-fill) ==="
ingest "jenni-kayne"                  # 501 gap
ingest "dania-furniture"              # 543 gap (some enrichment_complete=false)
ingest "heirloom-roses"               # 1382 gap
ingest "nine-west"                    # 1312 gap
ingest "pair-eyewear"                 # 1115 gap
ingest "westinghouse"                 # 1943 gap
ingest "gspawn"                       # 2316 gap
ingest "supermarket-italy"            # 2811 gap
ingest "260-sample-sale"              # 2995 gap
ingest "lola-and-the-boys"            # 2828 gap
ingest "threadheads"                  # 4654 gap

# Phase 3: Empty collections (0 products in Qdrant) — fresh ingest
log ""
log "=== Phase 3: Empty collections (fresh ingest) ==="
ingest "micas"                        # 5317 products
ingest "lulu-and-georgia"             # 9719 products
ingest "bloomchic"                    # 12325 products  [deferred-large]
ingest "books-of-wonder"              # 14634 products  [deferred-large]
ingest "film-art-gallery"             # 15127 products  [deferred-large]
ingest "new-era-cap"                  # 25000 products  [deferred-large]
ingest "revival"                      # 25003 products  [deferred-large]

log ""
log "═══════════════════════════════════════════════════"
log "  All collections ingested. Run audit to verify."
log "═══════════════════════════════════════════════════"
