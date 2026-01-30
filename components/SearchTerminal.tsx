"use client";
import { useState } from "react";
import { Search, AlertCircle, Sparkles } from "lucide-react";

const EXAMPLES = [
  {
    id: "intent",
    label: "Complex Intent",
    query: "red dress beach wedding under 200",
    legacy: {
      message: "No results found.",
      sub: "Did you mean 'red dress'?",
    },
    xtal: {
      headline: "Crimson & Scarlet Summer Formal",
      analysis: "Identified: Color (Red tones) + Occasion (Beach/Outdoor) + Price (<$200).",
      items: ["Maxi Sundress ($145)", "Floral Chiffon ($189)", "Coral Midi ($120)"],
    },
  },
  {
    id: "vague",
    label: "Vague Problem",
    query: "fix squeaky door hinges",
    legacy: {
      message: "0 results for 'fix squeaky door hinges'",
      sub: "Try searching by Part Number.",
    },
    xtal: {
      headline: "Lubricants & Hardware Solutions",
      analysis: "Mapping 'squeaky hinge' to Category: Lubricants (WD-40, Silicone Spray).",
      items: ["WD-40 Multi-Use ($8)", "Silicone Spray ($12)", "Graphite Powder ($6)"],
    },
  },
  {
    id: "typo",
    label: "Natural Language",
    query: "gift for mom who likes gardening",
    legacy: {
      message: "Showing results for 'gardening'",
      sub: "Ignoring terms: 'gift', 'mom'.",
    },
    xtal: {
      headline: "Curated Gardening Gift Sets",
      analysis: "Persona: 'Mom' (Female/Adult). Interest: 'Gardening'. Context: Gifting.",
      items: ["Deluxe Tool Set ($45)", "Kneeling Pad ($25)", "Ceramic Planter Trio ($60)"],
    },
  },
];

export default function SearchTerminal() {
  const [active, setActive] = useState(EXAMPLES[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = (example: typeof EXAMPLES[0]) => {
    if (active.id === example.id) return;
    setIsAnimating(true);
    setActive(example);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">

      {/* 1. Top Tabs - Increased to text-base/text-lg for better readability */}
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => handleSelect(ex)}
            className={`px-8 py-4 rounded-full text-base font-bold transition-all border ${
              active.id === ex.id
                ? "bg-xtal-navy text-white border-xtal-navy shadow-lg shadow-blue-900/20 scale-105"
                : "bg-white text-slate-500 border-slate-200 hover:border-xtal-navy/30 hover:text-xtal-navy"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* 2. The Browser Window Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">

        {/* Unified Search Bar Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 md:p-8 flex items-center gap-6">
          <div className="hidden md:flex gap-3">
            <div className="w-4 h-4 rounded-full bg-red-400/80" />
            <div className="w-4 h-4 rounded-full bg-amber-400/80" />
            <div className="w-4 h-4 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 relative">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
             {/* INCREASED FONT SIZE HERE: text-xl */}
             <div className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-16 pr-6 text-slate-700 font-medium shadow-sm font-mono text-lg md:text-xl truncate">
               {active.query}
               <span className="animate-pulse text-blue-500 font-bold ml-1">|</span>
             </div>
          </div>
        </div>

        {/* 3. The Comparison Grid */}
        <div className="grid md:grid-cols-2 min-h-[500px]">

          {/* LEFT: Legacy */}
          <div className={`relative p-8 md:p-14 pt-16 md:pt-20 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30 flex flex-col justify-center transition-opacity duration-300 ${isAnimating ? "opacity-50" : "opacity-100"}`}>
            <div className="absolute top-8 md:top-10 left-8 md:left-14 flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#f87171]">
                <span className="text-[10px] text-white font-bold">✕</span>
              </div>
              <span className="text-slate-500 font-bold tracking-[0.2em] text-lg uppercase">Standard Search</span>
            </div>

            <div className="border-2 border-dashed border-red-100 bg-red-50/50 rounded-3xl p-10 text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-red-500">
                <AlertCircle size={32} />
              </div>
              {/* INCREASED FONT SIZE HERE: text-xl and text-lg */}
              <p className="text-red-600 font-bold text-xl mb-3">{active.legacy.message}</p>
              <p className="text-red-400 text-lg">{active.legacy.sub}</p>
            </div>
          </div>

          {/* RIGHT: XTAL */}
          <div className="relative bg-xtal-navy overflow-hidden flex flex-col justify-center p-8 md:p-14 pt-16 md:pt-20">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="absolute top-8 md:top-10 left-8 md:left-14 flex items-center gap-2 z-10">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#4ade80]">
                <span className="text-[10px] text-[#004225] font-bold">✓</span>
              </div>
              <span className="text-white font-bold tracking-[0.2em] text-lg">XTAL</span>
            </div>

            <div className={`relative z-10 transition-all duration-500 ${isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>

              {/* AI Reasoning Box */}
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-6 text-lg text-blue-100 leading-relaxed backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3 text-blue-400 text-xs font-bold uppercase">
                  <Sparkles size={14} />
                  AI Reasoning
                </div>
                {active.xtal.analysis}
              </div>

              {/* Data Flow: Line → Badge → Line */}
              <div className="flex flex-col items-center">
                {/* Top line */}
                <div className="w-[2px] h-4 bg-gradient-to-b from-blue-500/30 to-cyan-400/60" />

                {/* Badge */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-400/30 px-5 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">3</span>
                    <span className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-[0.2em]">Matches</span>
                  </div>
                </div>

                {/* Bottom line */}
                <div className="w-[2px] h-4 bg-gradient-to-b from-cyan-400/60 to-white/40" />
              </div>

              {/* Results Card */}
              <div className="relative bg-white text-slate-900 rounded-2xl p-8 shadow-2xl shadow-black/20">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-xtal-navy text-lg md:text-xl">{active.xtal.headline}</h3>
                </div>
                <div className="space-y-4">
                  {active.xtal.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0" />
                      <div className="text-lg font-medium text-slate-600">
                        {item}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
