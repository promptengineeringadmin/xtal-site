"use client"

import { Search, User, ShoppingBag } from "lucide-react"

export type DomScenario =
  | "shopify-dawn"
  | "woocommerce"
  | "bigcommerce"
  | "shopify-details"
  | "spa-delayed"
  | "angular-ngsubmit"
  | "generic"

interface Props {
  scenario: DomScenario
}

export default function StorefrontHeader({ scenario }: Props) {
  return (
    <>
      {/* Promo bar */}
      <div
        className="text-center text-xs tracking-wider py-2"
        style={{
          background: "#2C2C2C",
          color: "#FFFFFF",
          fontFamily: "var(--font-body)",
        }}
      >
        FREE SHIPPING ON ORDERS OVER $500
      </div>

      {/* Main header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{
          borderColor: "#E5E2DC",
          fontFamily: "var(--font-body)",
        }}
      >
        {/* Logo */}
        <div
          className="text-2xl tracking-wide"
          style={{ fontFamily: "var(--font-heading)", color: "#1A1A1A" }}
        >
          Willow Group
        </div>

        {/* Nav */}
        <nav className="hidden md:flex gap-8 text-sm font-medium" style={{ color: "#4A4A4A" }}>
          {["Display", "Packaging", "Decor", "Garden & Floral", "Seasonal"].map((item) => (
            <a
              key={item}
              href="#"
              className="hover:opacity-70 transition-opacity"
              onClick={(e) => e.preventDefault()}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Right: search + icons */}
        <div className="flex items-center gap-4">
          <SearchInput scenario={scenario} />
          <button className="text-[#4A4A4A] hover:text-[#1A1A1A]">
            <User size={20} />
          </button>
          <button className="text-[#4A4A4A] hover:text-[#1A1A1A]">
            <ShoppingBag size={20} />
          </button>
        </div>
      </header>
    </>
  )
}

function SearchInput({ scenario }: { scenario: DomScenario }) {
  switch (scenario) {
    case "shopify-dawn":
      return (
        <form role="search" action="/search" method="get">
          <div className="search__input relative">
            <input
              type="search"
              name="q"
              placeholder="Search products..."
              className="border rounded-md pl-9 pr-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-[#8B7D6B]"
              style={{ borderColor: "#E5E2DC" }}
            />
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7D6B]"
            />
          </div>
        </form>
      )

    case "woocommerce":
      return (
        <form
          role="search"
          method="get"
          className="woocommerce-product-search"
          action="/search"
        >
          <div className="relative">
            <input
              type="search"
              name="s"
              className="search-field border rounded-md pl-9 pr-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-[#8B7D6B]"
              placeholder="Search products..."
              style={{ borderColor: "#E5E2DC" }}
            />
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7D6B]"
            />
          </div>
        </form>
      )

    case "bigcommerce":
      return (
        <form action="/search" method="get">
          <div className="relative">
            <input
              type="text"
              id="search_query_adv"
              name="search_query"
              placeholder="Search products..."
              className="border rounded-md pl-9 pr-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-[#8B7D6B]"
              style={{ borderColor: "#E5E2DC" }}
            />
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7D6B]"
            />
          </div>
        </form>
      )

    case "shopify-details":
      return <DetailsSearch />

    case "spa-delayed":
      return <DelayedSearch />

    case "angular-ngsubmit":
      return <AngularNgSubmitSearch />

    case "generic":
    default:
      return (
        <form action="/search" method="get">
          <div className="relative">
            <input
              type="text"
              className="search-input border rounded-md pl-9 pr-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-[#8B7D6B]"
              placeholder="Search products..."
              style={{ borderColor: "#E5E2DC" }}
            />
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7D6B]"
            />
          </div>
        </form>
      )
  }
}

function AngularNgSubmitSearch() {
  // Simulate Angular's ng-submit: a bubble-phase submit listener that navigates away.
  // If the SDK's capture-phase fix works, this handler never fires.
  const formRef = (form: HTMLFormElement | null) => {
    if (!form) return
    const handler = () => {
      // Canary: if this runs, Angular would have won the race
      window.location.href = window.location.pathname + "?angular-leaked=true"
    }
    form.addEventListener("submit", handler) // bubble phase — should lose to SDK's capture
  }

  return (
    <form ref={formRef} action="/search" method="get">
      <div className="relative flex items-center gap-2">
        <input
          type="text"
          id="search_field"
          name="q"
          placeholder="Search products..."
          className="border rounded-md pl-9 pr-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-[#8B7D6B]"
          style={{ borderColor: "#E5E2DC" }}
        />
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7D6B]"
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
          style={{ borderColor: "#E5E2DC", color: "#4A4A4A" }}
        >
          Submit
        </button>
      </div>
    </form>
  )
}

function DetailsSearch() {
  return (
    <details className="relative">
      <summary className="cursor-pointer text-[#4A4A4A] hover:text-[#1A1A1A]">
        <Search size={20} />
      </summary>
      <div className="absolute right-0 top-full mt-2 z-10">
        <form role="search" action="/search" method="get">
          <input
            type="search"
            name="q"
            placeholder="Search products..."
            className="border rounded-md pl-3 pr-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-[#8B7D6B] shadow-md"
            style={{ borderColor: "#E5E2DC", background: "#fff" }}
          />
        </form>
      </div>
    </details>
  )
}

function DelayedSearch() {
  return <DelayedSearchInner />
}

function DelayedSearchInner() {
  const containerId = "spa-search-container"

  // Inject the search input after 2s delay (client-side only)
  if (typeof window !== "undefined") {
    setTimeout(() => {
      const container = document.getElementById(containerId)
      if (container && !container.querySelector("input")) {
        const form = document.createElement("form")
        form.action = "/search"
        form.method = "get"
        form.role = "search"
        const wrapper = document.createElement("div")
        wrapper.className = "relative"
        const input = document.createElement("input")
        input.type = "search"
        input.name = "q"
        input.placeholder = "Search products..."
        input.className =
          "search-input border rounded-md pl-3 pr-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-[#8B7D6B]"
        input.style.borderColor = "#E5E2DC"
        wrapper.appendChild(input)
        form.appendChild(wrapper)
        container.appendChild(form)
      }
    }, 2000)
  }

  return (
    <div id={containerId} className="min-w-[200px] h-8 flex items-center">
      <span className="text-xs text-[#8B7D6B] italic">Loading search...</span>
    </div>
  )
}
