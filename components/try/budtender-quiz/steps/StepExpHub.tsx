import type { QuizStep } from "../quiz-types"
import { EXP_HUB_OPTIONS } from "../quiz-data"
import QuizNav from "../QuizNav"

interface StepExpHubProps {
  visitedSteps: Set<string>
  onSelectCategory: (step: QuizStep) => void
  onBack: () => void
}

export default function StepExpHub({ visitedSteps, onSelectCategory, onBack }: StepExpHubProps) {
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col flex-1 justify-start mt-[20%] md:mt-0">
        <div className="text-left w-full">
          <h2
            className="text-2xl md:text-5xl font-bold text-white mb-0"
            style={{ fontFamily: "'Special Gothic Expanded One', Impact, 'Arial Black', sans-serif" }}
          >
            You know the drill.
          </h2>
        </div>
        <p className="text-white text-lg mt-4 text-center md:mt-[10%]">
          Where would you like to start?
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6 md:mt-[10%]">
          {EXP_HUB_OPTIONS.map((opt) => {
            const visited = visitedSteps.has(opt.step)
            return (
              <button
                key={opt.step}
                type="button"
                onClick={() => onSelectCategory(opt.step)}
                className={`flex items-center justify-center p-4 md:px-12 md:py-8 border rounded text-white text-sm font-bold uppercase transition-all ${
                  visited
                    ? "bg-[rgba(255,193,7,0.1)] border-[var(--bt-accent,#ffcf33)]"
                    : "bg-transparent border-[var(--bt-accent,#ffcf33)]"
                }`}
                style={{
                  fontFamily: "'Special Gothic Expanded One', Impact, 'Arial Black', sans-serif",
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <QuizNav onBack={onBack} showContinue={false} />
    </div>
  )
}
