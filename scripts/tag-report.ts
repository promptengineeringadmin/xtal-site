/**
 * Local tagging & attribution for grader reports using Ollama (Llama 3.1 8B).
 * Zero-cost post-processing that enriches reports with lead quality signals,
 * recommendation effort estimates, and root-cause attribution.
 *
 * Prerequisites:
 *   1. Install Ollama: https://ollama.com
 *   2. Pull the model: ollama pull llama3.1:8b
 *   3. Ollama runs on http://localhost:11434 by default
 *
 * Usage:
 *   npx tsx scripts/tag-report.ts <store-slug>          # single report
 *   npx tsx scripts/tag-report.ts --all                 # all reports
 *   npx tsx scripts/tag-report.ts <slug> --model llama3.1:70b  # custom model
 *
 * Output: writes tags.json alongside each report.json
 */

import * as fs from "fs"
import * as path from "path"

// ─── Config ───────────────────────────────────────────────────

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const DEFAULT_MODEL = "llama3.1:8b"
const OUTPUT_DIR = path.join(process.cwd(), "grader-output")

// ─── Types ────────────────────────────────────────────────────

interface ReportTags {
  storeUrl: string
  storeName: string
  taggedAt: string
  model: string

  leadQuality: {
    score: "hot" | "warm" | "cold"
    signals: string[]
    idealCustomerFit: number // 0-100
    buyingUrgency: "high" | "medium" | "low"
  }

  recommendations: {
    dimension: string
    effort: "quick-win" | "medium" | "high-effort"
    rootCause: string
    category: "config" | "feature-gap" | "data-quality" | "platform-limitation"
    xtalCanSolve: boolean
    estimatedImpact: "high" | "medium" | "low"
  }[]

  outreachTags: string[] // e.g. ["luxury", "fashion", "shopify", "high-null-rate"]
  suggestedAngle: string // one-line outreach angle
  verticalBenchmark: string // how they compare to similar stores
}

// ─── Ollama Client ────────────────────────────────────────────

async function ollamaGenerate(
  model: string,
  prompt: string
): Promise<string> {
  const resp = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 2048,
      },
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Ollama error (${resp.status}): ${text}`)
  }

  const data = (await resp.json()) as { response: string }
  return data.response
}

async function checkOllama(model: string): Promise<void> {
  try {
    const resp = await fetch(`${OLLAMA_URL}/api/tags`)
    if (!resp.ok) throw new Error("Ollama not responding")
    const data = (await resp.json()) as { models: { name: string }[] }
    const available = data.models.map((m) => m.name)
    if (!available.some((n) => n.startsWith(model.split(":")[0]))) {
      console.warn(
        `  Warning: Model "${model}" not found locally. Available: ${available.join(", ")}`
      )
      console.warn(`  Run: ollama pull ${model}`)
    }
  } catch {
    console.error(
      "Error: Cannot reach Ollama. Make sure it's running (ollama serve)."
    )
    process.exit(1)
  }
}

// ─── Tagging Prompt ───────────────────────────────────────────

function buildTaggingPrompt(report: Record<string, unknown>): string {
  return `You are a sales intelligence analyst for XTAL, an AI-powered site search company.
Given a site search grader report for an e-commerce store, produce a JSON tagging document.

REPORT:
${JSON.stringify(report, null, 2)}

Respond with ONLY valid JSON (no markdown, no explanation) matching this exact structure:
{
  "leadQuality": {
    "score": "hot" | "warm" | "cold",
    "signals": ["array of 2-4 specific signals from the report justifying the score"],
    "idealCustomerFit": <0-100 number>,
    "buyingUrgency": "high" | "medium" | "low"
  },
  "recommendations": [
    {
      "dimension": "<dimension key from report>",
      "effort": "quick-win" | "medium" | "high-effort",
      "rootCause": "<one sentence: why this dimension scored poorly>",
      "category": "config" | "feature-gap" | "data-quality" | "platform-limitation",
      "xtalCanSolve": true | false,
      "estimatedImpact": "high" | "medium" | "low"
    }
  ],
  "outreachTags": ["array of 5-8 lowercase tags for CRM filtering, e.g. platform, vertical, key weaknesses"],
  "suggestedAngle": "<one sentence: the best outreach angle for this store based on their biggest pain point>",
  "verticalBenchmark": "<one sentence: how this store's search compares to typical stores in their vertical>"
}

Rules:
- One recommendation entry per dimension that scored below 70 (grade C or worse)
- "hot" lead = score below 50 AND platform is Shopify/BigCommerce (easy to switch search)
- "warm" = score 50-69 OR custom platform
- "cold" = score 70+ (they're already decent)
- xtalCanSolve should be true for typo_tolerance, synonym_handling, natural_language, long_tail, null_rate, result_relevance
- response_speed and category_intelligence issues are typically platform-side, so xtalCanSolve = false for those
- outreachTags should include: platform, vertical/industry, grade, and 3-5 specific weakness tags
- suggestedAngle should reference their specific data (store name, score, a concrete failing query)`
}

// ─── Process One Report ───────────────────────────────────────

async function tagReport(
  storeDir: string,
  model: string
): Promise<void> {
  const reportPath = path.join(storeDir, "report.json")
  if (!fs.existsSync(reportPath)) {
    console.log(`  Skipping ${path.basename(storeDir)} — no report.json`)
    return
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"))
  const storeName = report.storeName || path.basename(storeDir)

  console.log(`  Tagging ${storeName} (score: ${report.overallScore}, grade: ${report.overallGrade})...`)
  const startTime = Date.now()

  const prompt = buildTaggingPrompt(report)
  const rawResponse = await ollamaGenerate(model, prompt)

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonStr = rawResponse
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()

  let parsed: Omit<ReportTags, "storeUrl" | "storeName" | "taggedAt" | "model">
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    // Save raw response for debugging
    fs.writeFileSync(
      path.join(storeDir, "tags-raw-response.txt"),
      rawResponse
    )
    console.error(`  Failed to parse LLM response for ${storeName}. Raw saved to tags-raw-response.txt`)
    return
  }

  const tags: ReportTags = {
    storeUrl: report.storeUrl,
    storeName,
    taggedAt: new Date().toISOString(),
    model,
    ...parsed,
  }

  fs.writeFileSync(
    path.join(storeDir, "tags.json"),
    JSON.stringify(tags, null, 2)
  )

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`  Done (${duration}s) → ${tags.leadQuality.score} lead, ${tags.outreachTags.length} tags`)
}

// ─── CLI ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage:
  npx tsx scripts/tag-report.ts <store-slug>          Tag a single report
  npx tsx scripts/tag-report.ts --all                 Tag all reports
  npx tsx scripts/tag-report.ts <slug> --model <m>    Use a different Ollama model

Prerequisites:
  ollama pull llama3.1:8b

Examples:
  npx tsx scripts/tag-report.ts www.aligolden.com
  npx tsx scripts/tag-report.ts --all --model llama3.1:70b
`)
    process.exit(0)
  }

  // Parse --model flag
  const modelIdx = args.indexOf("--model")
  const model =
    modelIdx !== -1 && args[modelIdx + 1]
      ? args[modelIdx + 1]
      : DEFAULT_MODEL

  const isAll = args.includes("--all")

  console.log(`\nXTAL Report Tagger (Ollama / ${model})`)
  console.log("─".repeat(50))

  await checkOllama(model)

  if (isAll) {
    if (!fs.existsSync(OUTPUT_DIR)) {
      console.error("No grader-output directory found.")
      process.exit(1)
    }
    const dirs = fs
      .readdirSync(OUTPUT_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(OUTPUT_DIR, d.name))

    console.log(`Found ${dirs.length} report(s)\n`)

    for (const dir of dirs) {
      await tagReport(dir, model)
    }
  } else {
    const slug = args.find((a) => !a.startsWith("--"))
    if (!slug) {
      console.error("Please provide a store slug or --all")
      process.exit(1)
    }

    const storeDir = path.join(OUTPUT_DIR, slug)
    if (!fs.existsSync(storeDir)) {
      console.error(`Directory not found: ${storeDir}`)
      console.error(
        `Available: ${fs
          .readdirSync(OUTPUT_DIR)
          .filter((f) =>
            fs.statSync(path.join(OUTPUT_DIR, f)).isDirectory()
          )
          .join(", ")}`
      )
      process.exit(1)
    }

    await tagReport(storeDir, model)
  }

  console.log("\nDone.")
}

main()
