interface QuizNavProps {
  onBack: () => void
  onContinue?: () => void
  onSkip?: () => void
  canContinue?: boolean
  currentDot?: number
  totalDots?: number
  continueLabel?: string
  showBack?: boolean
  showContinue?: boolean
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.99984 13.3334C10.9454 13.3334 13.3332 10.9456 13.3332 8.00008C13.3332 5.05456 10.9454 2.66675 7.99984 2.66675C5.05432 2.66675 2.66651 5.05456 2.66651 8.00008C2.6665 10.9456 5.05432 13.3334 7.99984 13.3334ZM14.6665 8.00008C14.6665 11.682 11.6817 14.6667 7.99984 14.6667C4.31794 14.6667 1.33317 11.682 1.33317 8.00008C1.33317 4.31818 4.31794 1.33342 7.99984 1.33342C11.6817 1.33342 14.6665 4.31819 14.6665 8.00008Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.13823 10.4715C8.87788 10.7318 8.45577 10.7318 8.19542 10.4715L6.19543 8.47149C5.93508 8.21114 5.93508 7.78903 6.19543 7.52868L8.19543 5.52868C8.45577 5.26833 8.87788 5.26833 9.13823 5.52868C9.39858 5.78903 9.39858 6.21114 9.13823 6.47149L7.60964 8.00008L9.13823 9.52868C9.39858 9.78903 9.39858 10.2111 9.13823 10.4715Z"
        fill="white"
      />
    </svg>
  )
}

function ForwardArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.99967 2.66659C5.05416 2.66659 2.66634 5.0544 2.66634 7.99992C2.66634 10.9454 5.05416 13.3333 7.99967 13.3333C10.9452 13.3333 13.333 10.9454 13.333 7.99992C13.333 5.0544 10.9452 2.66659 7.99967 2.66659ZM1.33301 7.99992C1.33301 4.31802 4.31778 1.33325 7.99967 1.33325C11.6816 1.33325 14.6663 4.31802 14.6663 7.99992C14.6663 11.6818 11.6816 14.6666 7.99967 14.6666C4.31778 14.6666 1.33301 11.6818 1.33301 7.99992Z"
        fill="black"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.86225 5.52851C7.1226 5.26816 7.54471 5.26816 7.80506 5.52851L9.80506 7.52851C10.0654 7.78886 10.0654 8.21097 9.80506 8.47132L7.80506 10.4713C7.54471 10.7317 7.1226 10.7317 6.86225 10.4713C6.6019 10.211 6.6019 9.78886 6.86225 9.52851L8.39085 7.99992L6.86225 6.47132C6.6019 6.21097 6.6019 5.78886 6.86225 5.52851Z"
        fill="black"
      />
    </svg>
  )
}

export default function QuizNav({
  onBack,
  onContinue,
  onSkip,
  canContinue = false,
  currentDot,
  totalDots,
  continueLabel = "Continue",
  showBack = true,
  showContinue = true,
}: QuizNavProps) {
  return (
    <div className="flex items-center justify-between absolute bottom-0 left-0 right-0 p-0 md:p-4 md:h-20 z-20">
      {/* Left: Back */}
      <div className="flex-shrink-0 w-auto md:w-[120px]">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--bt-accent,#ffcf33)] rounded text-white text-sm font-bold uppercase hover:bg-[var(--bt-accent,#ffcf33)] hover:text-black transition-all"
          >
            <BackArrowIcon />
            Back
          </button>
        )}
      </div>

      {/* Center: Dots */}
      <div className="flex-1 flex items-center justify-center">
        {totalDots != null && totalDots > 0 && (
          <div className="flex gap-2">
            {Array.from({ length: totalDots }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-sm transition-colors duration-300 ${
                  i === currentDot
                    ? "bg-[var(--bt-accent,#ffcf33)]"
                    : "bg-white/20"
                }`}
                style={{ width: typeof window !== "undefined" && window.innerWidth >= 768 ? 32 : 4 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right: Skip + Continue */}
      <div className="flex items-center gap-0 md:gap-4 flex-shrink-0 min-w-0 md:min-w-[120px] justify-end">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="hidden md:block bg-transparent border-none text-white/60 text-xs cursor-pointer hover:text-white hover:underline transition-colors"
          >
            Skip this question
          </button>
        )}
        {showContinue && onContinue && (
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className={`flex items-center gap-1 px-5 py-2.5 rounded text-sm font-extrabold uppercase transition-opacity ${
              canContinue
                ? "bg-[var(--bt-accent,#ffcf33)] text-black cursor-pointer hover:bg-[var(--bt-gold,#FFC626)]"
                : "bg-[#957b1f] text-[#705400] cursor-not-allowed opacity-50"
            }`}
          >
            {continueLabel}
            <ForwardArrowIcon />
          </button>
        )}
      </div>
    </div>
  )
}
