import type { BudtenderPick, QuizAnswers } from "../quiz-types"
import QuizResultCard from "../QuizResultCard"
import QuizNav from "../QuizNav"

interface StepResultsProps {
  picks: BudtenderPick[]
  answers: QuizAnswers
  error: string | null
  onBack: () => void
  onReset: () => void
}

function humanize(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function StepResults({ picks, answers, error, onBack, onReset }: StepResultsProps) {
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-1 gap-8 h-full overflow-hidden pb-16">
        {/* Sidebar (desktop only) */}
        <div className="hidden md:block flex-shrink-0 w-40 border-r border-white/20 pr-6">
          {(answers.intent || answers.need) && (
            <>
              <div className="text-gray-300 text-sm font-medium mb-2">Usage</div>
              {answers.need && (
                <div className="text-white text-sm flex items-center gap-1 mb-1">
                  {"\u2713"} {humanize(answers.need)}
                </div>
              )}
            </>
          )}
          {answers.flavor && (
            <>
              <div className="text-gray-300 text-sm font-medium mb-2 mt-4">Flavor</div>
              <div className="text-white text-sm flex items-center gap-1 mb-1">
                {"\u2713"} {humanize(answers.flavor)}
              </div>
            </>
          )}
          {answers.type && (
            <>
              <div className="text-gray-300 text-sm font-medium mb-2 mt-4">Strain</div>
              <div className="text-white text-sm flex items-center gap-1 mb-1">
                {"\u2713"} {humanize(answers.type)}
              </div>
            </>
          )}
          {answers.potency && (
            <>
              <div className="text-gray-300 text-sm font-medium mb-2 mt-4">Potency</div>
              <div className="text-white text-sm flex items-center gap-1 mb-1">
                {"\u2713"} {humanize(answers.potency)}
              </div>
            </>
          )}
          {answers.grow && (
            <>
              <div className="text-gray-300 text-sm font-medium mb-2 mt-4">Grow</div>
              <div className="text-white text-sm flex items-center gap-1 mb-1">
                {"\u2713"} {humanize(answers.grow)}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onReset}
            className="mt-6 text-xs text-white/50 hover:text-white underline"
          >
            Start Over
          </button>
        </div>

        {/* Main results area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-8"
            style={{ fontFamily: "'Special Gothic Expanded One', Impact, 'Arial Black', sans-serif" }}
          >
            Your matches:
          </h2>

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                type="button"
                onClick={onBack}
                className="mt-3 text-sm text-[var(--bt-accent,#ffcf33)] font-medium hover:underline"
              >
                Go back and try again
              </button>
            </div>
          )}

          {!error && picks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/60 text-sm">No products matched your preferences.</p>
              <button
                type="button"
                onClick={onBack}
                className="mt-3 text-sm text-[var(--bt-accent,#ffcf33)] font-medium hover:underline"
              >
                Try different filters
              </button>
            </div>
          )}

          {picks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {picks.map((pick) => (
                <QuizResultCard key={pick.product.id} pick={pick} />
              ))}
            </div>
          )}

          {/* Mobile: start over */}
          <div className="md:hidden mt-6 text-center">
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-white/50 hover:text-white underline"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>

      <QuizNav
        onBack={onBack}
        showContinue={false}
        showBack={true}
      />
    </div>
  )
}
