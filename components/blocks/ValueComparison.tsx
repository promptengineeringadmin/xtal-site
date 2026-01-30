import { ArrowRight, TrendingUp, ShoppingCart, Headphones, Trophy } from "lucide-react";

interface Benefit {
  title: string;
  description: string;
}

interface CTA {
  label: string;
  href: string;
  note?: string;
}

interface ValueComparisonProps {
  eyebrow?: string;
  headline: string;
  benefits?: Benefit[];
  cta?: CTA;
}

const BENEFIT_ICONS = [TrendingUp, ShoppingCart, Headphones, Trophy];

export default function ValueComparison({
  eyebrow,
  headline,
  benefits,
  cta
}: ValueComparisonProps) {
  if (!benefits || benefits.length === 0) return null;

  return (
    <div className="py-24 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          {eyebrow && (
            <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-3 block">
              {eyebrow}
            </span>
          )}
          <h2 className="text-4xl md:text-5xl font-bold text-xtal-navy tracking-tight">
            {headline}
          </h2>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit, i) => {
            const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-xtal-navy mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {cta && (
          <div className="text-center">
            <a
              href={cta.href}
              className="inline-flex items-center gap-2 px-8 py-4 bg-xtal-navy text-white font-bold rounded-xl hover:bg-xtal-navy/90 transition-colors"
            >
              {cta.label}
              <ArrowRight size={18} />
            </a>
            {cta.note && (
              <p className="text-sm text-slate-500 mt-4">{cta.note}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
