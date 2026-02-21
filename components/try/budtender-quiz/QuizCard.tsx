import type { ReactNode, CSSProperties } from "react"

interface QuizCardProps {
  selected?: boolean
  onClick: () => void
  children: ReactNode
  variant?: "default" | "image" | "cta" | "inline"
  className?: string
}

const BASE_GRADIENT =
  "linear-gradient(rgb(0 0 0 / 80%), rgb(68 68 68)) padding-box, " +
  "linear-gradient(135deg, #FDF3D5 0%, rgba(200,180,94,0.75) 45%, rgba(143,135,70,0.90) 100%) border-box"

export default function QuizCard({
  selected,
  onClick,
  children,
  variant = "default",
  className = "",
}: QuizCardProps) {
  const isCta = variant === "cta"

  const style: CSSProperties = isCta
    ? {
        background: "var(--bt-accent, #ffcf33)",
        border: "none",
        borderRadius: "4px",
      }
    : {
        background: selected
          ? "rgba(255, 255, 255, 0.15)"
          : BASE_GRADIENT,
        border: "1px solid transparent",
        borderColor: selected ? "var(--bt-accent, #ffcf33)" : "transparent",
        borderRadius: "4px",
      }

  const baseClasses = [
    "flex flex-col items-center justify-center gap-2 cursor-pointer",
    "text-center transition-all duration-200",
    isCta ? "text-black font-bold" : "text-white",
    variant === "inline"
      ? "flex-row h-auto min-h-0 px-8 py-3 text-left"
      : "min-h-[120px] p-4",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button type="button" className={baseClasses} style={style} onClick={onClick}>
      {children}
    </button>
  )
}
