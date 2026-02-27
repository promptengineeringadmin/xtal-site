import { readFileSync } from 'fs';

const files = [
  'C:/Users/rudcz/.claude/projects/c--vibe-xtal-site/06275bb7-4754-4299-a71a-f630338f8c8e/tool-results/b507b5e.txt',
  'C:/Users/rudcz/.claude/projects/c--vibe-xtal-site/06275bb7-4754-4299-a71a-f630338f8c8e/tool-results/b4f947e.txt',
  'C:/Users/rudcz/.claude/projects/c--vibe-xtal-site/06275bb7-4754-4299-a71a-f630338f8c8e/tool-results/bf1e011.txt',
  'C:/Users/rudcz/.claude/projects/c--vibe-xtal-site/06275bb7-4754-4299-a71a-f630338f8c8e/tool-results/bee22dd.txt',
  'C:/Users/rudcz/.claude/projects/c--vibe-xtal-site/06275bb7-4754-4299-a71a-f630338f8c8e/tool-results/b098396.txt',
];

const queries = [
  'gift for a teenage gamer',
  'setting up a home theater on a budget',
  'gaming keyboard and mouse combo',
  'smart home starter kit',
  'best tablet under 300',
];

files.forEach((f, i) => {
  const raw = readFileSync(f, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch(e) {
    console.log('Parse error for file', f, e.message);
    return;
  }
  console.log(`=== Query ${i+1}: ${queries[i]} ===`);
  if (data.results) {
    data.results.forEach((r, j) => {
      const price = r.price !== undefined ? `$${r.price}` : 'N/A';
      const vendor = r.vendor || 'N/A';
      console.log(`${j+1}. [${price}] [${vendor}] ${r.title}`);
    });
  } else {
    console.log('No results found. Keys:', Object.keys(data));
  }
  console.log('');
});
