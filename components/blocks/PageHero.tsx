"use client";

import Link from "next/link";
import DemoButton from "../DemoButton";

interface PageHeroProps {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  cta?: {
    label: string;
    href: string;
  };
}

function isDemoLink(href: string): boolean {
  return href === "/demo" || href.startsWith("/demo?");
}

export default function PageHero({ eyebrow, headline, subhead, cta }: PageHeroProps) {
  return (
    <div className="relative pt-32 pb-24 px-6 overflow-hidden brand-gradient text-white">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[10%] right-[-5%] w-[400px] h-[80px] bg-xtal-ice rounded-full rotate-[-45deg]" />
        <div className="absolute top-[20%] right-[5%] w-[300px] h-[60px] bg-xtal-ice rounded-full rotate-[-45deg]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[100px] bg-white rounded-full rotate-[45deg]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        {eyebrow && (
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold tracking-widest uppercase mb-6">
            {eyebrow}
          </div>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
          {headline}
        </h1>
        {subhead && (
          <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            {subhead}
          </p>
        )}
        {cta && (
          isDemoLink(cta.href) ? (
            <DemoButton
              source="page-hero"
              className="inline-block px-8 py-4 bg-white text-xtal-navy font-bold rounded-xl shadow-2xl hover:bg-slate-100 transition-all"
            >
              {cta.label}
            </DemoButton>
          ) : (
            <Link
              href={cta.href}
              className="inline-block px-8 py-4 bg-white text-xtal-navy font-bold rounded-xl shadow-2xl hover:bg-slate-100 transition-all"
            >
              {cta.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
