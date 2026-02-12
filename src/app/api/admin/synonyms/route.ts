import { NextResponse } from "next/server"
import { readFile, writeFile } from "fs/promises"
import path from "path"

const SYNONYMS_PATH = path.join(process.cwd(), "data", "synonyms.json")

export async function GET() {
  try {
    const raw = await readFile(SYNONYMS_PATH, "utf-8")
    const groups: string[][] = JSON.parse(raw)
    return NextResponse.json({ groups })
  } catch {
    // File missing or invalid — return empty
    return NextResponse.json({ groups: [] })
  }
}

export async function PUT(req: Request) {
  try {
    const { groups } = (await req.json()) as { groups: string[][] }

    if (!Array.isArray(groups) || !groups.every(g => Array.isArray(g) && g.every(v => typeof v === "string"))) {
      return NextResponse.json({ error: "Invalid format: expected string[][]" }, { status: 400 })
    }

    await writeFile(SYNONYMS_PATH, JSON.stringify(groups, null, 2) + "\n", "utf-8")
    return NextResponse.json({ ok: true, groups })
  } catch (err) {
    console.error("Failed to save synonyms:", err)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
