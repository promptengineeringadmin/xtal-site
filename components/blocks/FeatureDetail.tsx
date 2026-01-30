import { Sparkles } from "lucide-react";

interface Capability {
  title: string;
  detail: string;
}

interface UIMockup {
  query: string;
  reasoning: string;
  ruleApplied?: string;
  confidence?: string;
}

interface FeatureDetailProps {
  eyebrow?: string;
  headline: string;
  description?: string;
  capabilities?: Capability[];
  uiMockup?: UIMockup;
}

export default function FeatureDetail({
  eyebrow,
  headline,
  description,
  capabilities,
  uiMockup
}: FeatureDetailProps) {
  return (
    <div className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            {eyebrow && (
              <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-3 block">
                {eyebrow}
              </span>
            )}
            <h2 className="text-4xl md:text-5xl font-bold text-xtal-navy mb-6 tracking-tight">
              {headline}
            </h2>
            {description && (
              <p className="text-xl text-slate-500 leading-relaxed mb-10">{description}</p>
            )}

            {capabilities && (
              <div className="space-y-6">
                {capabilities.map((cap, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xtal-navy mb-1">{cap.title}</h3>
                      <p className="text-sm text-slate-500">{cap.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UI Mockup */}
          {uiMockup && (
            <div className="bg-slate-900 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-auto text-xs text-slate-500 uppercase tracking-wider">
                  XTAL Intelligence
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">
                    Query
                  </label>
                  <p className="text-lg font-mono text-blue-300">&quot;{uiMockup.query}&quot;</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">
                    Reasoning
                  </label>
                  <p className="text-slate-300">{uiMockup.reasoning}</p>
                </div>

                {uiMockup.ruleApplied && (
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                    <span className="text-xs text-slate-400">Rule Applied:</span>
                    <span className="text-sm text-green-400">{uiMockup.ruleApplied}</span>
                  </div>
                )}

                {uiMockup.confidence && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Confidence:</span>
                    <span className={`text-sm font-bold ${
                      uiMockup.confidence === "High" ? "text-green-400" : "text-amber-400"
                    }`}>
                      {uiMockup.confidence}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
