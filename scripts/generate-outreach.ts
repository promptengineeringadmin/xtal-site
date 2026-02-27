/**
 * Outreach Generator — Draft personalized cold emails from teardown results
 *
 * For each vendor with a completed teardown:
 *   1. Load teardown report for stats
 *   2. Load CSV contacts filtered to that vendor (Real=y or Good=y)
 *   3. Claude drafts personalized email per contact
 *   4. Output per-vendor JSON + Apollo-importable CSV
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
 *
 *   npx tsx scripts/generate-outreach.ts                    # all vendors with teardowns
 *   npx tsx scripts/generate-outreach.ts --vendor sixpenny  # single vendor
 *   npx tsx scripts/generate-outreach.ts --dry-run          # preview without Claude calls
 */

import * as fs from "fs"
import * as path from "path"
import Anthropic from "@anthropic-ai/sdk"
import type { TeardownReport } from "./teardown/types"
import type { ProbeResult } from "./teardown/types"

// ── Types ────────────────────────────────────────────────────

interface CsvContact {
  vendor: string
  name: string
  title: string
  linkedin: string
  real: boolean
  good: boolean
  hook: string
}

interface OutreachEmail {
  contactName: string
  contactTitle: string
  linkedin: string
  company: string
  subject: string
  body: string
  teardownLink: string
}

interface OutreachPackage {
  vendor: string
  slug: string
  date: string
  stats: {
    totalQueries: number
    merchantAvgResults: number
    xtalAvgResults: number
    merchantAvgTime: number
    xtalAvgTime: number
  }
  emails: OutreachEmail[]
}

// ── Logging ──────────────────────────────────────────────────

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

// ── CSV parsing ──────────────────────────────────────────────

function parseContacts(csvPath: string): CsvContact[] {
  const content = fs.readFileSync(csvPath, "utf-8")
  const lines = content.split("\n")
  const contacts: CsvContact[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Handle quoted fields (hook may contain commas)
    const cols: string[] = []
    let current = ""
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
    cols.push(current.trim())

    const vendor = (cols[2] || "").trim()
    const name = (cols[5] || "").trim()
    const linkedin = (cols[7] || "").trim()
    const realStr = (cols[8] || "").trim().toLowerCase()
    const goodStr = (cols[9] || "").trim().toLowerCase()
    const hook = (cols[10] || "").trim()

    if (!vendor || !name) continue

    // Extract just the name (strip title in parens)
    const nameOnly = name.replace(/\s*\(.*?\)\s*/g, "").trim()
    // Extract title from parens
    const titleMatch = name.match(/\(([^)]+)\)/)
    const title = titleMatch ? titleMatch[1].replace(/\[\d+\]/g, "").trim() : ""

    // Clean LinkedIn URL
    const cleanLinkedin = linkedin.replace(/\[\d+\]/g, "").trim()

    contacts.push({
      vendor,
      name: nameOnly.replace(/\[\d+\]/g, "").trim(),
      title,
      linkedin: cleanLinkedin,
      real: realStr === "y" || realStr === "yes",
      good: goodStr === "y" || goodStr === "yes",
      hook,
    })
  }

  return contacts
}

// ── Find latest teardown report for a vendor ─────────────────

function findLatestReport(slug: string): TeardownReport | null {
  const baseDir = path.join(process.cwd(), "teardown-output", slug)
  if (!fs.existsSync(baseDir)) return null

  // Find latest date directory
  const dates = fs
    .readdirSync(baseDir)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse()

  for (const date of dates) {
    const reportPath = path.join(baseDir, date, "report.json")
    if (fs.existsSync(reportPath)) {
      return JSON.parse(fs.readFileSync(reportPath, "utf-8"))
    }
  }

  return null
}

// ── Draft email with Claude ──────────────────────────────────

async function draftEmail(
  client: Anthropic,
  contact: CsvContact,
  report: TeardownReport,
  slug: string,
): Promise<{ subject: string; body: string }> {
  const statsBlock = [
    `Merchant: ${report.merchantName}`,
    `Queries tested: ${report.summary.totalQueries}`,
    `${report.merchantName} avg results: ${report.summary.merchantAvgResults.toFixed(0)}`,
    `XTAL avg results: ${report.summary.xtalAvgResults.toFixed(0)}`,
    `${report.merchantName} avg response: ${Math.round(report.summary.merchantAvgTime)}ms`,
    `XTAL avg response: ${Math.round(report.summary.xtalAvgTime)}ms`,
  ].join("\n")

  const prompt = `Draft a cold outreach email for XTAL Search (AI-powered site search for e-commerce).

RECIPIENT:
- Name: ${contact.name}
- Title: ${contact.title}
- Company: ${report.merchantName}
- LinkedIn: ${contact.linkedin}

UNIQUE HOOK (from research):
${contact.hook}

TEARDOWN STATS:
${statsBlock}

REQUIREMENTS:
- Subject line: short (under 60 chars), curiosity-driven, references their brand name. No clickbait.
- Opening: weave the unique hook naturally — don't copy-paste it, riff on the insight
- Body: mention 1-2 specific teardown findings (e.g. "your site returned 0 results for 'cozy throw blankets under $100' while our AI found 12 relevant matches")
- Include a specific stat from the teardown (response time, result count difference)
- CTA: "I put together a teardown of ${report.merchantName}'s search — happy to share if you're curious"
- Tone: direct, peer-to-peer, no sycophantic language ("hope you're well", "I'd love to"), no buzzwords
- Length: 4-6 sentences max
- Sign off: "— Rud, XTAL Search"
- Do NOT use emojis

Output ONLY valid JSON: { "subject": "...", "body": "..." }
No markdown, no explanation, just the JSON.`

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  })

  const text =
    response.content[0].type === "text" ? response.content[0].text : ""

  try {
    // Parse JSON from response (handle potential markdown wrapping)
    const jsonStr = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "")
    return JSON.parse(jsonStr)
  } catch {
    log(`    Warning: Could not parse Claude response as JSON, using raw text`)
    return {
      subject: `${report.merchantName} search teardown`,
      body: text,
    }
  }
}

// ── Apollo CSV export ────────────────────────────────────────

function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

function writeApolloCsv(
  packages: OutreachPackage[],
  outPath: string,
): void {
  const headers = [
    "First Name",
    "Last Name",
    "Title",
    "Company",
    "LinkedIn URL",
    "Email Subject",
    "Email Body",
    "Teardown Link",
  ]

  const rows = [headers.join(",")]

  for (const pkg of packages) {
    for (const email of pkg.emails) {
      const nameParts = email.contactName.split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      rows.push(
        [
          escapeCsvField(firstName),
          escapeCsvField(lastName),
          escapeCsvField(email.contactTitle),
          escapeCsvField(email.company),
          escapeCsvField(email.linkedin),
          escapeCsvField(email.subject),
          escapeCsvField(email.body),
          escapeCsvField(email.teardownLink),
        ].join(","),
      )
    }
  }

  fs.writeFileSync(outPath, rows.join("\n"))
}

// ── Slugify ──────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// ── CLI ──────────────────────────────────────────────────────

interface CliArgs {
  vendorFilter?: string
  dryRun: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: CliArgs = { dryRun: false }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--vendor") {
      parsed.vendorFilter = args[++i]
    } else if (args[i] === "--dry-run") {
      parsed.dryRun = true
    }
  }

  return parsed
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const args = parseArgs()

  if (!args.dryRun && !process.env.ANTHROPIC_API_KEY) {
    console.error("Missing env var: ANTHROPIC_API_KEY")
    console.error("Use --dry-run to preview without Claude calls")
    process.exit(1)
  }

  // Load CSV contacts
  const csvPath = path.join(
    process.cwd(),
    "Shopify Leads List - specific contacts.csv",
  )
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const allContacts = parseContacts(csvPath)
  log(`Loaded ${allContacts.length} contacts from CSV`)

  // Load probe results for slug mapping
  const probePath = path.join(
    process.cwd(),
    "data",
    "prospect-probe-results.json",
  )
  const probeResults: ProbeResult[] = fs.existsSync(probePath)
    ? JSON.parse(fs.readFileSync(probePath, "utf-8"))
    : []

  // Build vendor → slug map
  const vendorSlugMap = new Map<string, string>()
  for (const p of probeResults) {
    vendorSlugMap.set(p.name.toLowerCase(), p.slug)
  }

  // Find vendors with completed teardowns
  const teardownDir = path.join(process.cwd(), "teardown-output")
  let vendorSlugs: string[]

  if (args.vendorFilter) {
    vendorSlugs = [args.vendorFilter]
  } else if (fs.existsSync(teardownDir)) {
    vendorSlugs = fs
      .readdirSync(teardownDir)
      .filter((d) => {
        const reportExists = findLatestReport(d) !== null
        return reportExists
      })
  } else {
    console.error("No teardown output directory found")
    process.exit(1)
  }

  log(`Found ${vendorSlugs.length} vendor(s) with teardown reports`)

  const client = args.dryRun ? null : new Anthropic()
  const packages: OutreachPackage[] = []
  const outreachDir = path.join(process.cwd(), "outreach")
  fs.mkdirSync(outreachDir, { recursive: true })

  for (const slug of vendorSlugs) {
    const report = findLatestReport(slug)
    if (!report) {
      log(`  Skipping ${slug}: no teardown report found`)
      continue
    }

    // Find matching contacts (Real=y or Good=y)
    const vendorName = report.merchantName
    const vendorContacts = allContacts.filter(
      (c) =>
        (slugify(c.vendor) === slug ||
          c.vendor.toLowerCase() === vendorName.toLowerCase()) &&
        (c.real || c.good),
    )

    if (vendorContacts.length === 0) {
      log(`  Skipping ${slug}: no qualified contacts (Real=y or Good=y)`)
      continue
    }

    log(
      `\n  ${vendorName}: ${vendorContacts.length} qualified contacts, drafting emails...`,
    )

    const emails: OutreachEmail[] = []
    const teardownLink = `teardown-output/${slug}/${report.date}/teardown-${slug}-${report.date}.pdf`

    for (let i = 0; i < vendorContacts.length; i++) {
      const contact = vendorContacts[i]
      log(`    [${i + 1}/${vendorContacts.length}] ${contact.name} (${contact.title})`)

      let subject: string
      let body: string

      if (args.dryRun || !client) {
        subject = `${vendorName} search teardown`
        body = `[DRY RUN] Hook: ${contact.hook}`
      } else {
        const draft = await draftEmail(client, contact, report, slug)
        subject = draft.subject
        body = draft.body

        // Brief pause between API calls
        if (i < vendorContacts.length - 1) {
          await new Promise((r) => setTimeout(r, 1000))
        }
      }

      emails.push({
        contactName: contact.name,
        contactTitle: contact.title,
        linkedin: contact.linkedin,
        company: vendorName,
        subject,
        body,
        teardownLink,
      })
    }

    const pkg: OutreachPackage = {
      vendor: vendorName,
      slug,
      date: report.date,
      stats: report.summary,
      emails,
    }
    packages.push(pkg)

    // Save per-vendor package
    const vendorOutDir = path.join(outreachDir, slug)
    fs.mkdirSync(vendorOutDir, { recursive: true })
    fs.writeFileSync(
      path.join(vendorOutDir, "outreach-package.json"),
      JSON.stringify(pkg, null, 2),
    )
    log(`  Saved: outreach/${slug}/outreach-package.json`)
  }

  // Write Apollo CSV
  if (packages.length > 0) {
    const apolloPath = path.join(outreachDir, "apollo-import.csv")
    writeApolloCsv(packages, apolloPath)
    log(`\n  Apollo CSV: ${apolloPath}`)
  }

  // ── Summary ──
  const totalEmails = packages.reduce((s, p) => s + p.emails.length, 0)
  log("")
  log("═══════════════════════════════════════════")
  log(`  Outreach generation complete`)
  log(`  Vendors: ${packages.length}`)
  log(`  Total emails drafted: ${totalEmails}`)
  log(`  Output: ${outreachDir}/`)
  log("═══════════════════════════════════════════")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
