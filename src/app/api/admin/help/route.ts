import { NextResponse, type NextRequest } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { marked } from "marked"

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") ?? "client"

  let md = await readFile(
    join(process.cwd(), "content", "admin-guide.md"),
    "utf-8"
  )

  if (role !== "internal") {
    md = md.replace(
      /<!-- role:internal -->[\s\S]*?<!-- \/role:internal -->/g,
      ""
    )
  } else {
    md = md
      .replace(/<!-- role:internal -->/g, "")
      .replace(/<!-- \/role:internal -->/g, "")
  }

  const html = await marked(md)

  return NextResponse.json({ html })
}
