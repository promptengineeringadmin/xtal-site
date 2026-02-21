import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Integration Guide — XTAL Search",
  description:
    "Technical documentation for integrating XTAL AI-powered search into your e-commerce storefront.",
}

export default function IntegrationDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-12 print:px-0 print:py-0">
      {/* Print-only header */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold text-xtal-navy">XTAL Search — Integration Guide</h1>
        <p className="text-sm text-slate-500 mt-1">https://xtalsearch.com/docs/integration</p>
      </div>

      {/* ──────────── Overview ──────────── */}
      <section id="overview" className="mb-16">
        <h1 className="text-3xl font-bold text-slate-900 print:text-2xl">Integration Guide</h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-2xl">
          XTAL Search is an AI-powered product search engine for e-commerce. It combines
          vector similarity search, AI query understanding, and real-time faceting to deliver
          highly relevant product results.
        </p>

        <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6 print-avoid-break">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Architecture</h3>
          <div className="font-mono text-sm text-slate-600 space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-center min-w-[140px]">
                Storefront
              </span>
              <span className="text-slate-400">&rarr;</span>
              <span className="bg-xtal-navy/5 border border-xtal-navy/20 rounded-lg px-3 py-2 text-center min-w-[140px] text-xtal-navy">
                XTAL API
              </span>
              <span className="text-slate-400">&rarr;</span>
              <span className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-center min-w-[140px]">
                AI + Vector DB
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              The storefront sends search queries to the XTAL API (hosted at xtalsearch.com),
              which returns ranked product results with facets and AI-generated aspects.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────── Quick Start ──────────── */}
      <section id="quick-start" className="mb-16 print-break-before">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Quick Start</h2>
        <p className="text-slate-600 mb-6">
          The fastest way to integrate XTAL Search is via our JavaScript snippet.
          Add this to your storefront&apos;s <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded font-mono">&lt;head&gt;</code> tag:
        </p>
        <CodeBlock language="html">{`<link rel="preconnect" href="https://xtalsearch.com">
<script>
  (function(){
    var s = document.createElement('script');
    s.src = 'https://xtalsearch.com/client/v1/xtal.js';
    s.async = true;
    s.dataset.shopId = 'YOUR_COLLECTION_ID';
    document.head.appendChild(s);
  })();
</script>`}</CodeBlock>
        <p className="text-sm text-slate-500 mt-3">
          Replace <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">YOUR_COLLECTION_ID</code> with
          your assigned collection identifier. The snippet automatically discovers your search input
          and renders results in an overlay.
        </p>
      </section>

      {/* ──────────── Integration Options ──────────── */}
      <section id="integration-options" className="mb-16 print-break-before">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Integration Options</h2>
        <p className="text-slate-600 mb-6">
          XTAL supports two integration approaches. Choose based on your platform&apos;s architecture and requirements.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">A</span>
              <h3 className="font-semibold text-slate-900">JavaScript Snippet</h3>
            </div>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>Single <code className="bg-slate-100 px-1 rounded font-mono text-xs">&lt;script&gt;</code> tag in storefront head</li>
              <li>Zero backend changes required</li>
              <li>Renders results in overlay or inline</li>
              <li>Handles search input interception automatically</li>
              <li>Best for: quick integration, minimal dev effort</li>
            </ul>
          </div>
          <div className="border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">B</span>
              <h3 className="font-semibold text-slate-900">Server-Side API</h3>
            </div>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>Your backend calls XTAL REST endpoints</li>
              <li>Render results in your own templates</li>
              <li>Full control over result display and UX</li>
              <li>Better for SEO (server-side rendering)</li>
              <li>Best for: custom UX, SSR, deep platform integration</li>
            </ul>
          </div>
        </div>

        <div className="overflow-x-auto print-avoid-break">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Aspect</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-700">JS Snippet</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Server-Side API</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="px-4 py-2 text-slate-600">Implementation effort</td><td className="px-4 py-2">Minimal (1 script tag)</td><td className="px-4 py-2">Moderate (API + templates)</td></tr>
              <tr><td className="px-4 py-2 text-slate-600">Backend changes</td><td className="px-4 py-2">None</td><td className="px-4 py-2">Required</td></tr>
              <tr><td className="px-4 py-2 text-slate-600">SEO / SSR</td><td className="px-4 py-2">Client-only rendering</td><td className="px-4 py-2">Full SSR support</td></tr>
              <tr><td className="px-4 py-2 text-slate-600">UX customization</td><td className="px-4 py-2">Configurable via settings</td><td className="px-4 py-2">Full control</td></tr>
              <tr><td className="px-4 py-2 text-slate-600">Latency</td><td className="px-4 py-2">Direct browser &rarr; XTAL</td><td className="px-4 py-2">Browser &rarr; your server &rarr; XTAL</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ──────────── API Reference: Search ──────────── */}
      <section id="search-api" className="mb-16 print-break-before">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">API Reference</h2>

        <div className="mb-10 print-avoid-break">
          <div className="flex items-center gap-2.5 mb-3">
            <MethodBadge method="POST" />
            <code className="text-lg font-mono font-medium text-slate-900">/api/xtal/search</code>
          </div>
          <p className="text-slate-600 mb-4">
            Execute a product search query. Returns ranked results, facets, relevance scores, and search context for subsequent filtering.
          </p>

          <h4 className="text-sm font-semibold text-slate-700 mb-2">Request Body</h4>
          <FieldTable fields={[
            { name: "query", type: "string", required: true, description: "The search query text" },
            { name: "limit", type: "number", required: false, description: "Results per page (default: 48)" },
            { name: "collection", type: "string", required: false, description: "Collection identifier (e.g., \"willow\")" },
            { name: "search_context", type: "SearchContext", required: false, description: "Context from a previous search (for filtering)" },
            { name: "selected_aspects", type: "string[]", required: false, description: "AI-generated aspect filters to apply" },
            { name: "facet_filters", type: "Record<string, string[]>", required: false, description: "Tag-based facet filters (e.g., {\"color\": [\"red\"]})" },
            { name: "price_range", type: "{min, max}", required: false, description: "Price filter in dollars (e.g., {\"min\": 10, \"max\": 100})" },
          ]} />

          <h4 className="text-sm font-semibold text-slate-700 mt-6 mb-2">Example Request</h4>
          <CodeBlock language="json">{`POST /api/xtal/search
Content-Type: application/json

{
  "query": "wireless headphones",
  "limit": 24,
  "collection": "willow"
}`}</CodeBlock>

          <h4 className="text-sm font-semibold text-slate-700 mt-6 mb-2">Example Response</h4>
          <CodeBlock language="json">{`{
  "results": [
    {
      "id": "prod_8291",
      "title": "Premium Wireless Over-Ear Headphones",
      "name": "Premium Wireless Over-Ear Headphones",
      "price": 149.99,
      "image_url": "https://cdn.example.com/headphones-1.jpg",
      "product_url": "https://store.example.com/products/headphones-1",
      "vendor": "AudioTech",
      "product_type": "Headphones",
      "tags": ["category_electronics", "brand_audiotech", "color_black"],
      "description": "High-fidelity wireless headphones with ANC...",
      "images": [{"src": "https://cdn.example.com/headphones-1.jpg"}],
      "variants": [{"price": 149.99, "compare_at_price": 199.99}],
      "available": true
    }
  ],
  "total": 42,
  "query_time": 187,
  "relevance_scores": {
    "prod_8291": 0.92
  },
  "search_context": {
    "augmented_query": "wireless bluetooth headphones over-ear",
    "extracted_price_lte": null,
    "extracted_price_gte": null,
    "product_keyword": "headphones"
  },
  "computed_facets": {
    "category": {"electronics": 42, "audio": 38},
    "brand": {"audiotech": 12, "soundwave": 8},
    "color": {"black": 20, "white": 15}
  }
}`}</CodeBlock>
        </div>
      </section>

      {/* ──────────── API Reference: Aspects ──────────── */}
      <section id="aspects-api" className="mb-16 print-break-before">
        <div className="mb-10 print-avoid-break">
          <div className="flex items-center gap-2.5 mb-3">
            <MethodBadge method="POST" />
            <code className="text-lg font-mono font-medium text-slate-900">/api/xtal/aspects</code>
          </div>
          <p className="text-slate-600 mb-4">
            Generate AI-powered search aspects (dynamic facets) for a given query.
            Aspects are natural-language refinement options like &quot;noise cancelling&quot; or &quot;under $50&quot;.
          </p>

          <h4 className="text-sm font-semibold text-slate-700 mb-2">Request Body</h4>
          <FieldTable fields={[
            { name: "query", type: "string", required: true, description: "The search query text" },
            { name: "selected_aspects", type: "string[]", required: false, description: "Previously selected aspects (for context)" },
            { name: "collection", type: "string", required: false, description: "Collection identifier" },
          ]} />

          <h4 className="text-sm font-semibold text-slate-700 mt-6 mb-2">Example Request</h4>
          <CodeBlock language="json">{`POST /api/xtal/aspects
Content-Type: application/json

{
  "query": "wireless headphones",
  "collection": "willow"
}`}</CodeBlock>

          <h4 className="text-sm font-semibold text-slate-700 mt-6 mb-2">Example Response</h4>
          <CodeBlock language="json">{`{
  "aspects": [
    "noise cancelling",
    "over-ear",
    "under $100",
    "bluetooth 5.0",
    "long battery life"
  ],
  "aspects_enabled": true
}`}</CodeBlock>
        </div>
      </section>

      {/* ──────────── API Reference: Config ──────────── */}
      <section id="config-api" className="mb-16 print-break-before">
        <div className="mb-10 print-avoid-break">
          <div className="flex items-center gap-2.5 mb-3">
            <MethodBadge method="GET" />
            <code className="text-lg font-mono font-medium text-slate-900">/api/xtal/config</code>
          </div>
          <p className="text-slate-600 mb-4">
            Retrieve the configuration for a collection. Used by the JS snippet to
            configure its behavior. Cached for 5 minutes.
          </p>

          <h4 className="text-sm font-semibold text-slate-700 mb-2">Query Parameters</h4>
          <FieldTable fields={[
            { name: "shopId", type: "string", required: true, description: "Collection identifier (e.g., \"willow\")" },
          ]} />

          <h4 className="text-sm font-semibold text-slate-700 mt-6 mb-2">Example Request</h4>
          <CodeBlock language="bash">{`GET /api/xtal/config?shopId=willow`}</CodeBlock>

          <h4 className="text-sm font-semibold text-slate-700 mt-6 mb-2">Example Response</h4>
          <CodeBlock language="json">{`{
  "shopId": "willow",
  "enabled": true,
  "searchSelector": "input[type=\\"search\\"]",
  "resultsSelector": "",
  "displayMode": "overlay",
  "resultsPerPage": 48,
  "utm": {
    "source": "xtal",
    "medium": "search",
    "campaign": "willow"
  },
  "features": {
    "aspects": true,
    "explain": true
  }
}`}</CodeBlock>
        </div>
      </section>

      {/* ──────────── Data Models: Product ──────────── */}
      <section id="product-schema" className="mb-16 print-break-before">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Data Models</h2>

        <div className="mb-10 print-avoid-break">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Product</h3>
          <p className="text-slate-600 mb-4">
            Each result in the search response is a Product object with the following fields:
          </p>
          <FieldTable fields={[
            { name: "id", type: "string", required: true, description: "Unique product identifier" },
            { name: "title", type: "string", required: true, description: "Product name" },
            { name: "name", type: "string", required: true, description: "Alternate name field" },
            { name: "price", type: "number | number[]", required: true, description: "Price in dollars. Array for price ranges (e.g., variant min/max)" },
            { name: "image_url", type: "string | null", required: true, description: "Primary product image URL" },
            { name: "product_url", type: "string", required: true, description: "Link to the product detail page" },
            { name: "vendor", type: "string", required: true, description: "Brand or manufacturer name" },
            { name: "product_type", type: "string", required: true, description: "Product category (e.g., \"Headphones\")" },
            { name: "tags", type: "string[]", required: true, description: "Metadata tags used for faceting (e.g., [\"color_black\", \"brand_sony\"])" },
            { name: "description", type: "string", required: false, description: "Product description text" },
            { name: "images", type: "Image[]", required: true, description: "Array of {src, alt_text} image objects" },
            { name: "variants", type: "Variant[]", required: true, description: "Array of {price, compare_at_price} variant objects" },
            { name: "available", type: "boolean", required: true, description: "Whether the product is in stock" },
          ]} />
        </div>
      </section>

      {/* ──────────── Data Models: SearchContext ──────────── */}
      <section id="search-context" className="mb-16 print-avoid-break">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">SearchContext</h3>
        <p className="text-slate-600 mb-4">
          Returned with initial search results. Pass this back on subsequent requests (filtering, pagination)
          to avoid re-processing the query.
        </p>
        <FieldTable fields={[
          { name: "augmented_query", type: "string", required: true, description: "AI-enhanced version of the original query" },
          { name: "extracted_price_lte", type: "number | null", required: true, description: "Extracted max price from natural language (e.g., \"under $50\" → 50)" },
          { name: "extracted_price_gte", type: "number | null", required: true, description: "Extracted min price from natural language" },
          { name: "product_keyword", type: "string | null", required: false, description: "Extracted product type keyword" },
        ]} />
      </section>

      {/* ──────────── Data Models: Facets ──────────── */}
      <section id="facets" className="mb-16 print-break-before">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Facets &amp; Filtering</h3>
        <p className="text-slate-600 mb-4">
          Products are tagged with prefixed metadata (e.g., <code className="bg-slate-100 px-1 rounded font-mono text-xs">color_black</code>,{" "}
          <code className="bg-slate-100 px-1 rounded font-mono text-xs">brand_sony</code>).
          The search response groups these into <code className="bg-slate-100 px-1 rounded font-mono text-xs">computed_facets</code>,
          keyed by prefix with value counts:
        </p>
        <CodeBlock language="json">{`{
  "computed_facets": {
    "color": {"black": 20, "white": 15, "red": 8},
    "brand": {"sony": 12, "bose": 10, "apple": 7},
    "category": {"headphones": 30, "earbuds": 12}
  }
}`}</CodeBlock>
        <p className="text-sm text-slate-500 mt-3">
          To filter by facet, send <code className="bg-slate-100 px-1 rounded font-mono text-xs">facet_filters</code> in the
          search request:
        </p>
        <CodeBlock language="json">{`{
  "query": "wireless headphones",
  "search_context": { "..." : "..." },
  "facet_filters": {
    "color": ["black"],
    "brand": ["sony", "bose"]
  }
}`}</CodeBlock>
      </section>

      {/* ──────────── Configuration ──────────── */}
      <section id="collection-settings" className="mb-16 print-break-before">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Configuration</h2>

        <div className="mb-10 print-avoid-break">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Collection Settings</h3>
          <p className="text-slate-600 mb-4">
            Each integration is configured as a &quot;collection&quot; with its own settings managed by XTAL.
            These control search behavior, display, and features:
          </p>
          <FieldTable fields={[
            { name: "results_per_page", type: "number", required: false, description: "Default number of results per search (default: 48)" },
            { name: "query_enhancement_enabled", type: "boolean", required: false, description: "AI query expansion for better recall (default: true)" },
            { name: "aspects_enabled", type: "boolean", required: false, description: "AI-generated aspect suggestions (default: true)" },
            { name: "store_type", type: "string", required: false, description: "Store category for AI context (e.g., \"home goods retailer\")" },
            { name: "snippet_search_selector", type: "string", required: false, description: "CSS selector for the search input (default: input[type=\"search\"])" },
            { name: "snippet_display_mode", type: "\"overlay\" | \"fullpage\"", required: false, description: "How the JS snippet renders results" },
          ]} />
        </div>
      </section>

      {/* ──────────── UTM Tracking ──────────── */}
      <section id="utm-tracking" className="mb-10 print-avoid-break">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">UTM Tracking</h3>
        <p className="text-slate-600 mb-4">
          All product links generated by XTAL include UTM parameters for attribution tracking.
          These are appended automatically:
        </p>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 font-mono text-sm space-y-1">
          <div><span className="text-xtal-navy font-medium">utm_source</span><span className="text-slate-400">=</span>xtal</div>
          <div><span className="text-xtal-navy font-medium">utm_medium</span><span className="text-slate-400">=</span>search</div>
          <div><span className="text-xtal-navy font-medium">utm_campaign</span><span className="text-slate-400">=</span><span className="text-slate-500">{"{collection_id}"}</span></div>
          <div><span className="text-xtal-navy font-medium">utm_content</span><span className="text-slate-400">=</span><span className="text-slate-500">{"{product_id}"}</span></div>
          <div><span className="text-xtal-navy font-medium">utm_term</span><span className="text-slate-400">=</span><span className="text-slate-500">{"{search_query}"}</span></div>
        </div>
      </section>

      {/* ──────────── Features ──────────── */}
      <section id="features" className="mb-16 print-avoid-break">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Features</h3>
        <p className="text-slate-600 mb-4">
          The following features are available per collection:
        </p>
        <div className="space-y-3">
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-900">AI Aspects</h4>
            <p className="text-sm text-slate-600 mt-1">
              Generates natural-language refinement options for each query (e.g., &quot;noise cancelling&quot;, &quot;under $50&quot;).
              Displayed as clickable chips that filter results.
            </p>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-900">Explain</h4>
            <p className="text-sm text-slate-600 mt-1">
              On-demand AI explanation for why a specific product was returned for a query.
              Helps build user trust in search relevance.
            </p>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-slate-900">Query Enhancement</h4>
            <p className="text-sm text-slate-600 mt-1">
              Automatically expands queries using AI to improve recall. For example,
              &quot;comfy chair&quot; may be enhanced to include &quot;ergonomic&quot;, &quot;cushioned&quot;, &quot;lounge&quot;.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────── Next Steps ──────────── */}
      <section id="next-steps" className="mb-16 print-break-before">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Next Steps</h2>
        <div className="bg-xtal-navy/5 border border-xtal-navy/10 rounded-xl p-6">
          <p className="text-slate-700 mb-4">
            To begin your integration, we recommend:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
            <li>
              <strong>Choose an integration approach</strong> &mdash; JS snippet for quick deployment,
              or server-side API for full control.
            </li>
            <li>
              <strong>Share your platform constraints</strong> &mdash; Can you add custom script tags to the storefront?
              Do you have server-side extension points for API calls?
            </li>
            <li>
              <strong>Schedule a technical walkthrough</strong> &mdash; We&apos;ll walk through the API together and answer
              any questions about data formats, authentication, or customization.
            </li>
          </ol>
          <div className="mt-6 pt-4 border-t border-xtal-navy/10">
            <p className="text-sm text-slate-600">
              <strong>Contact:</strong>{" "}
              <a href="mailto:team@xtalsearch.com" className="text-xtal-navy hover:underline">
                team@xtalsearch.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ──────────── Footer ──────────── */}
      <div className="border-t border-slate-200 pt-6 text-sm text-slate-400 print:hidden">
        <p>XTAL Search &middot; xtalsearch.com</p>
      </div>
    </div>
  )
}

/* ──────────── Components ──────────── */

function MethodBadge({ method }: { method: "GET" | "POST" | "PUT" | "DELETE" }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700",
    POST: "bg-blue-100 text-blue-700",
    PUT: "bg-amber-100 text-amber-700",
    DELETE: "bg-red-100 text-red-700",
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono ${colors[method] || "bg-slate-100 text-slate-700"}`}>
      {method}
    </span>
  )
}

function CodeBlock({ children, language }: { children: string; language?: string }) {
  return (
    <div className="relative group print-avoid-break">
      {language && (
        <div className="absolute top-0 right-0 px-2.5 py-1 text-[10px] font-mono text-slate-500 uppercase">
          {language}
        </div>
      )}
      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm font-mono text-slate-300 leading-relaxed whitespace-pre">
          {children}
        </code>
      </pre>
    </div>
  )
}

interface FieldDef {
  name: string
  type: string
  required: boolean
  description: string
}

function FieldTable({ fields }: { fields: FieldDef[] }) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Field</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Type</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-700 w-16">Required</th>
            <th className="text-left px-4 py-2 font-semibold text-slate-700">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {fields.map((f) => (
            <tr key={f.name}>
              <td className="px-4 py-2 font-mono text-xs text-xtal-navy font-medium">{f.name}</td>
              <td className="px-4 py-2 font-mono text-xs text-slate-500">{f.type}</td>
              <td className="px-4 py-2 text-center">
                {f.required ? (
                  <span className="text-xs font-medium text-emerald-600">Yes</span>
                ) : (
                  <span className="text-xs text-slate-400">No</span>
                )}
              </td>
              <td className="px-4 py-2 text-slate-600">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
