"use client"

import type { DomScenario } from "./StorefrontHeader"

const SCENARIOS: { id: DomScenario; label: string; selectors: string }[] = [
  {
    id: "shopify-dawn",
    label: "Shopify Dawn",
    selectors: 'input[type="search"][name="q"], .search__input, form[role="search"] input',
  },
  {
    id: "woocommerce",
    label: "WooCommerce",
    selectors: '.woocommerce-product-search .search-field, input[name="s"]',
  },
  {
    id: "bigcommerce",
    label: "BigCommerce",
    selectors: "#search_query_adv",
  },
  {
    id: "shopify-details",
    label: "Shopify Details (mobile toggle)",
    selectors: "details form input[type=\"search\"] — tests MutationObserver when <details> opens",
  },
  {
    id: "spa-delayed",
    label: "SPA Delayed (2s)",
    selectors: "Input injected after 2s delay — tests MutationObserver",
  },
  {
    id: "angular-ngsubmit",
    label: "Angular ng-submit (Willow)",
    selectors: '#search_field — bubble-phase submit handler simulates Angular ng-submit canary',
  },
  {
    id: "generic",
    label: "Generic / Minimal",
    selectors: 'input.search-input[type="text"]',
  },
]

interface Props {
  scenario: DomScenario
  onScenarioChange: (s: DomScenario) => void
}

export default function DomScenarioPanel({ scenario, onScenarioChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 mb-2">
        Switch the search input DOM pattern in the header to test different e-commerce platforms.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => onScenarioChange(s.id)}
            className="text-left px-3 py-2 rounded border transition-colors"
            style={{
              borderColor: scenario === s.id ? "#818cf8" : "#333",
              background: scenario === s.id ? "#2d2d4f" : "#252535",
            }}
          >
            <div className="text-xs font-semibold" style={{ color: scenario === s.id ? "#818cf8" : "#e2e8f0" }}>
              {s.label}
            </div>
            <div className="text-[10px] mt-0.5 break-all" style={{ color: "#64748b" }}>
              {s.selectors}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
