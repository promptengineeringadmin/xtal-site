/** Shared DOM selectors for SDK elements and Willow merchant site */
export const SELECTORS = {
  // SDK-injected elements
  XTAL_GRID: ".xtal-grid",
  XTAL_CARD: ".xtal-card",
  XTAL_CARD_TITLE: ".xtal-card-title",
  XTAL_CARD_PRICE: ".xtal-card-price",
  XTAL_CARD_IMAGE: ".xtal-card-image",
  XTAL_CARD_VENDOR: ".xtal-card-vendor",
  XTAL_LOADING: ".xtal-loading",
  XTAL_SPINNER: ".xtal-spinner",
  XTAL_EMPTY: ".xtal-empty",
  XTAL_CARD_STYLES: "#xtal-card-styles",
  XTAL_KEYFRAMES: "#xtal-inline-keyframes",

  // Template card selectors (Willow uses .product-card from template CSS)
  XTAL_TPL_CARD: ".product-card",
  XTAL_ACTION_VIEW: '[data-xtal-action="view-product"]',
  XTAL_ACTION_ATC: '[data-xtal-action="add-to-cart"]',

  // Willow-specific selectors (from live config: searchSelector="#search_field")
  SEARCH_INPUT: "#search_field",
  SEARCH_FORM: "form",
  RESULTS_CONTAINER: "shopping-multi-view",
} as const
