import { NextResponse } from "next/server"
import { detectStore, buildStoreInfo } from "@/lib/grader/platform"
import { analyzeStore } from "@/lib/grader/llm"
import { createRun, updateRun, checkRateLimit } from "@/lib/grader/logger"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = body as { url: string }

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL to prevent SSRF
    let parsedUrl: URL
    try {
      const normalized = url.startsWith("http") ? url : `https://${url}`
      parsedUrl = new URL(normalized)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Block private IPs, localhost, and cloud metadata
    const hostname = parsedUrl.hostname.toLowerCase()
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.startsWith("192.168.") ||
      hostname === "169.254.169.254" ||
      hostname.endsWith(".internal") ||
      parsedUrl.protocol === "file:"
    ) {
      return NextResponse.json({ error: "Invalid store URL" }, { status: 400 })
    }

    // Determine source from internal header (not request body)
    const internalSource = request.headers.get("x-grader-source")
    const source: "web" | "batch" | "admin" =
      internalSource === "batch" || internalSource === "admin" ? internalSource : "web"

    // Rate limiting (only for public web requests)
    if (source === "web") {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
      const rateCheck = await checkRateLimit(ip)
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: "Rate limited. Try again in an hour.", remaining: rateCheck.remaining },
          { status: 429 }
        )
      }
    }

    // Create run log
    const run = await createRun(url, source)

    // Step 1: Detect platform
    const detection = await detectStore(url)

    // Step 2: LLM analysis
    const analysis = await analyzeStore({
      storeUrl: url,
      platform: detection.platform,
      storeName: detection.name,
      productSamples: detection.productSamples,
    })

    // Build store info
    const storeInfo = buildStoreInfo(url, detection, {
      storeType: analysis.storeType,
      vertical: analysis.vertical,
    })

    // Update run log with analyze step
    run.storeName = storeInfo.name
    run.platform = storeInfo.platform
    run.steps.analyze = {
      input: {
        url,
        homepageHtmlPreview: "(fetched during detection)",
        productSamples: detection.productSamples,
      },
      promptUsed: analysis.promptUsed,
      rawResponse: analysis.rawResponse,
      parsed: {
        platform: storeInfo.platform,
        storeType: analysis.storeType,
        vertical: analysis.vertical,
        queries: analysis.queries,
      },
      duration: 0, // filled by client timing
    }
    await updateRun(run)

    return NextResponse.json({
      runId: run.id,
      platform: storeInfo.platform,
      storeName: storeInfo.name,
      storeType: analysis.storeType,
      vertical: analysis.vertical,
      searchUrl: storeInfo.searchUrl,
      queries: analysis.queries,
      productSamples: detection.productSamples,
    })
  } catch (error) {
    console.error("Grader analyze error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    )
  }
}
