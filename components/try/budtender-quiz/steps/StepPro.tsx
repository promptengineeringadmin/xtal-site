import QuizNav from "../QuizNav"

interface StepProProps {
  onOpenProSearch: () => void
  onBack: () => void
}

export default function StepPro({ onOpenProSearch, onBack }: StepProProps) {
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col flex-1 justify-start">
        <div className="text-left w-full">
          <h2
            className="text-2xl md:text-5xl font-bold text-white mb-0"
            style={{ fontFamily: "'Special Gothic Expanded One', Impact, 'Arial Black', sans-serif" }}
          >
            Pro mode unlocked.
          </h2>
        </div>
        <div className="mt-[20%] md:mt-[50%] max-w-[600px] text-center w-full">
          <p className="text-white text-lg md:text-xl leading-relaxed">
            We&rsquo;re sending you right to the front of the line. Continue to view our
            pro-tailored search experience.
          </p>
          <button
            type="button"
            onClick={onOpenProSearch}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 border border-[var(--bt-accent,#ffcf33)] rounded text-white text-sm font-bold uppercase hover:bg-[var(--bt-accent,#ffcf33)] hover:text-black transition-all"
          >
            Open Pro Search
            <span className="text-lg">{"\u2299"}</span>
          </button>
        </div>
      </div>

      <QuizNav onBack={onBack} showContinue={false} />
    </div>
  )
}
