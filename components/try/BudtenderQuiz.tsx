"use client"

import { useReducer, useEffect, useCallback, useRef } from "react"
import type {
  QuizState,
  QuizAction,
  QuizStep,
  ExperienceLevel,
  BudtenderPick,
} from "./budtender-quiz/quiz-types"
import { INITIAL_STATE, EXP_STEPS_POOL } from "./budtender-quiz/quiz-types"
import { quizAnswersToApiBody } from "@/lib/budtender/quiz-to-api"

import StepIntro from "./budtender-quiz/steps/StepIntro"
import StepExperience from "./budtender-quiz/steps/StepExperience"
import StepBeginnerPath from "./budtender-quiz/steps/StepBeginnerPath"
import StepExpHub from "./budtender-quiz/steps/StepExpHub"
import StepExpDetail from "./budtender-quiz/steps/StepExpDetail"
import StepPro from "./budtender-quiz/steps/StepPro"
import StepLoading from "./budtender-quiz/steps/StepLoading"
import StepResults from "./budtender-quiz/steps/StepResults"

// --- Reducer ---

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "GO_TO_STEP":
      return {
        ...state,
        history: [...state.history, state.currentStep],
        currentStep: action.step,
        selectedKey: null,
        selectedValue: null,
        selectedNext: null,
      }

    case "SET_EXPERIENCE": {
      const nextStep: QuizStep =
        action.level === "beginner"
          ? "beginner-1"
          : action.level === "experienced"
          ? "exp-hub"
          : "pro-landing"
      return {
        ...state,
        history: [...state.history, state.currentStep],
        currentStep: nextStep,
        answers: { experience: action.level },
        visitedExpSteps: new Set<string>(),
        selectedKey: null,
        selectedValue: null,
        selectedNext: null,
      }
    }

    case "SELECT_OPTION":
      return {
        ...state,
        selectedKey: action.key,
        selectedValue: action.value,
        selectedNext: action.nextStep,
      }

    case "CONTINUE": {
      if (!state.selectedKey) return state
      const newAnswers = {
        ...state.answers,
        [state.selectedKey]: state.selectedValue,
      }
      const dest = state.selectedNext
      if (!dest) return { ...state, answers: newAnswers }
      return {
        ...state,
        history: [...state.history, state.currentStep],
        currentStep: dest,
        answers: newAnswers,
        selectedKey: null,
        selectedValue: null,
        selectedNext: null,
      }
    }

    case "BACK": {
      if (state.history.length === 0) return state
      const prev = state.history[state.history.length - 1]
      const newHistory = state.history.slice(0, -1)
      const newVisited = new Set(state.visitedExpSteps)
      newVisited.delete(prev)
      return {
        ...state,
        currentStep: prev,
        history: newHistory,
        visitedExpSteps: newVisited,
        selectedKey: null,
        selectedValue: null,
        selectedNext: null,
      }
    }

    case "SKIP": {
      return {
        ...state,
        history: [...state.history, state.currentStep],
        currentStep: action.dest,
        selectedKey: null,
        selectedValue: null,
        selectedNext: null,
      }
    }

    case "NEXT_EXP": {
      // Commit selection if any
      const newAnswers = state.selectedKey
        ? { ...state.answers, [state.selectedKey]: state.selectedValue }
        : state.answers
      const newVisited = new Set(state.visitedExpSteps)
      newVisited.add(action.currentStep)

      // Find next unvisited
      const nextStep = EXP_STEPS_POOL.find((s) => !newVisited.has(s))
      return {
        ...state,
        history: [...state.history, state.currentStep],
        currentStep: nextStep || "loading",
        answers: newAnswers,
        visitedExpSteps: newVisited,
        selectedKey: null,
        selectedValue: null,
        selectedNext: null,
      }
    }

    case "SKIP_EXP": {
      const newVisited = new Set(state.visitedExpSteps)
      newVisited.add(state.currentStep)
      const nextStep = EXP_STEPS_POOL.find((s) => !newVisited.has(s))
      return {
        ...state,
        history: [...state.history, state.currentStep],
        currentStep: nextStep || "loading",
        visitedExpSteps: newVisited,
        selectedKey: null,
        selectedValue: null,
        selectedNext: null,
      }
    }

    case "SET_LOADING":
      return { ...state, loading: true, error: null }

    case "SET_RESULTS":
      return {
        ...state,
        loading: false,
        results: action.picks,
        currentStep: "results",
      }

    case "SET_ERROR":
      return {
        ...state,
        loading: false,
        error: action.message,
        currentStep: "results",
      }

    case "RESET":
      return { ...INITIAL_STATE, visitedExpSteps: new Set<string>() }

    default:
      return state
  }
}

// --- Component ---

interface BudtenderQuizProps {
  isOpen: boolean
  onClose: () => void
  collection: string
  onProSearch?: () => void
}

export default function BudtenderQuiz({
  isOpen,
  onClose,
  collection,
  onProSearch,
}: BudtenderQuizProps) {
  const [state, dispatch] = useReducer(quizReducer, {
    ...INITIAL_STATE,
    visitedExpSteps: new Set<string>(),
  })
  const stepRef = useRef<HTMLDivElement>(null)

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      dispatch({ type: "RESET" })
    }
  }, [isOpen])

  // Fetch results when we hit the loading step
  const fetchResults = useCallback(async () => {
    dispatch({ type: "SET_LOADING" })
    try {
      const body = quizAnswersToApiBody(state.answers)
      const res = await fetch("/api/xtal/budtender/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      const data = await res.json()
      dispatch({ type: "SET_RESULTS", picks: data.picks || [] })
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        message: err instanceof Error ? err.message : "Something went wrong",
      })
    }
  }, [state.answers])

  useEffect(() => {
    if (state.currentStep === "loading") {
      fetchResults()
    }
  }, [state.currentStep, fetchResults])

  // Step transition animation
  useEffect(() => {
    if (stepRef.current) {
      const el = stepRef.current
      el.style.opacity = "0"
      el.style.transform = "translateY(15px)"
      requestAnimationFrame(() => {
        el.style.transition = "opacity 0.4s ease, transform 0.4s ease"
        el.style.opacity = "1"
        el.style.transform = "translateY(0)"
      })
    }
  }, [state.currentStep])

  // Handlers
  const handleBack = useCallback(() => dispatch({ type: "BACK" }), [])
  const handleContinue = useCallback(() => dispatch({ type: "CONTINUE" }), [])
  const handleSkip = useCallback(
    (dest: QuizStep) => dispatch({ type: "SKIP", dest }),
    []
  )
  const handleSelect = useCallback(
    (key: string, value: string, nextStep: QuizStep | null = null) =>
      dispatch({ type: "SELECT_OPTION", key, value, nextStep }),
    []
  )
  const handleExperience = useCallback(
    (level: ExperienceLevel) => dispatch({ type: "SET_EXPERIENCE", level }),
    []
  )
  const handleNextExp = useCallback(
    (currentStep: string) => dispatch({ type: "NEXT_EXP", currentStep }),
    []
  )
  const handleSkipExp = useCallback(
    () => dispatch({ type: "SKIP_EXP" }),
    []
  )
  const handleGoTo = useCallback(
    (step: QuizStep) => dispatch({ type: "GO_TO_STEP", step }),
    []
  )
  const handleProSearch = useCallback(() => {
    onClose()
    onProSearch?.()
  }, [onClose, onProSearch])

  // Render current step
  function renderStep() {
    switch (state.currentStep) {
      case "intro":
        return (
          <StepIntro
            onStart={() => dispatch({ type: "GO_TO_STEP", step: "experience" })}
          />
        )

      case "experience":
        return <StepExperience onSelect={handleExperience} />

      case "beginner-1":
      case "beginner-relief":
      case "beginner-activities":
      case "beginner-flavor":
        return (
          <StepBeginnerPath
            subStep={state.currentStep}
            selectedValue={state.selectedValue}
            onSelect={handleSelect}
            onContinue={handleContinue}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        )

      case "exp-hub":
        return (
          <StepExpHub
            visitedSteps={state.visitedExpSteps}
            onSelectCategory={handleGoTo}
            onBack={handleBack}
          />
        )

      case "exp-grow":
      case "exp-strain":
      case "exp-potency":
      case "exp-flavor":
        return (
          <StepExpDetail
            subStep={state.currentStep}
            selectedValue={state.selectedValue}
            visitedCount={state.visitedExpSteps.size}
            onSelect={(key, value) => handleSelect(key, value, null)}
            onContinue={handleNextExp}
            onBack={handleBack}
            onSkip={handleSkipExp}
          />
        )

      case "pro-landing":
        return <StepPro onOpenProSearch={handleProSearch} onBack={handleBack} />

      case "loading":
        return <StepLoading />

      case "results":
        return (
          <StepResults
            picks={state.results || []}
            answers={state.answers}
            error={state.error}
            onBack={handleBack}
            onReset={() => dispatch({ type: "RESET" })}
          />
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8"
        style={
          {
            "--bt-accent": "#ffcf33",
            "--bt-gold": "#FFC626",
            "--bt-border": "#b8860b",
            "--bt-card-bg": "rgba(255,255,255,0.05)",
            "--bt-text": "#ffffff",
            "--bt-text-muted": "rgba(255,255,255,0.7)",
          } as React.CSSProperties
        }
      >
        <div
          className="relative w-full h-full md:h-[80vh] md:max-w-[1200px] md:rounded-lg overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(30,30,15,0.97) 0%, rgba(42,40,23,0.97) 100%)",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-30 text-white/60 hover:text-white text-2xl leading-none p-1 transition-colors"
            aria-label="Close"
          >
            {"\u00D7"}
          </button>

          {/* Step container */}
          <div
            ref={stepRef}
            className="w-full h-full p-4 md:p-8 box-border"
          >
            {renderStep()}
          </div>
        </div>
      </div>
    </>
  )
}
