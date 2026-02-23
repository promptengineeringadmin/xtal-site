/**
 * extract-search-styles.mjs — Extract exact HTML, computed CSS, and product images
 * from a live merchant search page using Playwright.
 *
 * Output: public/sandbox/<slug>/extracted-styles.json + images/
 *
 * Usage:
 *   node scripts/extract-search-styles.mjs <url> --slug <name>
 */

import { chromium } from "playwright-core";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

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
  throw new Error("No Chromium browser found");
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    mod.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const url = args[0];
  const slugIdx = args.indexOf("--slug");
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : "willow-real";

  if (!url) {
    console.log("Usage: node scripts/extract-search-styles.mjs <search-url> --slug <name>");
    process.exit(1);
  }

  const OUTPUT_DIR = path.resolve(__dirname, `../public/sandbox/${slug}`);
  const IMAGES_DIR = path.join(OUTPUT_DIR, "images");
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  log(`Extracting styles from: ${url}`);
  log(`Output: ${OUTPUT_DIR}`);

  const browser = await chromium.launch({
    executablePath: findBrowser(),
    headless: true,
    args: ["--disable-gpu", "--no-sandbox"],
  });

  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  log("Page loaded (domcontentloaded)");

  // Wait for network idle
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch { log("Network idle timeout (expected for SPA)"); }

  // Wait for product images to render
  try {
    await page.waitForSelector("img[src*='/media/']", { timeout: 15000 });
    log("Product images detected");
  } catch { log("No product images found within timeout"); }

  // Extra wait for Angular rendering
  await page.waitForTimeout(5000);

  // ===== EXTRACT EVERYTHING =====
  const extracted = await page.evaluate(() => {
    function getStyles(el) {
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontStyle: cs.fontStyle,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        padding: cs.padding,
        margin: cs.margin,
        border: cs.border,
        borderRadius: cs.borderRadius,
        width: cs.width,
        height: cs.height,
        lineHeight: cs.lineHeight,
        display: cs.display,
        gap: cs.gap,
        textDecoration: cs.textDecoration,
        boxShadow: cs.boxShadow,
        outline: cs.outline,
      };
    }

    function getHTML(el) {
      return el ? el.outerHTML.substring(0, 2000) : null;
    }

    const result = {};

    // --- HEADER ---
    // Search input
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    result.searchInput = {
      styles: getStyles(searchInput),
      parentStyles: getStyles(searchInput?.parentElement),
      placeholder: searchInput?.placeholder,
      html: getHTML(searchInput?.parentElement),
    };

    // Logo
    const logoLink = document.querySelector('a[href="/"] .logo, .navbar-brand, header a[href="/"]');
    const logoImg = document.querySelector('header img[alt*="Willow"], header img[src*="logo"], .navbar-brand img');
    const logoText = document.querySelector('.logo-text, .navbar-brand');
    result.logo = {
      imgSrc: logoImg?.src || null,
      styles: getStyles(logoLink || logoText || logoImg?.parentElement),
      html: getHTML(logoLink || logoText || logoImg?.closest('a')),
    };

    // Header container
    const header = document.querySelector('header, .navbar, [class*="header"]');
    result.header = {
      styles: getStyles(header),
      html: getHTML(header)?.substring(0, 500),
    };

    // Nav links (right side: Catalogs, Custom Orders, etc.)
    const navLinks = Array.from(document.querySelectorAll('header a, .navbar a')).filter(a => {
      const text = a.textContent.trim();
      return ['Catalogs', 'Custom Orders', 'Events', 'Register'].includes(text);
    });
    result.headerLinks = navLinks.map(a => ({
      text: a.textContent.trim(),
      styles: getStyles(a),
    }));

    // --- CATEGORY NAV ---
    const categoryNav = document.querySelector('.nav-categories, .category-nav, nav.navbar');
    const categoryLinks = Array.from(document.querySelectorAll('a')).filter(a => {
      const text = a.textContent.trim();
      return ['New', 'Display', 'Packaging', 'Decor', 'Garden & Floral', 'Seasonal'].includes(text);
    });
    result.categoryNav = {
      containerStyles: getStyles(categoryNav),
      links: categoryLinks.map(a => ({
        text: a.textContent.trim(),
        styles: getStyles(a),
      })),
    };

    // --- CONTROLS ROW ---
    // "Hide Filters" button
    const hideFiltersBtn = Array.from(document.querySelectorAll('button, a, span')).find(el =>
      el.textContent.includes('Hide Filters')
    );
    result.hideFilters = {
      styles: getStyles(hideFiltersBtn),
      parentStyles: getStyles(hideFiltersBtn?.parentElement),
    };

    // Show/Sort dropdowns
    const showDropdown = Array.from(document.querySelectorAll('button, span, div')).find(el =>
      el.textContent.trim().startsWith('Show')
    );
    const sortDropdown = Array.from(document.querySelectorAll('button, span, div')).find(el =>
      el.textContent.trim().startsWith('Sort')
    );
    result.showDropdown = { styles: getStyles(showDropdown) };
    result.sortDropdown = { styles: getStyles(sortDropdown) };

    // --- FILTER RAIL ---
    // Toggle switches
    const toggleSwitches = document.querySelectorAll('.toggle-switch, .custom-switch, input[type="checkbox"]');
    result.filterToggles = {
      count: toggleSwitches.length,
      firstStyles: getStyles(toggleSwitches[0]),
      parentStyles: getStyles(toggleSwitches[0]?.closest('.filter, .sidebar, [class*="filter"]')),
    };

    // Filter sections (Material, Set, Shape, Handle)
    const filterHeaders = Array.from(document.querySelectorAll('h3, h4, .filter-header, [class*="filter"] > div')).filter(el => {
      const text = el.textContent.trim();
      return ['Material', 'Set', 'Shape', 'Handle'].includes(text);
    });
    result.filterSections = filterHeaders.map(h => ({
      text: h.textContent.trim(),
      styles: getStyles(h),
      parentStyles: getStyles(h.parentElement),
    }));

    // --- PRODUCT GRID ---
    const productCards = document.querySelectorAll('[class*="product"], [class*="item-card"], .shop-item');
    const products = [];
    productCards.forEach((card, i) => {
      if (i >= 12) return; // First 12 products max
      const img = card.querySelector('img');
      const texts = Array.from(card.querySelectorAll('span, div, p, h3, h4, a')).map(el => ({
        text: el.textContent.trim().substring(0, 100),
        tag: el.tagName,
        className: el.className?.substring?.(0, 80) || '',
        styles: getStyles(el),
      })).filter(t => t.text.length > 0 && t.text.length < 80);

      products.push({
        imgSrc: img?.src || null,
        imgAlt: img?.alt || null,
        imgStyles: getStyles(img),
        cardStyles: getStyles(card),
        imageContainerStyles: getStyles(img?.parentElement),
        texts: texts.slice(0, 6), // SKU, name, dimensions
        cardHTML: card.outerHTML.substring(0, 1000),
      });
    });
    result.products = products;

    // Product grid container
    const gridContainer = productCards[0]?.parentElement;
    result.productGrid = {
      styles: getStyles(gridContainer),
      html: gridContainer ? `<${gridContainer.tagName} class="${gridContainer.className}">` : null,
    };

    // --- OVERALL PAGE ---
    result.body = {
      styles: getStyles(document.body),
    };

    return result;
  });

  log(`Extracted styles for ${Object.keys(extracted).length} sections`);
  log(`Found ${extracted.products?.length || 0} product cards`);

  // Download product images
  const imageMap = {};
  if (extracted.products) {
    for (let i = 0; i < extracted.products.length; i++) {
      const p = extracted.products[i];
      if (p.imgSrc) {
        const ext = path.extname(new URL(p.imgSrc).pathname) || ".jpg";
        const filename = `product-${i}${ext}`;
        const dest = path.join(IMAGES_DIR, filename);
        try {
          await downloadFile(p.imgSrc, dest);
          imageMap[p.imgSrc] = `/sandbox/${slug}/images/${filename}`;
          log(`  Downloaded image ${i}: ${filename}`);
        } catch (err) {
          log(`  Failed to download image ${i}: ${err.message}`);
        }
      }
    }
  }

  extracted._imageMap = imageMap;

  // Save extracted data
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "extracted-styles.json"),
    JSON.stringify(extracted, null, 2),
    "utf-8"
  );
  log(`Saved extracted-styles.json`);

  // Take a screenshot for reference
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "reference-screenshot.png"),
    fullPage: false,
  });
  log("Saved reference-screenshot.png");

  await browser.close();
  log("Done!");

  // Print summary
  console.log("\n=== Extraction Summary ===");
  console.log(`Products: ${extracted.products?.length || 0}`);
  console.log(`Images downloaded: ${Object.keys(imageMap).length}`);
  console.log(`Output: ${OUTPUT_DIR}/extracted-styles.json`);
  console.log(`Next: Read extracted-styles.json and update search.html\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
