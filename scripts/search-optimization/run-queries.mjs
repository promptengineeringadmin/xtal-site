// Run all 15 test queries for xtaldemo and output results
import { writeFileSync } from 'fs';

const QUERIES = [
  { id: 1, query: "Instant Pot", archetype: "direct product" },
  { id: 2, query: "throw blankets", archetype: "category browse" },
  { id: 3, query: "kitchen gadgets for meal prep", archetype: "use case + product" },
  { id: 4, query: "gifts for coffee lovers", archetype: "persona + gift" },
  { id: 5, query: "hosting a dinner party this weekend", archetype: "occasion" },
  { id: 6, query: "make my bathroom feel like a spa", archetype: "intent-only/vibe" },
  { id: 7, query: "affordable home office setup", archetype: "budget-constrained" },
  { id: 8, query: "best travel accessories", archetype: "comparison-style" },
  { id: 9, query: "my closet is a mess", archetype: "problem-solving" },
  { id: 10, query: "soft breathable cotton sheets queen size", archetype: "multi-attribute" },
  { id: 11, query: "yoga mat", archetype: "direct product" },
  { id: 12, query: "cozy gift for someone who is always cold", archetype: "persona + vibe" },
  { id: 13, query: "minimalist desk setup", archetype: "vibe + space" },
  { id: 14, query: "waterproof hiking boots", archetype: "use case + product" },
  { id: 15, query: "kids birthday party supplies", archetype: "occasion + persona" },
];

async function runQuery(q) {
  const res = await fetch('https://www.xtalsearch.com/api/xtal/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q.query, collection: 'xtaldemo', limit: 30 }),
  });
  const data = await res.json();
  const results = (data.results || []).map((r, i) => ({
    pos: i + 1,
    title: (r.title || r.name || '').substring(0, 70),
    price: r.price || r.price_min || r.price_max || '',
    vendor: r.vendor || r.brand || r.manufacturer || '',
    category: r.category || r.product_type || '',
    description_snippet: (r.description || r.body_html || '').substring(0, 100),
  }));
  return { ...q, results, count: results.length };
}

console.log('Running 15 queries against xtaldemo...');
const allResults = [];
for (const q of QUERIES) {
  process.stdout.write(`Query ${q.id}: "${q.query}"...`);
  try {
    const result = await runQuery(q);
    allResults.push(result);
    console.log(` ${result.count} results`);
  } catch (e) {
    console.log(` ERROR: ${e.message}`);
    allResults.push({ ...q, results: [], count: 0, error: e.message });
  }
  // Small delay to be respectful
  await new Promise(r => setTimeout(r, 300));
}

// Save raw results
writeFileSync('c:/vibe/xtal-site/scripts/search-optimization/raw-results.json', JSON.stringify(allResults, null, 2));
console.log('\nSaved to raw-results.json');

// Print summary table
for (const q of allResults) {
  console.log(`\n=== Q${q.id}: "${q.query}" (${q.archetype}) ===`);
  if (q.error) { console.log(`ERROR: ${q.error}`); continue; }
  q.results.forEach(r => {
    console.log(`  ${String(r.pos).padStart(2)}. [${r.category || 'N/A'}] ${r.title.substring(0,60)} | $${r.price} | ${r.vendor}`);
  });
}
