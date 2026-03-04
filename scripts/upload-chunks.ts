/**
 * Upload pre-split JSONL chunks to the backend sequentially.
 * Each chunk is uploaded as a separate ingest task, with polling until complete.
 * Backend dedup skips already-enriched products.
 *
 * Usage:
 *   npx tsx scripts/upload-chunks.ts --collection bloomchic --chunks /tmp/xtal-chunks/bloomchic-chunk-*.jsonl
 */

import fs from "fs"
import path from "path"
import { ingestToXtal } from "./lib/ingest-to-xtal.js"

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function main() {
  const args = process.argv.slice(2)

  // Parse --collection
  const colIdx = args.indexOf("--collection")
  if (colIdx === -1 || !args[colIdx + 1]) {
    console.error("Usage: npx tsx scripts/upload-chunks.ts --collection <name> --chunks <file1> <file2> ...")
    process.exit(1)
  }
  const collection = args[colIdx + 1]

  // Parse --chunks (everything after --chunks flag)
  const chunksIdx = args.indexOf("--chunks")
  if (chunksIdx === -1 || !args[chunksIdx + 1]) {
    console.error("Usage: npx tsx scripts/upload-chunks.ts --collection <name> --chunks <file1> <file2> ...")
    process.exit(1)
  }
  const chunkFiles = args.slice(chunksIdx + 1).filter(f => !f.startsWith("--"))

  if (chunkFiles.length === 0) {
    console.error("No chunk files provided")
    process.exit(1)
  }

  // Verify all files exist
  for (const f of chunkFiles) {
    if (!fs.existsSync(f)) {
      console.error(`File not found: ${f}`)
      process.exit(1)
    }
  }

  log(`Uploading ${chunkFiles.length} chunks to collection: ${collection}`)
  let totalProcessed = 0

  for (let i = 0; i < chunkFiles.length; i++) {
    const chunk = chunkFiles[i]
    const lineCount = fs.readFileSync(chunk, "utf-8").split("\n").filter(Boolean).length
    log(`\n=== Chunk ${i + 1}/${chunkFiles.length}: ${path.basename(chunk)} (${lineCount} products) ===`)

    try {
      const result = await ingestToXtal({
        jsonlPath: chunk,
        slug: collection,
        label: collection,
        force: true,
      })

      if (result.status === "completed") {
        const processed = result.productsProcessed ?? 0
        totalProcessed += processed
        log(`Chunk ${i + 1} complete: ${processed} products processed`)
      } else {
        log(`Chunk ${i + 1} finished with status: ${result.status}`)
        if (result.error) log(`  Error: ${result.error}`)
      }
    } catch (err) {
      log(`Chunk ${i + 1} FAILED: ${err instanceof Error ? err.message : String(err)}`)
      // Continue with next chunk — dedup will handle any overlap
    }
  }

  log(`\nAll chunks uploaded. Total processed: ${totalProcessed}`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
