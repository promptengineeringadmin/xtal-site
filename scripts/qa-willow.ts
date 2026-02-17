/**
 * qa-willow.ts - Comprehensive Playwright QA script for the /willow demo
 *
 * Tests search functionality, filters, and content integrity on production.
 * Run with: npx tsx scripts/qa-willow.ts
 */

import { chromium, type Browser, type Page, type ConsoleMessage } from "playwright-core";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = "https://www.xtalsearch.com/willow";
const VIEWPORT = { width: 1280, height: 800 };
const OUTPUT_DIR = path.resolve(__dirname, "qa-output");
const REPORT_PATH = path.join(OUTPUT_DIR, "qa-report.json");
const INTER_SEARCH_DELAY_MS = 2000;
const RESULTS_TIMEOUT_MS = 30000;
const FILTER_TIMEOUT_MS = 15000;

const QUERIES = [
  "wire shelf with burlap",
  "oval tin planter",
  "rectangular wood tray",
  "gift basket packaging supplies",
  "shredded fill white",
  "spring planters for retail display",
  "seagrass baskets",
  "fall harvest decorations",
  "christmas packaging",
  "gifts for someone who loves gardening",
  "hosting a dinner party this weekend",
  "bulk planters for retail store",
  "wholesale display shelving",
  "fireplace accessories and decor",
  "rustic farmhouse decor",
  "elegant gift presentation",
  "planters under $50",
  "premium display pieces over $200",
  "new arrivals",
  "cozy gift for someone who is always cold",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductInfo {
  title: string;
  price: string;
  vendor: string;
  hasImage: boolean;
  imageUrl: string;
}

interface SearchResult {
  query: string;
  responseTimeMs: number;
  resultCount: number;
  products: ProductInfo[];
  aspects: string[];
  facets: Record<string, string[]>;
  consoleErrors: string[];
  issues: string[];
  screenshotFile: string;
}

interface FilterTestResult {
  action: string;
  resultCountBefore: number;
  resultCountAfter: number;
  passed: boolean;
  screenshotFile: string;
}

interface ContentCapture {
  defaultSuggestions: string[];
  allProductTitles: string[];
  allFacetValues: Record<string, string[]>;
  brokenImages: string[];
  zeroPrices: string[];
  rawSkuTitles: string[];
}

interface QAReport {
  timestamp: string;
  url: string;
  browserPath: string;
  searches: SearchResult[];
  filterTests: FilterTestResult[];
  contentCapture: ContentCapture;
  summary: {
    totalSearches: number;
    successfulSearches: number;
    failedSearches: number;
    averageResponseTimeMs: number;
    totalIssues: number;
    p0Issues: number;
    p1Issues: number;
  };
}

// ---------------------------------------------------------------------------
// Browser discovery
// ---------------------------------------------------------------------------

function findBrowser(): string {
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.CHROME_PATH,
    // Fallback: Edge (Chromium-based)
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  throw new Error(
    `No Chromium browser found. Tried:\n${candidates.join("\n")}\nSet CHROME_PATH env to your browser executable.`
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

/** Wait for the network to be mostly quiet (no inflight requests for 500ms) */
async function waitForNetworkIdle(page: Page, timeout = 10000) {
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch {
    // Not fatal - some pages keep polling
  }
}

/** Extract the result count from the info bar: "N results for ..." */
async function getResultCount(page: Page): Promise<number> {
  try {
    const count = await page.evaluate(() => {
      // Find the result count span: "N results for ..."
      const spans = Array.from(document.querySelectorAll("span.font-medium"));
      for (const span of spans) {
        const text = span.textContent ?? "";
        const match = text.match(/^(\d+)\s+results?\s/);
        if (match) return parseInt(match[1], 10);
      }
      return 0;
    });
    return count;
  } catch {
    return 0;
  }
}

/** Wait for search results or the "no results" message to appear */
async function waitForResults(page: Page) {
  // Poll until we see product cards, "No results", or an error
  const deadline = Date.now() + RESULTS_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const found = await page.evaluate(() => {
      // Product cards: h3 inside a grid child (the product title)
      if (document.querySelectorAll(".grid h3").length > 0) return "results";
      // "No results found" message
      if (document.body.textContent?.includes("No results found")) return "empty";
      // Error banner
      if (document.querySelector(".bg-red-50")) return "error";
      return null;
    });
    if (found) break;
    await sleep(300);
  }
  // Allow the result count text to render
  await sleep(500);
}

/** Extract product info from the visible product cards */
async function extractProducts(page: Page, limit = 5): Promise<ProductInfo[]> {
  return page.evaluate((lim) => {
    // Product cards are the direct children of the .grid container that have h3 titles
    const grids = document.querySelectorAll(".grid");
    let cards: Element[] = [];
    for (const grid of Array.from(grids)) {
      const children = Array.from(grid.children).filter(
        (child) => child.querySelector("h3") !== null
      );
      if (children.length > 0) {
        cards = children;
        break;
      }
    }

    return cards.slice(0, lim).map((card) => {
      const titleEl = card.querySelector("h3");
      const priceEl = card.querySelector("p.font-semibold");
      const vendorEl = card.querySelector("span.uppercase");
      const imgEl = card.querySelector("img") as HTMLImageElement | null;

      return {
        title: titleEl?.textContent?.trim() ?? "",
        price: priceEl?.textContent?.trim() ?? "",
        vendor: vendorEl?.textContent?.trim() ?? "",
        hasImage: imgEl ? imgEl.naturalWidth > 0 : false,
        imageUrl: imgEl?.src ?? "",
      };
    });
  }, limit);
}

/** Extract aspect chip texts */
async function extractAspects(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    // Aspect chips are buttons inside a flex-wrap container directly after the search bar
    // They have the distinctive xtal-navy border styling
    const chips = Array.from(
      document.querySelectorAll("button.rounded-full.border")
    ).filter((btn) => {
      const classes = btn.className;
      // Aspect chips have xtal-navy text or bg
      return (
        classes.includes("xtal-navy") &&
        !classes.includes("bg-xtal-navy/10") && // not applied-filter chips
        !btn.closest("aside") // not inside filter rail
      );
    });

    return chips.map((chip) => {
      // Remove the trailing +/- symbol span content
      const text = chip.textContent?.trim() ?? "";
      return text.replace(/\s*[+\u2212]\s*$/, "").trim();
    });
  });
}

/** Extract facet sections and their values from the filter rail */
async function extractFacets(page: Page): Promise<Record<string, string[]>> {
  return page.evaluate(() => {
    const facets: Record<string, string[]> = {};
    // The filter rail is an <aside> element
    const aside = document.querySelector("aside");
    if (!aside) return facets;

    // Each facet section is a div with border-b
    const sections = aside.querySelectorAll("div.border-b");
    sections.forEach((section) => {
      const header = section.querySelector("span.text-sm.font-medium");
      if (!header) return;
      const sectionName = header.textContent?.trim() ?? "";
      // Skip "Price" section
      if (sectionName === "Price") return;

      const labels = section.querySelectorAll("label");
      const values: string[] = [];
      labels.forEach((label) => {
        const valueSpan = label.querySelector("span.text-xs.text-slate-600");
        if (valueSpan) {
          values.push(valueSpan.textContent?.trim() ?? "");
        }
      });
      if (values.length > 0) {
        facets[sectionName] = values;
      }
    });

    return facets;
  });
}

/** Check for broken images on the page */
async function findBrokenImages(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const broken: string[] = [];
    document.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.src) {
        broken.push(img.src);
      }
    });
    return broken;
  });
}

/** Identify issues with a search result */
function identifyIssues(
  query: string,
  resultCount: number,
  products: ProductInfo[],
  consoleErrors: string[],
  responseTimeMs: number
): string[] {
  const issues: string[] = [];

  if (resultCount === 0) {
    issues.push("P0: no results returned");
  }

  if (responseTimeMs > 10000) {
    issues.push(`P1: very slow response (${(responseTimeMs / 1000).toFixed(1)}s)`);
  } else if (responseTimeMs > 5000) {
    issues.push(`P2: slow response (${(responseTimeMs / 1000).toFixed(1)}s)`);
  }

  for (const p of products) {
    if (p.price === "$0.00" || p.price === "N/A" || p.price === "") {
      issues.push(`P1: product "${p.title}" has price "${p.price}"`);
    }
    if (!p.hasImage && p.imageUrl) {
      issues.push(`P2: broken image for "${p.title}"`);
    }
    if (!p.hasImage && !p.imageUrl) {
      issues.push(`P2: missing image for "${p.title}"`);
    }
    if (!p.title || p.title.length === 0) {
      issues.push("P1: product card with empty title");
    }
    // Detect raw SKU-like titles (all caps, codes, etc.)
    if (p.title && /^[A-Z0-9\-_]{5,}$/.test(p.title.replace(/\s/g, ""))) {
      issues.push(`P2: raw SKU title "${p.title}"`);
    }
  }

  if (consoleErrors.length > 0) {
    issues.push(`P2: ${consoleErrors.length} console error(s)`);
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Part 1: Search Tests
// ---------------------------------------------------------------------------

async function runSearchTests(
  page: Page,
  consoleErrors: string[]
): Promise<{ searches: SearchResult[]; allProducts: ProductInfo[] }> {
  const searches: SearchResult[] = [];
  const allProducts: ProductInfo[] = [];

  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i];
    log(`Search ${i + 1}/${QUERIES.length}: "${query}"`);

    // Collect console errors for this search
    const errorsBeforeCount = consoleErrors.length;

    try {
      // Navigate fresh for each search to avoid state leakage
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForSelector('input[placeholder*="Describe"]', { timeout: 10000 });

      // Clear any existing text and type the query
      const input = page.locator('input[placeholder*="Describe"]');
      await input.fill(query);

      // Submit the search and measure response time
      const startTime = Date.now();
      await page.getByRole('button', { name: 'Search' }).click();

      // Wait for results
      await waitForResults(page);
      await waitForNetworkIdle(page, 5000);
      const responseTimeMs = Date.now() - startTime;

      // Extract data
      const resultCount = await getResultCount(page);
      const products = await extractProducts(page, 5);
      const aspects = await extractAspects(page);

      // Open filter rail if there's a filter toggle button
      const filterToggle = page.locator('button[title="Show filters"]');
      let facets: Record<string, string[]> = {};
      if (await filterToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await filterToggle.click();
        await sleep(500);
        facets = await extractFacets(page);
      }

      // Collect console errors for this query
      const searchErrors = consoleErrors.slice(errorsBeforeCount);

      // Identify issues
      const issues = identifyIssues(query, resultCount, products, searchErrors, responseTimeMs);

      // Screenshot
      const screenshotFile = `search-${String(i + 1).padStart(2, "0")}.png`;
      await page.screenshot({
        path: path.join(OUTPUT_DIR, screenshotFile),
        fullPage: false,
      });

      const result: SearchResult = {
        query,
        responseTimeMs,
        resultCount,
        products,
        aspects,
        facets,
        consoleErrors: searchErrors,
        issues,
        screenshotFile,
      };

      searches.push(result);
      allProducts.push(...products);

      log(
        `  -> ${resultCount} results in ${responseTimeMs}ms, ${aspects.length} aspects, ${issues.length} issues`
      );
      if (issues.length > 0) {
        issues.forEach((issue) => log(`     ${issue}`));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log(`  -> ERROR: ${errorMsg}`);
      searches.push({
        query,
        responseTimeMs: -1,
        resultCount: 0,
        products: [],
        aspects: [],
        facets: {},
        consoleErrors: [errorMsg],
        issues: [`P0: test crashed - ${errorMsg}`],
        screenshotFile: "",
      });
    }

    // Rate limiting delay between searches
    if (i < QUERIES.length - 1) {
      await sleep(INTER_SEARCH_DELAY_MS);
    }
  }

  return { searches, allProducts };
}

// ---------------------------------------------------------------------------
// Part 2: Filter Tests
// ---------------------------------------------------------------------------

async function runFilterTests(
  page: Page
): Promise<FilterTestResult[]> {
  const results: FilterTestResult[] = [];
  log("--- Filter Tests ---");

  try {
    // Navigate and search for "gift basket packaging"
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('input[placeholder*="Describe"]', { timeout: 10000 });
    await page.locator('input[placeholder*="Describe"]').fill("gift basket packaging");
    await page.getByRole('button', { name: 'Search' }).click();
    await waitForResults(page);
    await waitForNetworkIdle(page, 5000);

    const initialCount = await getResultCount(page);
    log(`Filter test base: "gift basket packaging" -> ${initialCount} results`);

    // Open filter rail
    const filterToggle = page.locator('button[title="Show filters"]');
    if (await filterToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterToggle.click();
      await sleep(500);
    }

    // Screenshot initial state
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "filter-00-initial.png"),
      fullPage: false,
    });

    // Test 1: Click the first available facet checkbox
    log("Filter test 1: Click first facet checkbox");
    try {
      const firstCheckbox = page.locator("aside label input[type='checkbox']").first();
      if (await firstCheckbox.isVisible({ timeout: 3000 })) {
        const facetLabel = await page.evaluate(() => {
          const label = document.querySelector("aside label");
          const valueSpan = label?.querySelector("span.text-xs");
          return valueSpan?.textContent?.trim() ?? "unknown";
        });

        const countBefore = await getResultCount(page);
        await firstCheckbox.click();

        // Wait for filtering to complete
        await sleep(1500);
        await waitForNetworkIdle(page, 5000);

        // Wait for the result count to potentially change
        await sleep(500);
        const countAfter = await getResultCount(page);

        const passed = countAfter !== countBefore || countAfter > 0;
        results.push({
          action: `Clicked facet checkbox: "${facetLabel}"`,
          resultCountBefore: countBefore,
          resultCountAfter: countAfter,
          passed,
          screenshotFile: "filter-01-facet-click.png",
        });

        await page.screenshot({
          path: path.join(OUTPUT_DIR, "filter-01-facet-click.png"),
          fullPage: false,
        });

        log(`  -> Before: ${countBefore}, After: ${countAfter}, Passed: ${passed}`);

        // Uncheck to reset
        await firstCheckbox.click();
        await sleep(1500);
        await waitForNetworkIdle(page, 5000);
      } else {
        log("  -> No facet checkboxes visible");
        results.push({
          action: "Click first facet checkbox",
          resultCountBefore: initialCount,
          resultCountAfter: initialCount,
          passed: false,
          screenshotFile: "",
        });
      }
    } catch (err) {
      log(`  -> Error: ${err instanceof Error ? err.message : err}`);
      results.push({
        action: "Click first facet checkbox",
        resultCountBefore: initialCount,
        resultCountAfter: -1,
        passed: false,
        screenshotFile: "",
      });
    }

    // Test 2: Click an aspect chip if available
    log("Filter test 2: Click aspect chip");
    try {
      const aspectChips = page.locator(
        "button.rounded-full.border.border-xtal-navy\\/30"
      );
      const chipCount = await aspectChips.count();

      if (chipCount > 0) {
        const chipText = await aspectChips.first().textContent();
        const countBefore = await getResultCount(page);
        await aspectChips.first().click();

        await sleep(1500);
        await waitForNetworkIdle(page, 5000);
        await sleep(500);

        const countAfter = await getResultCount(page);
        const passed = countAfter > 0;

        results.push({
          action: `Clicked aspect chip: "${chipText?.replace(/\s*[+\u2212]\s*$/, "").trim()}"`,
          resultCountBefore: countBefore,
          resultCountAfter: countAfter,
          passed,
          screenshotFile: "filter-02-aspect-chip.png",
        });

        await page.screenshot({
          path: path.join(OUTPUT_DIR, "filter-02-aspect-chip.png"),
          fullPage: false,
        });

        log(`  -> Before: ${countBefore}, After: ${countAfter}, Passed: ${passed}`);
      } else {
        log("  -> No aspect chips available");
        results.push({
          action: "Click aspect chip",
          resultCountBefore: initialCount,
          resultCountAfter: initialCount,
          passed: false,
          screenshotFile: "",
        });
      }
    } catch (err) {
      log(`  -> Error: ${err instanceof Error ? err.message : err}`);
      results.push({
        action: "Click aspect chip",
        resultCountBefore: initialCount,
        resultCountAfter: -1,
        passed: false,
        screenshotFile: "",
      });
    }

    // Test 3: Check if price slider exists and interact
    log("Filter test 3: Price slider");
    try {
      // Price slider uses input[type="range"] inside the aside
      const priceInputs = page.locator("aside input[type='range']");
      const priceInputCount = await priceInputs.count();

      if (priceInputCount > 0) {
        const countBefore = await getResultCount(page);

        // Move the max price slider to the left (reduce max)
        const slider = priceInputs.last();
        const box = await slider.boundingBox();
        if (box) {
          // Click at 60% of the slider width (reduce max range)
          await page.mouse.click(box.x + box.width * 0.6, box.y + box.height / 2);
          await sleep(2000);
          await waitForNetworkIdle(page, 5000);
        }

        const countAfter = await getResultCount(page);
        const passed = countAfter >= 0; // Just verify no crash

        results.push({
          action: "Adjusted price slider (reduced max)",
          resultCountBefore: countBefore,
          resultCountAfter: countAfter,
          passed,
          screenshotFile: "filter-03-price-slider.png",
        });

        await page.screenshot({
          path: path.join(OUTPUT_DIR, "filter-03-price-slider.png"),
          fullPage: false,
        });

        log(`  -> Before: ${countBefore}, After: ${countAfter}, Passed: ${passed}`);
      } else {
        log("  -> No price slider found");
        results.push({
          action: "Adjust price slider",
          resultCountBefore: initialCount,
          resultCountAfter: initialCount,
          passed: false,
          screenshotFile: "",
        });
      }
    } catch (err) {
      log(`  -> Error: ${err instanceof Error ? err.message : err}`);
      results.push({
        action: "Adjust price slider",
        resultCountBefore: initialCount,
        resultCountAfter: -1,
        passed: false,
        screenshotFile: "",
      });
    }

    // Test 4: Click "Clear all" to reset filters
    log("Filter test 4: Clear all filters");
    try {
      const clearAllButton = page.locator("button", { hasText: "Clear all" }).first();
      if (await clearAllButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const countBefore = await getResultCount(page);
        await clearAllButton.click();

        await sleep(1500);
        await waitForNetworkIdle(page, 5000);
        await sleep(500);

        const countAfter = await getResultCount(page);
        // After clearing, should have same or more results than filtered state
        const passed = countAfter >= countBefore;

        results.push({
          action: 'Clicked "Clear all" to reset filters',
          resultCountBefore: countBefore,
          resultCountAfter: countAfter,
          passed,
          screenshotFile: "filter-04-clear-all.png",
        });

        await page.screenshot({
          path: path.join(OUTPUT_DIR, "filter-04-clear-all.png"),
          fullPage: false,
        });

        log(`  -> Before: ${countBefore}, After: ${countAfter}, Passed: ${passed}`);
      } else {
        log('  -> No "Clear all" button visible (no active filters)');
        results.push({
          action: 'Click "Clear all"',
          resultCountBefore: initialCount,
          resultCountAfter: initialCount,
          passed: true, // No filters to clear is acceptable
          screenshotFile: "",
        });
      }
    } catch (err) {
      log(`  -> Error: ${err instanceof Error ? err.message : err}`);
      results.push({
        action: 'Click "Clear all"',
        resultCountBefore: initialCount,
        resultCountAfter: -1,
        passed: false,
        screenshotFile: "",
      });
    }
  } catch (err) {
    log(`Filter tests crashed: ${err instanceof Error ? err.message : err}`);
    results.push({
      action: "Filter test suite",
      resultCountBefore: 0,
      resultCountAfter: 0,
      passed: false,
      screenshotFile: "",
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Part 3: Content Capture
// ---------------------------------------------------------------------------

async function runContentCapture(
  page: Page,
  allSearchProducts: ProductInfo[]
): Promise<ContentCapture> {
  log("--- Content Capture ---");

  const capture: ContentCapture = {
    defaultSuggestions: [],
    allProductTitles: [],
    allFacetValues: {},
    brokenImages: [],
    zeroPrices: [],
    rawSkuTitles: [],
  };

  try {
    // Navigate to fresh page to capture default suggestions
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('input[placeholder*="Describe"]', { timeout: 10000 });
    await sleep(1000);

    // Capture default suggestion chips (the "Example queries:" chips shown before first search)
    capture.defaultSuggestions = await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll("button.rounded-full.border.border-slate-200")
      );
      return buttons
        .map((btn) => btn.textContent?.trim() ?? "")
        .filter((t) => t.length > 0);
    });
    log(`  Default suggestions: ${capture.defaultSuggestions.length} found`);

    // Screenshot the landing state
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "content-00-landing.png"),
      fullPage: false,
    });
  } catch (err) {
    log(`  Error capturing suggestions: ${err instanceof Error ? err.message : err}`);
  }

  // Aggregate data from all search results
  const allTitles = new Set<string>();
  const allBroken: string[] = [];
  const allZero: string[] = [];
  const allRawSku: string[] = [];
  const allFacets: Record<string, Set<string>> = {};

  for (const product of allSearchProducts) {
    if (product.title) {
      allTitles.add(product.title);
    }
    if (!product.hasImage && product.imageUrl) {
      allBroken.push(`${product.title}: ${product.imageUrl}`);
    }
    if (
      product.price === "$0.00" ||
      product.price === "N/A" ||
      product.price === ""
    ) {
      allZero.push(`${product.title}: ${product.price}`);
    }
    if (
      product.title &&
      /^[A-Z0-9\-_]{5,}$/.test(product.title.replace(/\s/g, ""))
    ) {
      allRawSku.push(product.title);
    }
  }

  capture.allProductTitles = Array.from(allTitles);
  capture.brokenImages = allBroken;
  capture.zeroPrices = allZero;
  capture.rawSkuTitles = allRawSku;

  // Do one more search to capture full facet data
  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('input[placeholder*="Describe"]', { timeout: 10000 });
    await page.locator('input[placeholder*="Describe"]').fill("home decor");
    await page.getByRole('button', { name: 'Search' }).click();
    await waitForResults(page);
    await waitForNetworkIdle(page, 5000);

    // Open filters
    const filterToggle = page.locator('button[title="Show filters"]');
    if (await filterToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterToggle.click();
      await sleep(500);

      // Expand all sections and click "Show more" to get full facet values
      const showMoreButtons = page.locator("aside button", { hasText: /Show \d+ more/ });
      const showMoreCount = await showMoreButtons.count();
      for (let i = 0; i < showMoreCount; i++) {
        try {
          await showMoreButtons.nth(i).click();
          await sleep(200);
        } catch {
          // Some may not be clickable
        }
      }

      const facetData = await extractFacets(page);
      for (const [section, values] of Object.entries(facetData)) {
        if (!allFacets[section]) allFacets[section] = new Set();
        values.forEach((v) => allFacets[section].add(v));
      }
    }
  } catch (err) {
    log(`  Error capturing facets: ${err instanceof Error ? err.message : err}`);
  }

  // Convert sets to arrays
  for (const [key, valSet] of Object.entries(allFacets)) {
    capture.allFacetValues[key] = Array.from(valSet);
  }

  log(`  Total unique product titles: ${capture.allProductTitles.length}`);
  log(`  Broken images: ${capture.brokenImages.length}`);
  log(`  Zero/missing prices: ${capture.zeroPrices.length}`);
  log(`  Raw SKU titles: ${capture.rawSkuTitles.length}`);
  log(`  Facet sections: ${Object.keys(capture.allFacetValues).length}`);

  return capture;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("==============================================");
  console.log("  XTAL QA - Willow Demo Production Test");
  console.log("==============================================\n");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // Find browser
  const browserPath = findBrowser();
  log(`Using browser: ${browserPath}`);

  // Launch browser
  let browser: Browser;
  try {
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
      args: [
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  } catch (err) {
    console.error(`Failed to launch browser: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  log("Browser launched");

  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 XTAL-QA/1.0",
  });
  const page = await context.newPage();

  // Collect console errors globally
  const consoleErrors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Catch uncaught page errors
  page.on("pageerror", (err) => {
    consoleErrors.push(`PAGE_ERROR: ${err.message}`);
  });

  try {
    // --- Part 1: Search Tests ---
    console.log("\n--- Part 1: Search Tests (20 queries) ---\n");
    const { searches, allProducts } = await runSearchTests(page, consoleErrors);

    // --- Part 2: Filter Tests ---
    console.log("\n--- Part 2: Filter Tests ---\n");
    const filterTests = await runFilterTests(page);

    // --- Part 3: Content Capture ---
    console.log("\n--- Part 3: Content Capture ---\n");
    const contentCapture = await runContentCapture(page, allProducts);

    // --- Build Report ---
    const successfulSearches = searches.filter((s) => s.resultCount > 0);
    const failedSearches = searches.filter((s) => s.resultCount === 0);
    const responseTimes = searches
      .filter((s) => s.responseTimeMs > 0)
      .map((s) => s.responseTimeMs);
    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    const allIssues = searches.flatMap((s) => s.issues);
    const p0Issues = allIssues.filter((i) => i.startsWith("P0")).length;
    const p1Issues = allIssues.filter((i) => i.startsWith("P1")).length;

    const report: QAReport = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      browserPath,
      searches,
      filterTests,
      contentCapture,
      summary: {
        totalSearches: searches.length,
        successfulSearches: successfulSearches.length,
        failedSearches: failedSearches.length,
        averageResponseTimeMs: avgResponseTime,
        totalIssues: allIssues.length,
        p0Issues,
        p1Issues,
      },
    };

    // Write JSON report
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
    log(`Report written to: ${REPORT_PATH}`);

    // --- Print Summary ---
    console.log("\n==============================================");
    console.log("  QA SUMMARY");
    console.log("==============================================");
    console.log(`  Timestamp:          ${report.timestamp}`);
    console.log(`  URL:                ${BASE_URL}`);
    console.log(`  Total Searches:     ${report.summary.totalSearches}`);
    console.log(`  Successful:         ${report.summary.successfulSearches}`);
    console.log(`  Failed (0 results): ${report.summary.failedSearches}`);
    console.log(`  Avg Response Time:  ${report.summary.averageResponseTimeMs}ms`);
    console.log(`  Total Issues:       ${report.summary.totalIssues}`);
    console.log(`  P0 (critical):      ${report.summary.p0Issues}`);
    console.log(`  P1 (important):     ${report.summary.p1Issues}`);
    console.log(`  Filter Tests:       ${filterTests.filter((f) => f.passed).length}/${filterTests.length} passed`);
    console.log(`  Unique Products:    ${contentCapture.allProductTitles.length}`);
    console.log(`  Broken Images:      ${contentCapture.brokenImages.length}`);
    console.log(`  Zero Prices:        ${contentCapture.zeroPrices.length}`);
    console.log(`  Raw SKU Titles:     ${contentCapture.rawSkuTitles.length}`);
    console.log(`  Report:             ${REPORT_PATH}`);
    console.log("==============================================\n");

    if (failedSearches.length > 0) {
      console.log("Queries with 0 results:");
      failedSearches.forEach((s) => console.log(`  - "${s.query}"`));
      console.log();
    }

    if (p0Issues > 0 || p1Issues > 0) {
      console.log("High-priority issues:");
      allIssues
        .filter((i) => i.startsWith("P0") || i.startsWith("P1"))
        .forEach((i) => console.log(`  - ${i}`));
      console.log();
    }
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
