import {
  Book,
  Sliders,
  Settings,
  Tag,
  Filter,
  AlertTriangle,
  Check,
  X,
  LucideIcon
} from "lucide-react";
import Logo from "../Logo";

const ICONS: Record<string, LucideIcon> = {
  book: Book,
  sliders: Sliders,
  settings: Settings,
  tag: Tag,
  filter: Filter,
  "alert-triangle": AlertTriangle,
};

interface ComparisonItem {
  task: string;
  traditional: string;
  xtal: string;
  icon?: string;
}

interface ComparisonGridProps {
  eyebrow?: string;
  headline: string;
  intro?: string;
  items?: ComparisonItem[];
  summary?: string;
  // For competitor pricing comparison
  competitors?: {
    name: string;
    price: string;
    catches: string[];
    verdict: string;
  }[];
  xtalAdvantage?: string;
}

export default function ComparisonGrid({
  eyebrow,
  headline,
  intro,
  items,
  summary,
  competitors,
  xtalAdvantage,
}: ComparisonGridProps) {
  // Competitor pricing view
  if (competitors) {
    return (
      <div className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-16">
            {eyebrow && (
              <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-3 block">
                {eyebrow}
              </span>
            )}
            <h2 className="text-4xl md:text-5xl font-bold text-xtal-navy mb-6 tracking-tight">
              {headline}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {competitors.map((comp, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-xtal-navy mb-2">{comp.name}</h3>
                <p className="text-2xl font-bold text-slate-900 mb-4">{comp.price}</p>
                <ul className="space-y-2 mb-4">
                  {comp.catches.map((c, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-500">
                      <X size={12} className="text-red-400 mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-3">
                  {comp.verdict}
                </p>
              </div>
            ))}
          </div>

          {xtalAdvantage && (
            <div className="bg-xtal-navy text-white rounded-2xl p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Check size={20} className="text-green-400" />
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 100 100" className="h-6 w-auto fill-current text-white">
                    <rect x="42" y="10" width="16" height="35" rx="8" transform="rotate(45 50 50)" />
                    <rect x="42" y="55" width="16" height="35" rx="8" transform="rotate(45 50 50)" />
                    <rect x="10" y="42" width="35" height="16" rx="8" transform="rotate(45 50 50)" />
                    <rect x="55" y="42" width="35" height="16" rx="8" transform="rotate(45 50 50)" />
                  </svg>
                  <span className="text-lg font-bold tracking-wide">XTAL</span>
                </div>
              </div>
              <p className="text-slate-300">{xtalAdvantage}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Anti-features / task comparison view
  return (
    <div className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-16">
          {eyebrow && (
            <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-3 block">
              {eyebrow}
            </span>
          )}
          <h2 className="text-4xl md:text-5xl font-bold text-xtal-navy mb-6 tracking-tight">
            {headline}
          </h2>
          {intro && (
            <p className="text-xl text-slate-500 leading-relaxed">{intro}</p>
          )}
        </div>

        <div className="space-y-4">
          {items?.map((item, i) => {
            const Icon = item.icon ? ICONS[item.icon] : null;

            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <div className="grid md:grid-cols-[250px_1fr_1fr] gap-0">
                  {/* Task */}
                  <div className="p-6 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex items-center gap-4">
                    {Icon && (
                      <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                        <Icon size={20} />
                      </div>
                    )}
                    <span className="font-bold text-xtal-navy">{item.task}</span>
                  </div>

                  {/* Traditional */}
                  <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wide mb-2">
                      <X size={12} />
                      Traditional
                    </div>
                    <p className="text-sm text-slate-600">{item.traditional}</p>
                  </div>

                  {/* XTAL */}
                  <div className="p-6 bg-green-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Check size={14} className="text-green-600" />
                      <Logo className="h-5" />
                    </div>
                    <p className="text-sm text-slate-600">{item.xtal}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {summary && (
          <div className="mt-12 text-center">
            <p className="text-lg text-slate-600">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
