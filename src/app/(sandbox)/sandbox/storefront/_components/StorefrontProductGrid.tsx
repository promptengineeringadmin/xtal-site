"use client"

import type { Product } from "@/lib/xtal-types"

function formatPrice(price: number | number[]): string {
  if (Array.isArray(price)) {
    const sorted = [...price].sort((a, b) => a - b)
    if (sorted.length === 0) return "N/A"
    if (sorted.length === 1 || sorted[0] === sorted[sorted.length - 1]) {
      return `$${sorted[0].toFixed(2)}`
    }
    return `$${sorted[0].toFixed(2)} – $${sorted[sorted.length - 1].toFixed(2)}`
  }
  return `$${price.toFixed(2)}`
}

interface Props {
  products: Product[]
}

export default function StorefrontProductGrid({ products }: Props) {
  if (products.length === 0) {
    return (
      <section id="products" className="py-16 px-6 text-center" style={{ color: "#4A4A4A", fontFamily: "var(--font-body)" }}>
        <p>No products available. Check that the backend is running.</p>
      </section>
    )
  }

  return (
    <section id="products" className="py-12 px-6 max-w-7xl mx-auto">
      <h2
        className="text-3xl mb-8"
        style={{ fontFamily: "var(--font-heading)", color: "#1A1A1A" }}
      >
        Bestsellers
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => {
          const imageUrl =
            product.image_url || product.featured_image || product.images?.[0]?.src
          return (
            <a
              key={product.id}
              href={product.product_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              {/* Image */}
              <div
                className="aspect-square overflow-hidden mb-3"
                style={{ background: "#F7F6F3" }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: "#8B7D6B" }}>
                    No image
                  </div>
                )}
              </div>

              {/* Details */}
              <div style={{ fontFamily: "var(--font-body)" }}>
                {product.vendor && (
                  <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#8B7D6B" }}>
                    {product.vendor}
                  </p>
                )}
                <h3
                  className="text-sm font-medium line-clamp-2 leading-snug mb-1"
                  style={{ color: "#1A1A1A" }}
                >
                  {product.title}
                </h3>
                <p className="text-sm font-semibold" style={{ color: "#2C2C2C" }}>
                  {formatPrice(product.price)}
                </p>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
