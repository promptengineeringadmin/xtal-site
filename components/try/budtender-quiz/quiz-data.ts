import type { QuizStep } from "./quiz-types"

// --- Card option definition ---
export interface CardOption {
  value: string
  label: string
  emoji?: string
  description?: string
  imageUrl?: string // for future real assets
  placeholderColor?: string // for photo card placeholders
}

// --- Beginner relief options ---
export const RELIEF_OPTIONS: CardOption[] = [
  { value: "physical", label: "Physical", emoji: "\u{1F4AA}" },
  { value: "anxiety", label: "Anxiety", emoji: "\u{1F630}" },
  { value: "stress", label: "Stress", emoji: "\u{1F624}" },
  { value: "sleep", label: "Sleep", emoji: "\u{1F634}" },
  { value: "depression", label: "Depression", emoji: "\u{1F327}\uFE0F" },
]

// --- Beginner activity options ---
export const ACTIVITY_OPTIONS: CardOption[] = [
  { value: "relaxation", label: "Relaxation", emoji: "\u{1F9D8}" },
  { value: "socializing", label: "Socializing", emoji: "\u{1F5E3}\uFE0F" },
  { value: "focus", label: "Focus", emoji: "\u{1F3AF}" },
  { value: "energy", label: "Energy", emoji: "\u26A1" },
  { value: "creativity", label: "Creativity", emoji: "\u{1F3A8}" },
]

// --- Flavor / aromatic options ---
export const FLAVOR_OPTIONS: CardOption[] = [
  { value: "earthy", label: "Earthy & Musky", emoji: "\u{1F33F}" },
  { value: "citrus", label: "Citrus & Fruity", emoji: "\u{1F34A}" },
  { value: "spicy", label: "Spicy & Peppery", emoji: "\u{1F336}\uFE0F" },
  { value: "piney", label: "Piney & Woody", emoji: "\u{1F332}" },
  { value: "floral", label: "Floral & Herbal", emoji: "\u{1F338}" },
]

// --- Strain type options (experienced) ---
export const STRAIN_OPTIONS: CardOption[] = [
  {
    value: "indica",
    label: "Indica",
    description:
      "Known for deeper body relaxation, often chosen for unwinding, easing tension, or settling in for the night.",
    placeholderColor: "#4a2d6b",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description:
      "A balanced mix of effects that can lean calming or uplifting, depending on the genetics.",
    placeholderColor: "#2d5a3b",
  },
  {
    value: "sativa",
    label: "Sativa",
    description:
      "Typically delivers a brighter, more energetic head experience suited for daytime focus or creative flow.",
    placeholderColor: "#6b5a2d",
  },
]

// --- Grow type options (experienced) ---
export const GROW_OPTIONS: CardOption[] = [
  {
    value: "indoor",
    label: "Indoor",
    description: "Controlled environment.",
    placeholderColor: "#3a2d4a",
  },
  {
    value: "greenhouse",
    label: "Greenhouse",
    description: "Best of both worlds.",
    placeholderColor: "#2d4a3a",
  },
  {
    value: "sungrown",
    label: "Sungrown",
    description: "Natural sunlight.",
    placeholderColor: "#4a3a2d",
  },
]

// --- Potency options (experienced) ---
export const POTENCY_OPTIONS: CardOption[] = [
  { value: "mellow", label: "Mellow" },
  { value: "moderate", label: "Moderate" },
  { value: "max", label: "Max" },
]

// --- Experienced hub buttons ---
export const EXP_HUB_OPTIONS: { label: string; step: QuizStep }[] = [
  { label: "Grow Type", step: "exp-grow" },
  { label: "Strain Type", step: "exp-strain" },
  { label: "Potency", step: "exp-potency" },
  { label: "Aromatics & Flavor", step: "exp-flavor" },
]

// --- Strain badge colors ---
export const STRAIN_COLORS: Record<string, { bg: string; text: string }> = {
  indica: { bg: "#7c3aed", text: "#fff" },
  sativa: { bg: "#d97706", text: "#fff" },
  hybrid: { bg: "#16a34a", text: "#fff" },
  "indica-dominant-hybrid": { bg: "#7c3aed", text: "#fff" },
  "sativa-dominant-hybrid": { bg: "#d97706", text: "#fff" },
}
