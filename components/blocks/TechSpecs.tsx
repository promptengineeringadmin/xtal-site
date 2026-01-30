import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Platform {
  name: string;
  status: string;
}

interface Spec {
  label: string;
  value: string;
}

interface TechSpecsProps {
  eyebrow?: string;
  headline: string;
  description?: string;
  platforms?: Platform[];
  specs?: Spec[];
  cta?: {
    label: string;
    href: string;
  };
}

export default function TechSpecs({
  eyebrow,
  headline,
  description,
  platforms,
  specs,
  cta
}: TechSpecsProps) {
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
          {description && (
            <p className="text-xl text-slate-500 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Platforms */}
          {platforms && (
            <div>
              <h3 className="text-lg font-bold text-xtal-navy mb-6">Supported Platforms</h3>
              <div className="space-y-3">
                {platforms.map((platform, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200"
                  >
                    <span className="font-medium text-slate-900">{platform.name}</span>
                    <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                      {platform.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specs */}
          {specs && (
            <div>
              <h3 className="text-lg font-bold text-xtal-navy mb-6">Technical Specs</h3>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {specs.map((spec, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 ${
                      i < specs.length - 1 ? "border-b border-slate-100" : ""
                    }`}
                  >
                    <span className="text-slate-500">{spec.label}</span>
                    <span className="font-bold text-xtal-navy">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {cta && (
          <div className="mt-12 text-center">
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
            >
              {cta.label} <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
