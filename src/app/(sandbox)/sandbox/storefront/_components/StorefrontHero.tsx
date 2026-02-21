"use client"

export default function StorefrontHero() {
  return (
    <section
      className="py-20 px-6 text-center"
      style={{ background: "#F7F6F3" }}
    >
      <h1
        className="text-5xl md:text-6xl mb-4"
        style={{ fontFamily: "var(--font-heading)", color: "#1A1A1A" }}
      >
        Curated Wholesale Goods
      </h1>
      <p
        className="text-lg mb-8 max-w-xl mx-auto"
        style={{ fontFamily: "var(--font-body)", color: "#4A4A4A" }}
      >
        Discover quality display, packaging, and decor products for your retail space.
      </p>
      <a
        href="#products"
        className="inline-block px-8 py-3 text-sm font-semibold tracking-wider uppercase transition-colors"
        style={{
          background: "#2C2C2C",
          color: "#FFFFFF",
          fontFamily: "var(--font-body)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#4A4A4A")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#2C2C2C")}
      >
        Shop Bestsellers
      </a>
    </section>
  )
}
