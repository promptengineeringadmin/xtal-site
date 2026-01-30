"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Question {
  q: string;
  a: string;
}

interface FAQAccordionProps {
  eyebrow?: string;
  headline: string;
  questions: Question[];
}

export default function FAQAccordion({ eyebrow, headline, questions }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
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

        <div className="space-y-4">
          {questions.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-xtal-navy">{item.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-slate-400 transition-transform shrink-0 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <p className="text-slate-600 leading-relaxed pt-4">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
