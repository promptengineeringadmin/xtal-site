import * as fs from "fs";
import * as path from "path";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Sanitize slug to prevent path traversal
  const safeSlug = slug.replace(/[^a-z0-9_-]/gi, "");
  if (!safeSlug) {
    return new Response("Invalid slug", { status: 400 });
  }

  const baseDir = path.join(process.cwd(), "public", "sandbox", safeSlug);

  // Query params for testing
  const xtalParam = _req.nextUrl.searchParams.get("xtal");
  const autoQuery = _req.nextUrl.searchParams.get("q");
  const pageParam = _req.nextUrl.searchParams.get("page");

  // Page selection — ?page=home forces homepage, default tries search.html
  let htmlPath: string;
  let pageName: string;
  if (pageParam === "home") {
    htmlPath = path.join(baseDir, "home.html");
    pageName = "home";
  } else {
    htmlPath = path.join(baseDir, "search.html");
    pageName = "search";
    if (!fs.existsSync(htmlPath)) {
      htmlPath = path.join(baseDir, "home.html");
      pageName = "home";
    }
  }

  // If neither exists, return helpful 404
  if (!fs.existsSync(htmlPath)) {
    const body = `<!DOCTYPE html>
<html>
<head><title>Site Clone Not Found</title></head>
<body style="font-family:system-ui;max-width:600px;margin:80px auto;padding:0 20px">
  <h1>Site Clone "${safeSlug}" Not Found</h1>
  <p>No scraped site found for <code>${safeSlug}</code>. Run the scraper first:</p>
  <pre style="background:#1e1e2e;color:#cdd6f4;padding:16px;border-radius:8px;overflow-x:auto">node scripts/scrape-site.mjs &lt;url&gt; --slug ${safeSlug} [--search &lt;search-url&gt;]</pre>
  <p>Then reload this page.</p>
  <p><a href="/sandbox/storefront">&larr; Back to Sandbox</a></p>
</body>
</html>`;
    return new Response(body, {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN",
        "Cache-Control": "no-store",
      },
    });
  }

  let html = fs.readFileSync(htmlPath, "utf-8");

  // Read manifest for collection mapping (slug → backend collection)
  let manifest: { collection?: string } | null = null;
  const manifestPath = path.join(baseDir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    } catch {
      // Invalid manifest — fall through to slug default
    }
  }
  const shopId = manifest?.collection || safeSlug;

  // Inject XTAL SDK before </head> — skip if ?xtal=off
  if (xtalParam !== "off") {
    const sdkTag = `<script src="/client/v1/xtal.js" data-shop-id="${shopId}" async></script>`;
    html = html.replace("</head>", `${sdkTag}\n</head>`);
  }

  // Pre-fill search input if ?q= present
  if (autoQuery) {
    const escaped = autoQuery.replace(/"/g, "&quot;");
    html = html.replace(
      /(<input[^>]*id="search_field"[^>]*?)(\/?>)/,
      `$1 value="${escaped}" $2`
    );
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "no-store",
    },
  });
}
