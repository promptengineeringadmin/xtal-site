import { Wine, Car, Scissors, Mountain, Pill, Wrench, ArrowRight, LucideIcon } from "lucide-react";

// Map string icons to Lucide components
const ICONS: Record<string, LucideIcon> = {
  wine: Wine,
  car: Car,
  scissors: Scissors,
  mountain: Mountain,
  pill: Pill,
  wrench: Wrench
};

interface UseCase {
  title: string;
  icon: string;
  challenge: string;
  solution: string;
  exampleQueries: string[];
  benefits?: string[];
}

interface UseCaseGridProps {
  eyebrow?: string;
  headline: string;
  cases: UseCase[];
}

export default function UseCaseGrid({ eyebrow, headline, cases }: UseCaseGridProps) {
  return (
    <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
      {/* Background Decor - Subtle Grid */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{ backgroundImage: 'radial-gradient(#1B2D5B 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-16 max-w-2xl">
          {eyebrow && (
            <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-3 block">{eyebrow}</span>
          )}
          <h2 className="text-4xl md:text-5xl font-bold text-xtal-navy tracking-tight">{headline}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases?.map((item, i) => {
            const Icon = ICONS[item.icon] || Wrench;

            return (
              <div key={i} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                {/* Top Gradient Border */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-100" />

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-xtal-navy">{item.title}</h3>
                </div>

                {/* Challenge/Solution */}
                <div className="mb-8 space-y-4">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">Challenge:</span>
                    {item.challenge}
                  </p>
                  <div className="w-full h-px bg-slate-100" />
                  <p className="text-sm text-slate-500 leading-relaxed">
                    <span className="font-bold text-blue-600 block mb-1">XTAL Solution:</span>
                    {item.solution}
                  </p>
                </div>

                {/* "Code" Queries */}
                {item.exampleQueries && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mb-2 block tracking-wider">Real Queries</span>
                    <div className="space-y-2">
                      {item.exampleQueries.slice(0, 2).map((q, k) => (
                        <div key={k} className="text-xs font-mono text-slate-600 bg-white px-2 py-1.5 rounded border border-slate-200 truncate">
                          &quot;{q}&quot;
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benefits Footer */}
                {item.benefits && (
                  <div className="pt-4 border-t border-slate-100">
                    {item.benefits.slice(0, 1).map((b, k) => (
                      <div key={k} className="flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50/50 px-3 py-2 rounded-lg">
                        <ArrowRight size={14} /> {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
