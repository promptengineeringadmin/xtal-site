import { Search, Sparkles } from "lucide-react";

interface Example {
  category: string;
  query: string;
  traditional: {
    result: string;
    productCount: number;
  };
  xtal: {
    reasoning: string;
    result: string;
    productCount: number;
  };
}

interface BeforeAfterShowcaseProps {
  eyebrow?: string;
  headline: string;
  intro?: string;
  examples?: Example[];
}

export default function BeforeAfterShowcase({
  eyebrow,
  headline,
  intro,
  examples
}: BeforeAfterShowcaseProps) {
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

        <div className="space-y-8">
          {examples?.map((example, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden"
            >
              {/* Query Header */}
              <div className="bg-slate-900 text-white p-6">
                <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide mb-2">
                  <Search size={12} />
                  {example.category}
                </div>
                <p className="text-xl font-mono text-blue-300">&quot;{example.query}&quot;</p>
              </div>

              {/* Comparison */}
              <div className="grid md:grid-cols-2">
                {/* Traditional */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wide mb-4">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Traditional Search
                  </div>
                  <p className="text-slate-600 mb-4">{example.traditional.result}</p>
                  <div className="text-sm text-slate-400">
                    {example.traditional.productCount} results
                  </div>
                </div>

                {/* XTAL */}
                <div className="p-6 bg-green-50/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-green-600 uppercase tracking-wide mb-4">
                    <Sparkles size={12} />
                    XTAL Intelligence
                  </div>
                  <div className="bg-white border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-400 mb-1">Reasoning</p>
                    <p className="text-sm text-slate-600">{example.xtal.reasoning}</p>
                  </div>
                  <p className="text-slate-600 mb-4">{example.xtal.result}</p>
                  <div className="text-sm text-green-600 font-medium">
                    {example.xtal.productCount} relevant results
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
