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

  // Filter rail — layout
  XTAL_LAYOUT: ".xtal-layout",
  XTAL_RAIL_SLOT: ".xtal-rail-slot",
  XTAL_GRID_SLOT: ".xtal-grid-slot",
  XTAL_FILTER_RAIL: ".xtal-filter-rail",

  // Filter rail — sections & facets
  XTAL_FILTER_SECTION: ".xtal-filter-section",
  XTAL_FACET_CHECKBOX: ".xtal-facet-checkbox",
  XTAL_FACET_LABEL: ".xtal-facet-label",
  XTAL_FACET_DISABLED: ".xtal-facet-disabled",

  // Filter rail — price presets
  XTAL_PRICE_PRESETS: ".xtal-price-presets",
  XTAL_PRICE_BTN: ".xtal-price-btn",
  XTAL_PRICE_BTN_ACTIVE: ".xtal-price-btn-active",

  // Filter rail — applied chips
  XTAL_APPLIED_CHIPS: ".xtal-applied-chips",
  XTAL_CHIP: ".xtal-chip",
  XTAL_CLEAR_ALL: ".xtal-clear-all",

  // Filter rail — mobile
  XTAL_FILTER_FAB: ".xtal-filter-fab",
  XTAL_FILTER_DRAWER: ".xtal-filter-drawer",
  XTAL_DRAWER_APPLY: ".xtal-drawer-apply",
  XTAL_BACKDROP: ".xtal-backdrop",
  XTAL_SHOW_MORE: ".xtal-show-more",

  // Willow-specific selectors (from live config: searchSelector="#search_field")
  SEARCH_INPUT: "#search_field",
  SEARCH_FORM: "form",
  RESULTS_CONTAINER: "shopping-multi-view",
} as const
