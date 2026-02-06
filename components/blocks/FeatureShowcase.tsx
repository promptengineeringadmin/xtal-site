import {
  Target,
  Lightbulb,
  Merge,
  Filter,
  ArrowRight,
  Zap,
  Package,
  Store,
  Building,
  Wine,
  Car,
  Scissors,
  Mountain,
  Pill,
  Wrench,
  LucideIcon
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  target: Target,
  lightbulb: Lightbulb,
  merge: Merge,
  filter: Filter,
  package: Package,
  store: Store,
  building: Building,
  wine: Wine,
  car: Car,
  scissors: Scissors,
  mountain: Mountain,
  pill: Pill,
  wrench: Wrench,
};

interface FeatureShowcaseProps {
  eyebrow?: string;
  headline: string;
  description?: string;
  intro?: string;
  examples?: any[];
  cases?: any[];
  steps?: any[];
  summary?: string;
  footnote?: string;
}

export default function FeatureShowcase({
  eyebrow,
  headline,
  description,
  intro,
  examples,
  cases,
  steps,
  summary,
  footnote
}: FeatureShowcaseProps) {
  const items = examples || cases || steps || [];
  const isProcess = !!steps;

  return (
    <div className="py-24 px-6 max-w-7xl mx-auto">
      <div className="max-w-3xl mb-16">
        {eyebrow && (
          <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-3 block">
            {eyebrow}
          </span>
        )}
        <h2 className="text-4xl md:text-5xl font-bold text-xtal-navy mb-6 tracking-tight">
          {headline}
        </h2>
        {(description || intro) && (
          <p className="text-xl text-slate-500 leading-relaxed">
            {description || intro}
          </p>
        )}
      </div>

      <div className={`grid gap-8 ${isProcess ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        {items.map((item: any, i: number) => {
          const Icon = ICONS[item.icon] || Zap;

          if (isProcess) {
            return (
              <div key={i} className="flex gap-8 border-l-2 border-slate-200 pl-8 pb-12 last:border-0 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="max-w-4xl">
                  <span className="text-sm font-mono text-slate-400 mb-2 block">
                    Step {item.number}
                  </span>
                  <h3 className="text-2xl font-bold text-xtal-navy mb-4 flex items-center gap-3">
                    {item.title}
                    {item.subtitle && (
                      <>
                        <span className="text-slate-300 font-light">/</span> {item.subtitle}
                      </>
                    )}
                  </h3>
                  <p className="text-lg text-slate-600 mb-6">{item.detail}</p>

                  {item.bullets && (
                    <ul className="grid md:grid-cols-2 gap-3 mb-6">
                      {item.bullets.map((b: string, j: number) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-2 rounded">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.techNote && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                      <p className="text-sm text-slate-600 italic">{item.techNote}</p>
                    </div>
                  )}

                  {item.contrast && (
                    <div className="flex gap-3 mb-6">
                      <div className="w-1 bg-blue-500 shrink-0" />
                      <div className="bg-blue-50 px-4 py-3">
                        <p className="text-slate-600 text-sm">{item.contrast}</p>
                      </div>
                    </div>
                  )}

                  {item.example && (
                    <div className="bg-slate-900 rounded-xl p-6 font-mono text-sm text-blue-100 overflow-hidden relative">
                      <div className="absolute top-2 right-2 text-[10px] uppercase border border-white/20 px-2 py-1 rounded text-white/50">
                        XTAL Logic
                      </div>
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(item.example, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Standard Grid Layout (Use Cases / Features)
          return (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-xtal-navy mb-2">
                {item.title || item.type}
              </h3>
              {item.subtitle && (
                <p className="text-sm text-slate-400 mb-3">{item.subtitle}</p>
              )}
              <p className="text-slate-500 mb-6 leading-relaxed text-sm">
                {item.explanation || item.challenge || item.description || item.profile}
              </p>

              {/* Pain Points for business type cards */}
              {item.painPoints && (
                <ul className="space-y-2 mb-6">
                  {item.painPoints.map((point: string, k: number) => (
                    <li key={k} className="flex items-start gap-2 text-xs text-slate-500">
                      <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              )}

              {/* XTAL Fit */}
              {item.xtalFit && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-green-800">{item.xtalFit}</p>
                </div>
              )}

              {/* Example Queries */}
              {item.exampleQueries && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Example Queries</p>
                  <div className="space-y-1">
                    {item.exampleQueries.slice(0, 3).map((q: string, k: number) => (
                      <div key={k} className="text-xs bg-slate-50 px-2 py-1 rounded text-slate-600 font-mono">
                        "{q}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {item.tags && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((t: string, k: number) => (
                    <span key={k} className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Platforms */}
              {item.platforms && (
                <div className="flex flex-wrap gap-2">
                  {item.platforms.map((p: string, k: number) => (
                    <span key={k} className="text-[10px] uppercase font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* Results */}
              {item.results && (
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
                  {item.results.map((r: string, k: number) => (
                    <div key={k} className="flex items-center gap-2 text-sm font-medium text-green-700">
                      <ArrowRight size={14} /> {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {summary && (
        <div className="mt-12 text-center">
          <p className="text-lg text-slate-600 font-medium">{summary}</p>
        </div>
      )}

      {footnote && (
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 italic">{footnote}</p>
        </div>
      )}
    </div>
  );
}
