import { ArrowRight, Clock } from "lucide-react";

interface Comparison {
  from: string;
  fromLogo?: string;
  verdict: string;
  details: string;
  migrationTime: string;
}

interface ComparisonSectionProps {
  eyebrow?: string;
  headline: string;
  description?: string;
  comparisons?: Comparison[];
}

export default function ComparisonSection({
  eyebrow,
  headline,
  description,
  comparisons
}: ComparisonSectionProps) {
  return (
    <div className="py-24 px-6">
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
          {description && (
            <p className="text-xl text-slate-500 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {comparisons?.map((comp, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-sm">
                  {comp.from.charAt(0)}
                </div>
                <ArrowRight className="text-slate-300" size={20} />
                <div className="w-12 h-12 bg-xtal-navy rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  X
                </div>
              </div>

              <h3 className="text-xl font-bold text-xtal-navy mb-2">
                From {comp.from}
              </h3>
              <p className="text-blue-600 font-medium mb-4">{comp.verdict}</p>
              <p className="text-slate-500 text-sm mb-6">{comp.details}</p>

              <div className="flex items-center gap-2 text-sm text-slate-400 pt-4 border-t border-slate-100">
                <Clock size={14} />
                Migration time: <span className="font-medium text-slate-600">{comp.migrationTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
