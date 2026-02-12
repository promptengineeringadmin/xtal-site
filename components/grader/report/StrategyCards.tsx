import type { Recommendation } from "@/lib/grader/types"

interface StrategyCardsProps {
  recommendations: Recommendation[]
}

export default function StrategyCards({ recommendations }: StrategyCardsProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-[#0F172A] mb-6">
        Strategic Implementation
      </h2>

      <div className="space-y-6">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden flex flex-col md:flex-row print:break-inside-avoid"
          >
            {/* Left side - Problem */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100 md:w-5/12">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
              <h3 className="font-bold text-[#0F172A] mb-2">
                {rec.dimension}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {rec.problem}
              </p>
            </div>

            {/* Right side - XTAL Advantage */}
            <div className="p-8 bg-blue-50/30 md:w-7/12">
              <span className="inline-block px-3 py-1 bg-blue-100/80 border border-blue-200 text-blue-600 text-[10px] font-bold tracking-widest uppercase rounded-md mb-4">
                XTAL ADVANTAGE
              </span>
              <p className="text-sm text-slate-600 leading-relaxed">
                {rec.xtalAdvantage}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
