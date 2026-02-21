export type QuizStep =
  | "intro"
  | "experience"
  | "beginner-1"
  | "beginner-relief"
  | "beginner-activities"
  | "beginner-flavor"
  | "exp-hub"
  | "exp-grow"
  | "exp-strain"
  | "exp-potency"
  | "exp-flavor"
  | "pro-landing"
  | "loading"
  | "results"

export type ExperienceLevel = "beginner" | "experienced" | "pro"

export interface QuizAnswers {
  experience?: ExperienceLevel
  intent?: "relief" | "activities"
  need?: string
  flavor?: string
  type?: string // strain type
  grow?: string
  potency?: string
}

export interface BudtenderProduct {
  id: string
  title: string
  price: number
  vendor: string
  product_type: string
  image_url: string | null
  product_url: string
  tags: string[]
  available: boolean
}

export interface BudtenderPick {
  product: BudtenderProduct
  reasoning: string
  relevance_score: number
}

export interface QuizState {
  currentStep: QuizStep
  answers: QuizAnswers
  history: QuizStep[]
  visitedExpSteps: Set<string>
  selectedKey: string | null
  selectedValue: string | null
  selectedNext: QuizStep | null
  loading: boolean
  error: string | null
  results: BudtenderPick[] | null
}

export type QuizAction =
  | { type: "GO_TO_STEP"; step: QuizStep }
  | { type: "SET_EXPERIENCE"; level: ExperienceLevel }
  | { type: "SELECT_OPTION"; key: string; value: string; nextStep: QuizStep | null }
  | { type: "CONTINUE" }
  | { type: "BACK" }
  | { type: "SKIP"; dest: QuizStep }
  | { type: "NEXT_EXP"; currentStep: string }
  | { type: "SKIP_EXP" }
  | { type: "SET_RESULTS"; picks: BudtenderPick[] }
  | { type: "SET_ERROR"; message: string }
  | { type: "SET_LOADING" }
  | { type: "RESET" }

export const EXP_STEPS_POOL: QuizStep[] = [
  "exp-grow",
  "exp-strain",
  "exp-potency",
  "exp-flavor",
]

export const INITIAL_STATE: QuizState = {
  currentStep: "intro",
  answers: {},
  history: [],
  visitedExpSteps: new Set(),
  selectedKey: null,
  selectedValue: null,
  selectedNext: null,
  loading: false,
  error: null,
  results: null,
}
