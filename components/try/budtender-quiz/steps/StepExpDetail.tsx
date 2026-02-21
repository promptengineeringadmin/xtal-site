import type { QuizStep } from "../quiz-types"
import type { CardOption } from "../quiz-data"
import {
  STRAIN_OPTIONS,
  GROW_OPTIONS,
  POTENCY_OPTIONS,
  FLAVOR_OPTIONS,
} from "../quiz-data"
import QuizCard from "../QuizCard"
import QuizNav from "../QuizNav"
import LeafIcon from "../LeafIcon"

type ExpDetailStep = "exp-grow" | "exp-strain" | "exp-potency" | "exp-flavor"

interface StepExpDetailProps {
  subStep: ExpDetailStep
  selectedValue: string | null
  visitedCount: number
  onSelect: (key: string, value: string) => void
  onContinue: (currentStep: string) => void
  onBack: () => void
  onSkip: () => void
}

function getStepConfig(subStep: ExpDetailStep): {
  heading: string
  key: string
  options: CardOption[]
  gridCols: string
  variant: "default" | "image"
  showLeafPotency: boolean
} {
  switch (subStep) {
    case "exp-grow":
      return {
        heading: "Pick your grow style",
        key: "grow",
        options: GROW_OPTIONS,
        gridCols: "grid-cols-2 md:grid-cols-3",
        variant: "image",
        showLeafPotency: false,
      }
    case "exp-strain":
      return {
        heading: "What\u2019s your mood?",
        key: "type",
        options: STRAIN_OPTIONS,
        gridCols: "grid-cols-2 md:grid-cols-3",
        variant: "image",
        showLeafPotency: false,
      }
    case "exp-potency":
      return {
        heading: "Pinpoint your potency",
        key: "potency",
        options: POTENCY_OPTIONS,
        gridCols: "grid-cols-1 md:grid-cols-3",
        variant: "default",
        showLeafPotency: true,
      }
    case "exp-flavor":
      return {
        heading: "Find Flavors & Aromatics",
        key: "flavor",
        options: FLAVOR_OPTIONS,
        gridCols: "grid-cols-2",
        variant: "default",
        showLeafPotency: false,
      }
  }
}

function PotencyLeaves({ count }: { count: number }) {
  return (
    <div className="flex gap-2 mb-2">
      {Array.from({ length: count }).map((_, i) => (
        <LeafIcon key={i} size={32} fill="white" />
      ))}
    </div>
  )
}

export default function StepExpDetail({
  subStep,
  selectedValue,
  visitedCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: StepExpDetailProps) {
  const config = getStepConfig(subStep)
  const isLast = visitedCount + 1 >= 4

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col flex-1 pb-16">
        <div className="text-left w-full">
          <h2
            className="text-xl md:text-5xl font-bold text-white mb-6 border-t border-b border-white py-2 md:py-4"
            style={{ fontFamily: "'Special Gothic Expanded One', Impact, 'Arial Black', sans-serif" }}
          >
            {config.heading}
          </h2>
        </div>

        <div className="flex flex-col flex-1 justify-start w-full">
          <div className={`grid ${config.gridCols} gap-4 w-full h-full`}>
            {config.options.map((opt, idx) => (
              <QuizCard
                key={opt.value}
                selected={selectedValue === opt.value}
                onClick={() => onSelect(config.key, opt.value)}
                className={`justify-${config.variant === "image" ? "end" : "center"} ${
                  config.variant === "image" ? "min-h-[150px] md:min-h-[250px]" : ""
                }`}
              >
                {/* Image placeholder for strain/grow */}
                {config.variant === "image" && opt.placeholderColor && (
                  <div
                    className="w-full h-24 md:h-40 rounded mb-2 flex items-center justify-center"
                    style={{ backgroundColor: opt.placeholderColor }}
                  >
                    <LeafIcon size={48} fill="rgba(255,255,255,0.3)" />
                  </div>
                )}

                {/* Potency leaf indicators */}
                {config.showLeafPotency && <PotencyLeaves count={idx + 1} />}

                {/* Emoji for flavor */}
                {opt.emoji && <span className="text-3xl mb-1">{opt.emoji}</span>}

                <span
                  className="text-white text-base font-semibold capitalize"
                  style={{ fontFamily: "'ProximaNova', Helvetica, Arial, sans-serif" }}
                >
                  {opt.label}
                </span>

                {opt.description && (
                  <span className="text-white/70 text-xs md:text-sm leading-tight mt-1">
                    {opt.description}
                  </span>
                )}
              </QuizCard>
            ))}
          </div>
        </div>
      </div>

      <QuizNav
        onBack={onBack}
        onContinue={() => onContinue(subStep)}
        onSkip={onSkip}
        canContinue={selectedValue !== null}
        currentDot={visitedCount}
        totalDots={4}
        continueLabel={isLast ? "See Matches" : "Continue"}
      />
    </div>
  )
}
