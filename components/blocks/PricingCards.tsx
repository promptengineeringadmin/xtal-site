import { Check } from "lucide-react";
import Link from "next/link";

interface Plan {
  name: string;
  description: string;
  price: {
    amount: string;
    unit?: string;
    cap?: string;
  };
  features: {
    text: string;
    included?: boolean;
    isHeader?: boolean;
  }[];
  cta: {
    label: string;
    href: string;
    note?: string;
  };
  highlight?: boolean;
}

interface PricingCardsProps {
  plans: Plan[];
}

export default function PricingCards({ plans }: PricingCardsProps) {
  return (
    <div className="py-24 px-6 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`rounded-3xl p-8 md:p-10 border transition-all duration-300 ${
              plan.highlight
                ? "bg-xtal-navy text-white border-blue-500/30 shadow-2xl shadow-blue-900/20 scale-105 z-10"
                : "bg-white text-slate-900 border-slate-200 hover:border-xtal-navy/20"
            }`}
          >
            {plan.highlight && (
              <div className="inline-block bg-blue-500/20 text-blue-200 text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-widest border border-blue-400/20">
                Most Popular
              </div>
            )}

            <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? "text-white" : "text-xtal-navy"}`}>
              {plan.name}
            </h3>
            <p className={`mb-8 ${plan.highlight ? "text-slate-300" : "text-slate-500"}`}>
              {plan.description}
            </p>

            <div className="mb-8">
              <span className="text-4xl md:text-5xl font-bold tracking-tight">
                {plan.price.amount === "Custom" ? "Custom" : `$${plan.price.amount}`}
              </span>
              {plan.price.unit && (
                <span className={`text-lg ml-2 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>
                  /{plan.price.unit}
                </span>
              )}
              {plan.price.cap && (
                <div className={`text-sm mt-2 font-medium ${plan.highlight ? "text-blue-300" : "text-slate-400"}`}>
                  {plan.price.cap}
                </div>
              )}
            </div>

            <Link
              href={plan.cta.href}
              className={`block w-full py-4 rounded-xl text-center font-bold transition-colors ${
                plan.highlight
                  ? "bg-white text-xtal-navy hover:bg-slate-100"
                  : "bg-xtal-navy text-white hover:bg-blue-900"
              }`}
            >
              {plan.cta.label}
            </Link>
            {plan.cta.note && (
              <p className={`text-center text-xs mt-3 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>
                {plan.cta.note}
              </p>
            )}

            <div className="mt-10 space-y-4">
              {plan.features.map((feat, j) => (
                <div key={j} className="flex items-start gap-3">
                  {feat.isHeader ? (
                    <span
                      className={`font-bold block w-full pb-2 border-b ${
                        plan.highlight ? "border-white/10 text-white" : "border-slate-100 text-slate-900"
                      }`}
                    >
                      {feat.text}
                    </span>
                  ) : (
                    <>
                      <div
                        className={`mt-1 rounded-full p-0.5 ${
                          plan.highlight ? "bg-blue-500/20 text-blue-400" : "bg-green-100 text-green-700"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className={`text-sm ${plan.highlight ? "text-slate-300" : "text-slate-600"}`}>
                        {feat.text}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
