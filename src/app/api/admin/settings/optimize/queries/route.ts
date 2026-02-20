import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

let anthropic: Anthropic | null = null
function getClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return anthropic
}

const MODEL = "claude-sonnet-4-6"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { collection, store_type, cold_start } = await request.json()
    const backendUrl = process.env.XTAL_BACKEND_URL

    // Fetch sample products for grounding
    let sampleTitles: string[] = []
    if (!cold_start && backendUrl) {
      try {
        const sampleRes = await fetch(`${backendUrl}/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "", collection, limit: 20 }),
          signal: AbortSignal.timeout(10_000),
        })
        if (sampleRes.ok) {
          const data = await sampleRes.json()
          sampleTitles = (data.results || [])
            .slice(0, 10)
            .map(
              (r: { title?: string; product_type?: string }) =>
                `${r.title || "Unknown"} (${r.product_type || "uncategorized"})`,
            )
        }
      } catch {
        // Proceed without samples
      }
    }

    const samplesBlock =
      sampleTitles.length > 0
        ? `\nHere are some sample products from this store:\n${sampleTitles.join("\n")}`
        : ""

    const storeType = store_type || "online retailer"

    const prompt = `You are a search quality evaluator for a ${storeType}.
${samplesBlock}

Design a realistic shopper persona for this store. Give them a name, a brief context, and a shopping goal.

Then have this persona conduct a thorough shopping session. Generate 20 search queries they might type, covering these styles:

1. **Keyword** (3-4): Simple product/category names
   e.g. "pinot noir", "bluetooth speaker"

2. **Specific/cluster** (3-4): Narrowed with attributes or constraints
   e.g. "french red wine under 30", "wireless headphones noise cancelling"

3. **Natural language** (4-5): How real people describe what they want
   e.g. "something nice to bring to a dinner party", "gift for someone who loves cooking"

4. **Discovery/vibes** (3-4): Mood-based, exploratory
   e.g. "cozy evening", "summer garden party"

5. **Problem-solving** (3-4): Need-based queries
   e.g. "best wine to pair with steak", "what to wear to an outdoor wedding"

Return ONLY a JSON object:
{
  "persona": { "name": "...", "context": "..." },
  "queries": [
    { "query": "...", "type": "keyword|cluster|natural_language|vibes|problem_solving" }
  ]
}`

    const client = getClient()
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    const text =
      message.content[0].type === "text" ? message.content[0].text : "{}"
    const jsonStr = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    const parsed = JSON.parse(jsonStr) as {
      persona: { name: string; context: string }
      queries: { query: string; type: string }[]
    }

    return NextResponse.json({
      persona: parsed.persona,
      queries: parsed.queries.slice(0, 20),
    })
  } catch (error) {
    console.error("Query generation error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate queries",
      },
      { status: 500 },
    )
  }
}
