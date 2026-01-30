"use client";
import { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";
import Navbar from "@/components/Navbar";
import SearchTerminal from "@/components/SearchTerminal";
import IntegrationStrip from "@/components/IntegrationStrip";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const res = await fetch("/api/demo-request", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (res.ok) setStatus("success");
    else setStatus("error");
  };

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section - The "Professional" Overhaul */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden brand-gradient text-white">
        {/* Abstract Architectural Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[10%] right-[-5%] w-[400px] h-[80px] bg-xtal-ice rounded-full rotate-[-45deg]" />
          <div className="absolute top-[20%] right-[5%] w-[300px] h-[60px] bg-xtal-ice rounded-full rotate-[-45deg]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[100px] bg-white rounded-full rotate-[45deg]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold tracking-widest uppercase mb-6">
              AI-Native Discovery
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
              Your customers know what they want. <span className="text-blue-400">Today's search bars don't.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-xl">
              XTAL is AI-powered search that actually understands intent, so customers buy instead of bounce. No engineering required.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#demo" className="px-8 py-4 bg-white text-xtal-navy font-bold rounded-xl shadow-2xl hover:bg-slate-100 transition-all">
                See It Work
              </a>
              <a href="#difference" className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-all">
                The XTAL Difference
              </a>
            </div>
          </div>

          {/* Visual Mockup - The "Natural Language Control" Console */}
          <div className="hidden lg:block relative">
            {/* Abstract Glow behind the console */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="glass-card rounded-2xl border border-white/10 shadow-2xl shadow-blue-900/50 backdrop-blur-xl relative overflow-hidden transform rotate-[-1deg] hover:rotate-0 transition-all duration-500">

              {/* Console Header */}
              <div className="bg-white/5 border-b border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-200/50">
                  Merchant Control Layer
                </div>
              </div>

              {/* Console Body */}
              <div className="p-8 bg-[#0F172A]/80">

                {/* Label */}
                <div className="flex items-center gap-2 mb-4 text-blue-400 text-xs font-bold uppercase tracking-widest">
                  <Sparkles size={12} />
                  Merchandising Logic
                </div>

                {/* The "Dumbed Down" Prompt Input */}
                <div className="relative group">
                  <textarea
                    readOnly
                    className="w-full h-32 bg-transparent text-xl md:text-2xl font-medium text-white placeholder-slate-500 outline-none resize-none leading-relaxed"
                    defaultValue={`For any search related to 'gifts' or 'presents', always prioritize the Holiday Bundle Collection.\n\nPush accessories under $20 to the bottom of the results.`}
                  />
                  {/* Cursor Animation */}
                  <span className="absolute bottom-8 right-10 w-0.5 h-6 bg-blue-400 animate-pulse" />
                </div>

                {/* Active Tags / Feedback */}
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase">
                      Rule Active
                    </span>
                    <span className="px-3 py-1 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase">
                      Global Scope
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors shadow-lg shadow-blue-600/20">
                    Save Logic
                  </button>
                </div>

              </div>
            </div>

            {/* Floating Decoration: "No Code" Badge */}
            <div className="absolute -bottom-6 -right-6 bg-white text-xtal-navy px-6 py-4 rounded-xl shadow-xl border border-slate-200 flex items-center gap-3 animate-bounce duration-[3000ms]">
              <div className="bg-green-100 p-1.5 rounded-full text-green-700">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engineering Req</div>
                <div className="font-bold text-lg">None</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Integrations */}
      <IntegrationStrip />

      {/* Comparison Section - Interactive Terminal */}
      <section id="difference" className="py-24 px-6 bg-[#FCFDFF]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-xtal-navy mb-4">
              Don&apos;t just search. <span className="text-blue-600">Understand.</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              See how XTAL handles the queries that break traditional search engines.
            </p>
          </div>

          <SearchTerminal />
        </div>
      </section>

      {/* Demo Form */}
      <section id="demo" className="py-24 bg-slate-50 px-6">
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-xtal border border-slate-100">
          <h2 className="text-3xl font-bold mb-2 text-xtal-navy">Request a Demo</h2>
          <p className="text-slate-500 mb-8">See how XTAL Search transforms your store's conversion rate.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" name="honeyPot" className="hidden" />

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input required name="name" className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Work Email</label>
                <input required name="email" type="email" className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Company</label>
              <input required name="company" className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Primary Search Pain Point</label>
              <textarea name="message" rows={4} className="w-full p-3 bg-slate-100 rounded-lg focus:ring-2 focus:ring-xtal-navy outline-none" />
            </div>

            <button
              disabled={status === "loading"}
              className="w-full py-4 bg-xtal-navy text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {status === "loading" ? "Processing..." : "Send Request"}
            </button>

            {status === "success" && <p className="text-green-600 font-medium text-center">Thanks! We'll be in touch shortly.</p>}
            {status === "error" && <p className="text-red-600 font-medium text-center">Something went wrong. Please try again.</p>}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 text-center text-slate-500 text-sm">
        <div className="flex justify-center mb-6">
          <Logo className="h-6 opacity-50 grayscale" />
        </div>
        <p>© Prompt Engineering, Inc 2025. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
