/**
 * scrape-site.mjs — Generic Playwright scraper for merchant websites
 *
 * Captures rendered HTML, CSS, and fonts for local sandbox SDK testing.
 * Output: public/sandbox/<slug>/ (gitignored)
 *
 * Usage:
 *   node scripts/scrape-site.mjs <home-url> --slug <name> --search <search-url> [--query <query>]
 *
 * Examples:
 *   # Willow (Angular hash route)
 *   node scripts/scrape-site.mjs https://www.willowgroupltd.com --slug willow \
 *     --search "https://www.willowgroupltd.com/#/search/{query}" --query baskets
 *
 *   # WooCommerce site
 *   node scripts/scrape-site.mjs https://example.com --slug example \
 *     --search "https://example.com/?s={query}" --query shoes
 */

import { chromium } from "playwright-core";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { homeUrl: null, slug: null, searchUrl: null, query: null, collection: null, searchSelector: null };

  // First positional arg is the home URL
  if (args.length === 0 || args[0].startsWith("--")) {
    printUsage();
    process.exit(1);
  }
  parsed.homeUrl = args[0];

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "--slug":
        parsed.slug = args[++i];
        break;
      case "--search":
        parsed.searchUrl = args[++i];
        break;
      case "--query":
        parsed.query = args[++i];
        break;
      case "--collection":
        parsed.collection = args[++i];
        break;
      case "--search-selector":
        parsed.searchSelector = args[++i];
        break;
      default:
        console.error(`Unknown arg: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  if (!parsed.slug) {
    console.error("Error: --slug is required\n");
    printUsage();
    process.exit(1);
  }

  if (!parsed.searchUrl) {
    console.error("Error: --search is required\n");
    printUsage();
    process.exit(1);
  }

  // Substitute {query} placeholder in search URL
  if (parsed.searchUrl && parsed.query) {
    parsed.searchUrl = parsed.searchUrl.replace(
      "{query}",
      encodeURIComponent(parsed.query)
    );
  }

  return parsed;
}

function printUsage() {
  console.log(`Usage: node scripts/scrape-site.mjs <home-url> --slug <name> --search <search-url> [--query <query>]

Arguments:
  <home-url>              Site home page URL (required)
  --slug <name>           Output folder name & SDK shop-id (required)
  --search <search-url>   Search page URL (required). Use {query} as placeholder
  --query <query>         Search query, replaces {query} in --search URL
  --collection <id>       Backend collection ID for SDK (defaults to slug)
  --search-selector <css> CSS selector for the search input element

Examples:
  node scripts/scrape-site.mjs https://www.willowgroupltd.com --slug willow \\
    --search "https://www.willowgroupltd.com/#/search/{query}" --query baskets

  node scripts/scrape-site.mjs https://example.com --slug example \\
    --search "https://example.com/?s={query}" --query shoes`);
}

// ---------------------------------------------------------------------------
// Browser discovery
// ---------------------------------------------------------------------------

function findBrowser() {
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.CHROME_PATH,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `No Chromium browser found. Tried:\n${candidates.join("\n")}\nSet CHROME_PATH env to your browser executable.`
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Search selector auto-detection
// ---------------------------------------------------------------------------

async function detectSearchSelector(page) {
  return page.evaluate(() => {
    const strategies = [
      // 1. Input inside form[role="search"] with an id
      () => {
        const input = document.querySelector(
          'form[role="search"] input[type="text"], form[role="search"] input[type="search"]'
        );
        if (input?.id) return `#${input.id}`;
        return null;
      },
      // 2. Any input with id containing "search"
      () => {
        const input = document.querySelector('input[id*="search" i]');
        if (input) return `#${input.id}`;
        return null;
      },
      // 3. input[type="search"]
      () => {
        const input = document.querySelector('input[type="search"]');
        if (input) {
          if (input.id) return `#${input.id}`;
          if (input.name) return `input[name="${input.name}"]`;
          return 'input[type="search"]';
        }
        return null;
      },
      // 4. Input with name containing "search"
      () => {
        const input = document.querySelector('input[name*="search" i]');
        if (input) {
          if (input.id) return `#${input.id}`;
          return `input[name="${input.name}"]`;
        }
        return null;
      },
      // 5. Input with aria-label containing "search"
      () => {
        const input = document.querySelector('input[aria-label*="search" i]');
        if (input) {
          if (input.id) return `#${input.id}`;
          return `input[aria-label="${input.getAttribute("aria-label")}"]`;
        }
        return null;
      },
      // 6. Input with placeholder containing "search"
      () => {
        const input = document.querySelector('input[placeholder*="search" i]');
        if (input) {
          if (input.id) return `#${input.id}`;
          const ph = input.getAttribute("placeholder");
          return `input[placeholder*="${ph.split(" ").slice(0, 3).join(" ")}"]`;
        }
        return null;
      },
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result) return result;
    }
    return null;
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { homeUrl, slug, searchUrl, query, collection, searchSelector } = parseArgs();
  const OUTPUT_DIR = path.resolve(__dirname, `../public/sandbox/${slug}`);

  console.log("==============================================");
  console.log(`  Site Scraper — XTAL Visual QA`);
  console.log("==============================================\n");
  log(`Slug:       ${slug}`);
  log(`Home URL:   ${homeUrl}`);
  log(`Search URL: ${searchUrl}`);
  if (query) log(`Query:      ${query}`);
  log(`Output dir: ${OUTPUT_DIR}`);

  // Create output directories
  ensureDir(path.join(OUTPUT_DIR, "css"));
  ensureDir(path.join(OUTPUT_DIR, "fonts"));

  const browserPath = findBrowser();
  log(`Using browser: ${browserPath}`);

  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
    args: [
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const interceptedCss = [];
  const interceptedFonts = [];

  // Scrape a page: intercept assets, capture rendered HTML
  async function scrapePage(url, outputName) {
    log(`\n--- Scraping ${outputName}: ${url} ---`);

    const page = await context.newPage();
    const pageCss = [];
    const pageFonts = [];

    // Intercept CSS and font responses
    page.on("response", async (response) => {
      const resUrl = response.url();
      const contentType = response.headers()["content-type"] || "";

      // Intercept CSS
      if (contentType.includes("text/css") || resUrl.match(/\.css(\?|$)/)) {
        try {
          const body = await response.text();
          const idx = interceptedCss.length;
          const filename = `style-${idx}.css`;
          interceptedCss.push({ url: resUrl, filename, body });
          pageCss.push({ url: resUrl, filename });
          log(`  CSS: ${resUrl.substring(0, 80)}...`);
        } catch {
          log(`  CSS (failed to read): ${resUrl.substring(0, 80)}`);
        }
      }

      // Intercept fonts
      if (resUrl.match(/\.(woff2?|ttf|eot|otf)(\?|$)/)) {
        try {
          const body = await response.body();
          const ext = resUrl.match(/\.(woff2?|ttf|eot|otf)/)[0];
          const idx = interceptedFonts.length;
          const filename = `font-${idx}${ext}`;
          interceptedFonts.push({ url: resUrl, filename, body });
          pageFonts.push({ url: resUrl, filename });
          log(`  Font: ${resUrl.substring(0, 80)}...`);
        } catch {
          // CORS may block CDN font downloads
          log(`  Font (CORS blocked): ${resUrl.substring(0, 80)}`);
        }
      }
    });

    // Navigate
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for network idle (with timeout catch for SPA polling)
    try {
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    } catch {
      log("  Network idle timeout (expected for SPA sites)");
    }

    // Extra delay for SPA rendering
    await page.waitForTimeout(3000);

    // For search page, wait for product-like elements
    if (outputName === "search") {
      try {
        await page.waitForSelector(
          '[class*="product"], [class*="item"], [class*="card"], [class*="result"]',
          { timeout: 10000 }
        );
        log("  Product elements detected");
      } catch {
        log("  No product elements found within timeout (non-fatal)");
      }
    }

    // Auto-detect search input selector on home or search pages
    let detectedSelector = null;
    if (outputName === "home" || outputName === "search") {
      detectedSelector = await detectSearchSelector(page);
      if (detectedSelector) {
        log(`  Search selector detected: ${detectedSelector}`);
      }
    }

    // Try extracting computed styles as fallback for dynamic CSS
    const dynamicStyles = await page.evaluate(() => {
      const styles = [];
      for (const sheet of document.styleSheets) {
        try {
          if (!sheet.href || sheet.href.startsWith(window.location.origin)) {
            const rules = Array.from(sheet.cssRules || []);
            const css = rules.map((r) => r.cssText).join("\n");
            if (css.length > 0) {
              styles.push(css);
            }
          }
        } catch {
          // CORS blocks cross-origin stylesheet reading
        }
      }
      return styles;
    });

    // Save dynamic/inline styles
    if (dynamicStyles.length > 0) {
      const dynamicCss = dynamicStyles.join(
        "\n\n/* --- next inline sheet --- */\n\n"
      );
      const dynamicFilename = `dynamic-${outputName}.css`;
      fs.writeFileSync(
        path.join(OUTPUT_DIR, "css", dynamicFilename),
        dynamicCss,
        "utf-8"
      );
      pageCss.push({ url: "(inline)", filename: dynamicFilename });
      log(`  Extracted ${dynamicStyles.length} inline/dynamic stylesheet(s)`);
    }

    // Get rendered HTML
    let html = await page.content();

    // Strip <script> tags
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

    // Rewrite CSS URLs to local paths
    for (const css of pageCss) {
      if (css.url !== "(inline)") {
        const escaped = css.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        html = html.replace(
          new RegExp(`href=["']${escaped}["']`, "g"),
          `href="/sandbox/${slug}/css/${css.filename}"`
        );
      }
    }

    // Add link tags for dynamic styles
    for (const css of pageCss) {
      if (css.url === "(inline)") {
        html = html.replace(
          "</head>",
          `<link rel="stylesheet" href="/sandbox/${slug}/css/${css.filename}">\n</head>`
        );
      }
    }

    // Rewrite font URLs in captured CSS files
    for (const font of pageFonts) {
      for (const css of interceptedCss) {
        if (css.body.includes(font.url)) {
          css.body = css.body.replace(
            new RegExp(
              font.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "g"
            ),
            `/sandbox/${slug}/fonts/${font.filename}`
          );
        }
      }
    }

    // Save HTML
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${outputName}.html`),
      html,
      "utf-8"
    );
    log(`  Saved ${outputName}.html (${(html.length / 1024).toFixed(1)} KB)`);

    // Screenshot
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${outputName}-screenshot.png`),
      fullPage: true,
    });
    log(`  Screenshot saved: ${outputName}-screenshot.png`);

    await page.close();
    return { pageCss, pageFonts, detectedSelector };
  }

  try {
    // Scrape home page
    const homeResult = await scrapePage(homeUrl, "home");

    // Scrape search page
    const searchResult = await scrapePage(searchUrl, "search");

    // Use first detected selector (home page preferred, search as fallback)
    const detectedSelector =
      homeResult.detectedSelector || searchResult.detectedSelector || null;

    // Write all intercepted CSS files
    for (const css of interceptedCss) {
      fs.writeFileSync(
        path.join(OUTPUT_DIR, "css", css.filename),
        css.body,
        "utf-8"
      );
    }
    log(`\nSaved ${interceptedCss.length} CSS file(s)`);

    // Write all intercepted font files
    for (const font of interceptedFonts) {
      fs.writeFileSync(path.join(OUTPUT_DIR, "fonts", font.filename), font.body);
    }
    log(`Saved ${interceptedFonts.length} font file(s)`);

    // Write manifest.json for API route (slug → collection mapping)
    // Explicit --search-selector wins, then auto-detected, then omitted
    const resolvedSelector = searchSelector || detectedSelector;
    const manifest = {
      collection: collection || slug,
      sourceUrl: homeUrl,
      searchUrl,
    };
    if (resolvedSelector) {
      manifest.searchSelector = resolvedSelector;
      if (!searchSelector && detectedSelector) {
        log(`Using auto-detected search selector: ${detectedSelector}`);
      }
    } else {
      console.warn(
        "\n\u26a0  WARNING: No search input selector detected!"
      );
      console.warn(
        "   The SDK snippet will not work without a searchSelector."
      );
      console.warn(
        "   Re-run with --search-selector '<css>' or verify the site has a search input.\n"
      );
    }
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf-8"
    );
    log("Saved manifest.json");

    // Summary
    console.log("\n==============================================");
    console.log("  Scrape Complete");
    console.log("==============================================");
    console.log(`  Slug:       ${slug}`);
    console.log(`  Output:     ${OUTPUT_DIR}`);
    console.log(`  HTML files: home.html, search.html`);
    console.log(`  CSS files:  ${interceptedCss.length}`);
    console.log(`  Fonts:      ${interceptedFonts.length}`);
    console.log(
      `\n  Next: npm run dev → http://localhost:3000/sandbox/site-clone/${slug}`
    );
    console.log("==============================================\n");
  } finally {
    await context.close();
    await browser.close();
    log("Browser closed");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
