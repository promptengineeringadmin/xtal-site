import type { BudtenderPick } from "./quiz-types"
import { STRAIN_COLORS } from "./quiz-data"

interface QuizResultCardProps {
  pick: BudtenderPick
}

function getStrainInfo(tags: string[]): { label: string; bg: string; text: string } | null {
  const strainTag = tags.find((t) => t.startsWith("strain-type_"))
  if (!strainTag) return null
  const value = strainTag.replace("strain-type_", "")
  const colors = STRAIN_COLORS[value] || { bg: "#333", text: "#fff" }
  return {
    label: value.replace(/-/g, " ").toUpperCase(),
    ...colors,
  }
}

function getThca(tags: string[]): string | null {
  // Look for a THCA tag like "thca_26.8" or in product_type
  const thcaTag = tags.find((t) => t.toLowerCase().startsWith("thca_"))
  if (thcaTag) return thcaTag.replace(/thca_/i, "")
  return null
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export default function QuizResultCard({ pick }: QuizResultCardProps) {
  const { product } = pick
  const strain = getStrainInfo(product.tags)
  const thca = getThca(product.tags)

  return (
    <div className="bg-white rounded-lg overflow-hidden flex flex-col h-[55vh] md:h-auto">
      {/* Eyebrow: name + badges */}
      <div className="flex items-start justify-between p-3 gap-2">
        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-black leading-tight hover:underline line-clamp-2"
        >
          {product.title}
        </a>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {strain && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ backgroundColor: strain.bg, color: strain.text }}
            >
              {strain.label}
            </span>
          )}
          {thca && (
            <span className="text-[10px] font-semibold text-gray-500">
              THCA {thca}%
            </span>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">
            {"\u{1F33F}"}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-black">
            {formatPrice(product.price)}
          </span>
        </div>
        {product.product_type && (
          <div className="text-xs text-gray-500 uppercase mt-1">
            {product.product_type}
          </div>
        )}

        {/* View Product link (instead of Add to Cart) */}
        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-3 w-full py-2.5 bg-[var(--bt-accent,#ffcf33)] text-black text-center text-sm font-extrabold uppercase rounded hover:bg-[var(--bt-gold,#FFC626)] transition-colors"
        >
          View Product
        </a>
      </div>
    </div>
  )
}
