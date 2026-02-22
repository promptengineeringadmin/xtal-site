import type { QuizStep } from "../quiz-types"
import type { CardOption } from "../quiz-data"
import {
  RELIEF_OPTIONS,
  ACTIVITY_OPTIONS,
  FLAVOR_OPTIONS,
} from "../quiz-data"
import QuizCard from "../QuizCard"
import QuizNav from "../QuizNav"

type BeginnerSubStep = "beginner-1" | "beginner-relief" | "beginner-activities" | "beginner-flavor"

interface StepBeginnerPathProps {
  subStep: BeginnerSubStep
  selectedValue: string | null
  onSelect: (key: string, value: string, nextStep: QuizStep | null) => void
  onContinue: () => void
  onBack: () => void
  onSkip?: (dest: QuizStep) => void
}

function getStepConfig(subStep: BeginnerSubStep): {
  heading: string
  key: string
  options: CardOption[]
  autoAdvanceStep: QuizStep | null
  dotIndex: number
  skippable: boolean
  skipDest?: QuizStep
  gridCols: string
} {
  switch (subStep) {
    case "beginner-1":
      return {
        heading: "Welcome in! Let\u2019s point you in the right direction.",
        key: "intent",
        options: [
          { value: "relief", label: "Relief" },
          { value: "activities", label: "Activities" },
        ],
        autoAdvanceStep: null, // set dynamically based on value
        dotIndex: 0,
        skippable: false,
        gridCols: "grid-cols-1",
      }
    case "beginner-relief":
      return {
        heading: "Which type of relief do you need?",
        key: "need",
        options: RELIEF_OPTIONS,
        autoAdvanceStep: "beginner-flavor",
        dotIndex: 1,
        skippable: true,
        skipDest: "beginner-flavor",
        gridCols: "grid-cols-2",
      }
    case "beginner-activities":
      return {
        heading: "Which activity do you want to enhance?",
        key: "need",
        options: ACTIVITY_OPTIONS,
        autoAdvanceStep: "beginner-flavor",
        dotIndex: 1,
        skippable: true,
        skipDest: "beginner-flavor",
        gridCols: "grid-cols-2",
      }
    case "beginner-flavor":
      return {
        heading: "Do you have an aromatic preference?",
        key: "flavor",
        options: FLAVOR_OPTIONS,
        autoAdvanceStep: "loading",
        dotIndex: 2,
        skippable: true,
        skipDest: "loading",
        gridCols: "grid-cols-2",
      }
  }
}

export default function StepBeginnerPath({
  subStep,
  selectedValue,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: StepBeginnerPathProps) {
  const config = getStepConfig(subStep)

  function handleCardClick(option: CardOption) {
    let nextStep = config.autoAdvanceStep

    // Special case: beginner-1 routes based on selection
    if (subStep === "beginner-1") {
      nextStep = option.value === "relief" ? "beginner-relief" : "beginner-activities"
    }

    onSelect(config.key, option.value, nextStep)

    // Auto-advance for beginner flow
    if (nextStep !== null) {
      setTimeout(() => onContinue(), 0)
    }
  }

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

          {subStep === "beginner-1" && (
            <p className="text-white text-lg mb-4 text-center">
              What kind of help are you looking for?
            </p>
          )}
        </div>

        <div className="flex flex-col flex-1 justify-start w-full">
          <div className={`grid ${config.gridCols} gap-3 w-full`}>
            {config.options.map((opt) => (
              <QuizCard
                key={opt.value}
                selected={selectedValue === opt.value}
                onClick={() => handleCardClick(opt)}
                className="justify-start min-h-0 py-3"
              >
                {opt.emoji && (
                  <span className="text-3xl mb-1">{opt.emoji}</span>
                )}
                <span
                  className="text-white text-base font-semibold capitalize"
                  style={{ fontFamily: "'ProximaNova', Helvetica, Arial, sans-serif" }}
                >
                  {opt.label}
                </span>
              </QuizCard>
            ))}
          </div>
        </div>
      </div>

      <QuizNav
        onBack={onBack}
        onContinue={onContinue}
        onSkip={config.skippable && onSkip ? () => onSkip(config.skipDest!) : undefined}
        canContinue={selectedValue !== null}
        currentDot={config.dotIndex}
        totalDots={3}
      />
    </div>
  )
}
