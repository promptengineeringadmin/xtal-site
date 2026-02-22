import { chromium } from 'playwright';

const url = process.argv[2] || 'https://hesperios.com/?s=grey+sweater';

console.log(`\n=== Scraping rendered DOM from: ${url} ===\n`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

// Wait for product cards to render
try {
  await page.waitForSelector('article.product-card, .product-card, .search-result', { timeout: 15000 });
} catch {
  console.log('Warning: no product cards found within timeout, dumping whatever is on page');
}
await page.waitForTimeout(2000);

// Extract the DOM hierarchy from <body> down to product cards
const report = await page.evaluate(() => {
  const results = {};

  // 1. Body classes
  results.bodyClasses = document.body.className;

  // 2. Walk the hierarchy from body to product cards
  function describeElement(el, maxDepth = 0) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const classes = el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\s+/).join('.')
      : '';
    const dataAttrs = Array.from(el.attributes)
      .filter(a => a.name.startsWith('data-'))
      .map(a => `${a.name}="${a.value}"`)
      .join(' ');
    const role = el.getAttribute('role') ? `role="${el.getAttribute('role')}"` : '';

    let desc = `<${tag}${id}${classes}`;
    if (dataAttrs) desc += ` ${dataAttrs}`;
    if (role) desc += ` ${role}`;
    desc += '>';
    return desc;
  }

  function walkHierarchy(el, depth = 0, maxDepth = 15) {
    if (depth > maxDepth) return '';
    const indent = '  '.repeat(depth);
    const tag = el.tagName?.toLowerCase();
    if (!tag) return '';
    // Skip script, style, noscript, svg internals
    if (['script', 'style', 'noscript', 'link', 'meta'].includes(tag)) return '';

    let line = indent + describeElement(el) + '\n';

    for (const child of el.children) {
      line += walkHierarchy(child, depth + 1, maxDepth);
    }
    return line;
  }

  // 3. Full hierarchy (limited depth)
  results.hierarchy = walkHierarchy(document.body, 0, 12);

  // 4. Find product cards directly
  const firstCard = document.querySelector('article.product-card, .product-card');
  if (firstCard) {
    results.firstCardOuterHTML = firstCard.outerHTML.substring(0, 5000);
    results.firstCardTag = describeElement(firstCard);

    // Find the search-results-wrapper
    const wrapper = document.querySelector('.search-results-wrapper');
    if (wrapper) {
      results.wrapperTag = describeElement(wrapper);
      results.wrapperChildren = Array.from(wrapper.children).length;
    }

    // Count all product cards
    results.productCount = document.querySelectorAll('article.product-card').length;
    // Count all search-result divs
    results.searchResultCount = document.querySelectorAll('.search-result').length;
  }

  // 5. Search controls
  results.resultCount = document.querySelector('.woocommerce-result-count, [class*="result-count"], [class*="results-count"]')?.outerHTML;
  results.ordering = document.querySelector('.woocommerce-ordering, [class*="sort"], [class*="ordering"]')?.outerHTML;
  results.pagination = document.querySelector('.woocommerce-pagination, .pagination, nav[class*="pagination"]')?.outerHTML;
  results.breadcrumb = document.querySelector('.woocommerce-breadcrumb, .breadcrumb, [class*="breadcrumb"]')?.outerHTML;

  // 6. Search heading
  const h1 = document.querySelector('h1');
  if (h1) results.searchHeading = { tag: describeElement(h1), text: h1.textContent.trim() };

  // 7. Main content area
  const main = document.querySelector('main, #main, #main-content, [role="main"]');
  if (main) {
    results.mainTag = describeElement(main);
    results.mainDirectChildren = Array.from(main.children).map(c => describeElement(c));
  }

  // 8. Header and footer for reference
  const header = document.querySelector('header, #masthead, [role="banner"]');
  if (header) results.headerTag = describeElement(header);

  const footer = document.querySelector('footer, #colophon, [role="contentinfo"]');
  if (footer) results.footerTag = describeElement(footer);

  return results;
});

// Print the report
console.log('=== BODY CLASSES ===');
console.log(report.bodyClasses);

console.log('\n=== HEADER ===');
console.log(report.headerTag || 'not found');

console.log('\n=== MAIN CONTENT ===');
console.log(report.mainTag || 'not found');
if (report.mainDirectChildren) {
  console.log('Direct children of main:');
  report.mainDirectChildren.forEach(c => console.log('  ' + c));
}

console.log('\n=== SEARCH HEADING ===');
console.log(report.searchHeading ? `${report.searchHeading.tag} — "${report.searchHeading.text}"` : 'not found');

console.log('\n=== PRODUCT GRID ===');
console.log('Grid element:', report.productGridTag || 'NOT FOUND');
console.log('Product count:', report.productCount || 0);
if (report.productGridParentChain) {
  console.log('Parent chain (body → grid):');
  report.productGridParentChain.forEach((p, i) => console.log('  '.repeat(i + 1) + p));
}

console.log('\n=== SEARCH CONTROLS ===');
console.log('Result count:', report.resultCount || 'not found');
console.log('Ordering:', report.ordering || 'not found');
console.log('Pagination:', report.pagination || 'not found');
console.log('Breadcrumb:', report.breadcrumb || 'not found');

console.log('\n=== FIRST PRODUCT CARD ===');
console.log('Tag:', report.firstCardTag || 'not found');
console.log('HTML:');
console.log(report.firstCardOuterHTML || 'not found');

console.log('\n=== FOOTER ===');
console.log(report.footerTag || 'not found');

console.log('\n=== FULL DOM HIERARCHY ===');
console.log(report.hierarchy);

await browser.close();
