/** Canned API responses for deterministic tests */

export const MOCK_CONFIG = {
  enabled: true,
  searchSelector: "#search_field",
  displayMode: "inline",
  resultsSelector: "shopping-multi-view",
  siteUrl: "https://www.willowgroupltd.com",
  features: { aspects: false, explain: false },
  cardTemplate: {
    html: `<div class="product-card" data-xtal-action="view-product">
      <div class="product-image"><img src="{{image_url}}" alt="{{title}}" loading="lazy" /></div>
      <div class="product-name">{{title}}</div>
      <div class="product-price-row"><div class="product-price"><span>\${{price}}</span></div></div>
      <button class="product-cta" data-xtal-action="add-to-cart">Add To Cart</button>
    </div>`,
    css: `.xtal-grid { display: flex; flex-wrap: wrap; gap: 32px; padding: 20px 0 40px 32px; }
.product-card { width: calc((100% - 64px) / 3); cursor: pointer; }
.product-image { width: 100%; aspect-ratio: 1; background: #f0eeea; }
.product-image img { width: 100%; height: 100%; object-fit: contain; }
.product-name { font-size: 16px; font-weight: 600; }
.product-price { font-size: 14px; }
.product-cta { display: block; width: 100%; padding: 10px 0; background: #1d1d1b; color: #fff; border: none; cursor: pointer; }`,
  },
}

export const MOCK_CONFIG_DISABLED = {
  ...MOCK_CONFIG,
  enabled: false,
}

export const MOCK_CONFIG_NO_TEMPLATE = {
  ...MOCK_CONFIG,
  cardTemplate: undefined,
}

export const MOCK_CONFIG_WITH_URL_PATTERN = {
  ...MOCK_CONFIG,
  productUrlPattern: "https://www.willowgroupltd.com/product/{sku}",
}

export const MOCK_SEARCH_RESULTS = {
  results: [
    {
      id: "mock-1",
      title: "Wicker Basket Large",
      name: "Wicker Basket Large",
      price: 29.99,
      image_url: "https://via.placeholder.com/300x300?text=Basket1",
      product_url: "/shop/wicker-basket-large",
      vendor: "Willow Group",
      product_type: "Baskets",
      tags: ["wicker", "large", "dimensions:15 L x 10 W x 8 H"],
      variants: [{ price: 29.99, sku: "WBL-001", inventory_quantity: 10 }],
    },
    {
      id: "mock-2",
      title: "Round Storage Basket",
      name: "Round Storage Basket",
      price: 19.99,
      image_url: "https://via.placeholder.com/300x300?text=Basket2",
      product_url: "/shop/round-storage-basket",
      vendor: "Willow Group",
      product_type: "Baskets",
      tags: ["storage", "round"],
      variants: [{ price: 19.99, sku: "RSB-002", inventory_quantity: 5 }],
    },
    {
      id: "mock-3",
      title: "Bamboo Hamper",
      name: "Bamboo Hamper",
      price: 45.0,
      image_url: "https://via.placeholder.com/300x300?text=Hamper",
      product_url: "/shop/bamboo-hamper",
      vendor: "Willow Group",
      product_type: "Hampers",
      tags: ["bamboo", "hamper"],
      variants: [{ price: 45.0, sku: "BH-003", inventory_quantity: 3 }],
    },
  ],
  total: 3,
  query_time: 0.12,
  aspects: [],
  aspects_enabled: false,
}

export const MOCK_SEARCH_EMPTY = {
  results: [],
  total: 0,
  query_time: 0.05,
  aspects: [],
  aspects_enabled: false,
}

export const MOCK_PRODUCT_MISSING_FIELDS = {
  results: [
    {
      id: "sparse-1",
      title: "Mystery Item",
      name: "Mystery Item",
      price: 9.99,
      image_url: "",
      product_url: "",
      vendor: "",
      product_type: "",
      tags: [],
      variants: [],
    },
  ],
  total: 1,
  query_time: 0.03,
  aspects: [],
  aspects_enabled: false,
}
