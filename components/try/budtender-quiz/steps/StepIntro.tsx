import LeafIcon from "../LeafIcon"
import QuizCard from "../QuizCard"

interface StepIntroProps {
  onStart: () => void
}

export default function StepIntro({ onStart }: StepIntroProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex flex-col md:flex-row items-center gap-8 mb-6 md:mb-16">
        {/* Placeholder image — will be replaced with budtender-intro.png */}
        <div className="w-[180px] h-[180px] rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
          <LeafIcon size={100} fill="#ffcf33" />
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 uppercase tracking-tight"
              style={{ fontFamily: "'Special Gothic Expanded One', Impact, 'Arial Black', sans-serif" }}>
            Budtender
          </h2>
          <p className="text-white text-lg md:text-2xl">
            Quickly find strains that match your needs.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center h-20 w-full">
        <QuizCard variant="cta" onClick={onStart} className="flex-row gap-2 min-h-0 px-8 py-3">
          <span
            className="text-black font-bold text-lg"
            style={{ fontFamily: "'ProximaNova', Helvetica, Arial, sans-serif" }}
          >
            Get Started
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9.52637 4.86659C9.78637 4.60046 10.207 4.60046 10.4736 4.86659L13.1406 7.52772C13.3055 7.68825 13.3639 7.91821 13.3193 8.13124C13.289 8.28866 13.2027 8.42466 13.082 8.52186L10.4668 11.1332C10.3402 11.2529 10.1665 11.3255 9.99316 11.3256L10 11.3334C9.82 11.3334 9.64637 11.2598 9.52637 11.14C9.25993 10.8806 9.2597 10.4551 9.51953 10.1957V10.1889L11.0391 8.67225H3.33301C2.95983 8.67208 2.66699 8.37206 2.66699 8.00624C2.66721 7.63396 2.95997 7.34137 3.33301 7.3412H11.0527L9.52637 5.81776V5.81093C9.26012 5.54491 9.26018 5.126 9.52637 4.86659Z"
              fill="black"
            />
          </svg>
        </QuizCard>
      </div>
    </div>
  )
}
