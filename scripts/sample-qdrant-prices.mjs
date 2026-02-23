// Quick script to sample prices from a Qdrant collection
const QDRANT_URL = 'http://dewine-dev-alb-687752695.us-east-1.elb.amazonaws.com:6333';
const COLLECTION = process.argv[2] || 'xtaldemo';

async function main() {
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points/scroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit: 15, with_payload: true, with_vector: false })
  });

  const data = await res.json();

  if (!data.result || !data.result.points) {
    console.log('Error or empty:', JSON.stringify(data, null, 2));
    return;
  }

  const points = data.result.points;
  const prices = [];

  console.log(`\nSample prices from collection: ${COLLECTION}`);
  console.log('='.repeat(70));

  for (const pt of points) {
    const p = pt.payload;
    const price = p.price;
    const title = (p.title || p.name || '???').substring(0, 55);
    const variants = p.variants;

    if (typeof price === 'number') prices.push(price);
    if (Array.isArray(price)) prices.push(...price);

    let variantInfo = '';
    if (Array.isArray(variants) && variants.length > 0) {
      variantInfo = variants.slice(0, 3).map(v => v.price).join(', ');
    }

    console.log(`${title}`);
    console.log(`  price: ${JSON.stringify(price)}   variants: [${variantInfo || 'none'}]`);
  }

  console.log('\n' + '='.repeat(70));
  if (prices.length > 0) {
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    console.log(`Stats (${prices.length} numeric prices):`);
    console.log(`  Min:    ${sorted[0]}`);
    console.log(`  Median: ${median}`);
    console.log(`  Max:    ${sorted[sorted.length - 1]}`);
    console.log(`\nIf these look like CENTS, divide by 100 to get dollars.`);
    console.log(`If these look like DOLLARS already, no change needed.`);
    console.log(`If these look like fractions (0.xx), multiply by 100.`);
  }
}

main().catch(e => console.error('Error:', e.message));
