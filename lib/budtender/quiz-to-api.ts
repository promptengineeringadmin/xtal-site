import type { QuizAnswers } from "@/components/try/budtender-quiz/quiz-types"

// Maps quiz "need" answers to backend effect facet values + query fragments
const NEED_TO_EFFECTS: Record<string, string[]> = {
  physical: ["pain-relief", "relaxation"],
  anxiety: ["stress-relief", "relaxation"],
  stress: ["stress-relief", "relaxation"],
  sleep: ["sleep", "relaxation"],
  depression: ["mood-boost", "energy"],
  relaxation: ["relaxation"],
  socializing: ["euphoria", "mood-boost"],
  focus: ["focus", "energy"],
  energy: ["energy"],
  creativity: ["creativity", "focus"],
}

const NEED_TO_QUERY: Record<string, string> = {
  physical: "physical relief body relaxation pain",
  anxiety: "calming anxiety relief soothing",
  stress: "stress relief calming wind down",
  sleep: "help me sleep deeply restful night sedating",
  depression: "mood boost uplifting cheerful",
  relaxation: "relaxing calming wind down body relaxation",
  socializing: "social chatty euphoric fun party",
  focus: "focused alert productive clear headed concentration",
  energy: "energizing uplifting daytime boost active",
  creativity: "creative inspiration artistic focus imagination",
}

// Maps quiz flavor answers to terpene facet values
const FLAVOR_TO_TERPENES: Record<string, string[]> = {
  earthy: ["myrcene", "humulene"],
  citrus: ["limonene", "terpinolene"],
  spicy: ["caryophyllene"],
  piney: ["pinene"],
  floral: ["linalool"],
}

const FLAVOR_TO_QUERY: Record<string, string> = {
  earthy: "earthy musky herbal",
  citrus: "citrus fruity zesty",
  spicy: "spicy peppery warm",
  piney: "piney woody forest",
  floral: "floral herbal sweet",
}

const POTENCY_TO_QUERY: Record<string, string> = {
  mellow: "mellow low THC gentle mild",
  moderate: "moderate medium THC balanced",
  max: "high potency max THC strong powerful",
}

export function quizAnswersToApiBody(
  answers: QuizAnswers
): Record<string, unknown> {
  const body: Record<string, unknown> = { limit: 5 }

  // Build query from all answers
  const queryParts: string[] = []

  if (answers.need) {
    queryParts.push(NEED_TO_QUERY[answers.need] || answers.need)
  }
  if (answers.flavor) {
    queryParts.push(FLAVOR_TO_QUERY[answers.flavor] || answers.flavor)
  }
  if (answers.type) {
    queryParts.push(`${answers.type} strain`)
  }
  if (answers.grow) {
    queryParts.push(`${answers.grow} grown`)
  }
  if (answers.potency) {
    queryParts.push(POTENCY_TO_QUERY[answers.potency] || answers.potency)
  }

  body.query =
    queryParts.join(" ") || "cannabis flower recommendation"

  // Structured filters where available
  if (answers.type) {
    body.strains = [answers.type]
  }
  if (answers.need && NEED_TO_EFFECTS[answers.need]) {
    body.effects = NEED_TO_EFFECTS[answers.need]
  }
  if (answers.flavor && FLAVOR_TO_TERPENES[answers.flavor]) {
    body.terpenes = FLAVOR_TO_TERPENES[answers.flavor]
  }

  return body
}
