import type { ExperienceLevel } from "../quiz-types"
import QuizCard from "../QuizCard"
import LeafIcon from "../LeafIcon"

interface StepExperienceProps {
  onSelect: (level: ExperienceLevel) => void
}

const LEVELS: { level: ExperienceLevel; title: string; desc: string; leafCount: number }[] = [
  {
    level: "beginner",
    title: "Beginner",
    desc: "No knowledge of strains, potency, terpenes, etc.",
    leafCount: 1,
  },
  {
    level: "experienced",
    title: "Experienced",
    desc: "Some familiarity with strains & effects. Moderate to infrequent user.",
    leafCount: 2,
  },
  {
    level: "pro",
    title: "Pro",
    desc: "Strong understanding of strains, potency, terpenes, etc.",
    leafCount: 3,
  },
]

export default function StepExperience({ onSelect }: StepExperienceProps) {
  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-left w-full">
        <h2
          className="text-2xl md:text-5xl font-bold text-white mb-0"
          style={{ fontFamily: "'Special Gothic Expanded One', Impact, 'Arial Black', sans-serif" }}
        >
          How experienced are you with cannabis?
        </h2>
      </div>
      <div className="flex flex-col w-full flex-1 items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {LEVELS.map((l) => (
            <QuizCard key={l.level} onClick={() => onSelect(l.level)} className="justify-start py-6">
              <span className="flex gap-0.5 mb-2">
                {Array.from({ length: l.leafCount }).map((_, i) => (
                  <LeafIcon key={i} size={36} fill="white" />
                ))}
              </span>
              <span
                className="text-white text-xl md:text-2xl font-bold uppercase"
                style={{ fontFamily: "'Special Gothic Expanded One', Impact, 'Arial Black', sans-serif" }}
              >
                {l.title}
              </span>
              <span className="text-white text-sm mt-1 leading-snug">{l.desc}</span>
            </QuizCard>
          ))}
        </div>
      </div>
    </div>
  )
}
