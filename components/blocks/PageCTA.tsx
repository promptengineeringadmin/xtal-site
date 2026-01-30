import Link from "next/link";
import { Check } from "lucide-react";

interface PageCTAProps {
  headline: string;
  description?: string;
  cta: {
    primary: {
      label: string;
      href: string;
    };
    secondary?: {
      label: string;
      href: string;
    };
  };
  trust?: {
    items?: string[];
    note?: string;
  };
}

export default function PageCTA({ headline, description, cta, trust }: PageCTAProps) {
  return (
    <div className="py-24 px-6 bg-xtal-navy text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
          {headline}
        </h2>
        {description && (
          <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <Link
            href={cta.primary.href}
            className="px-8 py-4 bg-white text-xtal-navy font-bold rounded-xl shadow-2xl hover:bg-slate-100 transition-all"
          >
            {cta.primary.label}
          </Link>
          {cta.secondary && (
            <Link
              href={cta.secondary.href}
              className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-all"
            >
              {cta.secondary.label}
            </Link>
          )}
        </div>

        {trust?.items && (
          <div className="flex flex-wrap justify-center gap-6">
            {trust.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <Check size={16} className="text-green-400" />
                {item}
              </div>
            ))}
          </div>
        )}

        {trust?.note && (
          <p className="text-sm text-slate-400 mt-6">{trust.note}</p>
        )}
      </div>
    </div>
  );
}
