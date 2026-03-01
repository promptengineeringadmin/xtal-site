#!/usr/bin/env npx tsx
/**
 * One-off: Apply vertical presets to 13 priority collections
 */
import { VERTICAL_PRESETS } from "./lib/vertical-presets"
import { applySearchSettings, applyMarketingPrompt, applyBrandPrompt, applyAspectsEnabled } from "./lib/apply-settings"
import { categoryToVertical } from "./lib/category-mapping"
import * as fs from "fs"

const probes = JSON.parse(fs.readFileSync("./data/prospect-probe-results.json", "utf-8"))
const targets = [
  "arhaus", "parachute", "sixpenny", "brooklinen", "glossier",
  "colourpop", "fenty-beauty-kendo-brands", "kosas", "rare-beauty-rare-beauty-brands",
  "floyd", "maiden-home", "nonda", "bonus-home-heatonist",
]

async function run() {
  for (const slug of targets) {
    const vendor = probes.find((p: any) => p.slug === slug)
    if (!vendor) { console.log(`${slug}: NOT FOUND`); continue }
    const vertical = categoryToVertical(vendor.category)
    const preset = VERTICAL_PRESETS[vertical]
    console.log(`${slug} -> ${vertical} (enh=${preset.settings.query_enhancement_enabled}, bm25=${preset.settings.bm25_weight})`)

    const settingsResult = await applySearchSettings(slug, preset.settings)
    console.log(`  settings: ${settingsResult.source}`)

    if (preset.marketing_prompt) {
      const mpResult = await applyMarketingPrompt(slug, preset.marketing_prompt)
      console.log(`  marketing: ${mpResult.source}`)
    } else {
      console.log(`  marketing: (none for this vertical)`)
    }

    if (preset.brand_prompt) {
      const bpResult = await applyBrandPrompt(slug, preset.brand_prompt)
      console.log(`  brand: ${bpResult.source}`)
    }

    await applyAspectsEnabled(slug, preset.settings.aspects_enabled)
    console.log(`  DONE`)
  }
  console.log("\nALL DONE")
}

run().catch((e) => {
  console.error("Fatal:", e)
  process.exit(1)
})
