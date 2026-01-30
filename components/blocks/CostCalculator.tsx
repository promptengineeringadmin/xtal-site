"use client";
import { useState } from "react";
import { Calculator } from "lucide-react";

interface Benchmark {
  label: string;
  range: string;
}

interface CostCalculatorProps {
  headline: string;
  description?: string;
  input?: {
    label: string;
    placeholder: string;
    helper?: string;
  };
  output?: {
    format?: string;
    formula?: string;
    maxNote?: string;
  };
  benchmarks?: Benchmark[];
}

export default function CostCalculator({
  headline,
  description,
  input,
  output,
  benchmarks
}: CostCalculatorProps) {
  const [searches, setSearches] = useState<string>("");

  const calculateCost = () => {
    const num = parseInt(searches.replace(/,/g, ""), 10);
    if (isNaN(num) || num <= 0) return null;
    return (num * 0.10).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });
  };

  const cost = calculateCost();
  const numSearches = parseInt(searches.replace(/,/g, ""), 10);
  const isOverLimit = numSearches > 50000;

  return (
    <div className="py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calculator size={32} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-xtal-navy mb-4">{headline}</h2>
          {description && (
            <p className="text-lg text-slate-500">{description}</p>
          )}
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 md:p-12">
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {input?.label || "Monthly searches"}
            </label>
            <input
              type="text"
              value={searches}
              onChange={(e) => setSearches(e.target.value.replace(/[^0-9,]/g, ""))}
              placeholder={input?.placeholder || "e.g., 15000"}
              className="w-full p-4 text-2xl font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {input?.helper && (
              <p className="text-sm text-slate-400 mt-2">{input.helper}</p>
            )}
          </div>

          {cost && (
            <div className="bg-xtal-navy text-white rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-300 mb-2">Estimated Monthly Cost</p>
              <p className="text-5xl font-bold">{cost}</p>
              {output?.formula && (
                <p className="text-sm text-slate-400 mt-2">{output.formula}</p>
              )}
              {isOverLimit && output?.maxNote && (
                <p className="text-sm text-amber-300 mt-4">{output.maxNote}</p>
              )}
            </div>
          )}
        </div>

        {benchmarks && (
          <div className="mt-12">
            <h3 className="text-lg font-bold text-xtal-navy mb-4 text-center">Typical Ranges</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {benchmarks.map((b, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-500 mb-1">{b.label}</p>
                  <p className="font-bold text-xtal-navy">{b.range}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
