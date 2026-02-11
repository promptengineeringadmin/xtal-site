import type { Metadata } from "next"
import Navbar from "@/components/Navbar"
import GraderPage from "@/components/grader/GraderPage"

export const metadata: Metadata = {
  title: "Free Site Search Grader | XTAL Search",
  description:
    "Grade your ecommerce store's search in 60 seconds. Get a free report on typo tolerance, synonym handling, natural language, and more.",
  openGraph: {
    title: "Free Site Search Grader | XTAL Search",
    description:
      "Grade your ecommerce store's search in 60 seconds. Get a free report on typo tolerance, synonym handling, natural language, and more.",
    url: "/grade",
    type: "website",
  },
}

export default function GradePage() {
  return (
    <main className="min-h-screen bg-[#FCFDFF]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden brand-gradient text-white">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[10%] right-[-5%] w-[400px] h-[80px] bg-xtal-ice rounded-full rotate-[-45deg]" />
          <div className="absolute top-[20%] right-[5%] w-[300px] h-[60px] bg-xtal-ice rounded-full rotate-[-45deg]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[100px] bg-white rounded-full rotate-[45deg]" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold tracking-widest uppercase mb-6">
            Free Search Audit
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
            How good is your store&apos;s search?
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            We test your search with real queries — typos, synonyms, natural language — and grade
            it across 8 dimensions. Free, instant, no code required.
          </p>
        </div>
      </section>

      {/* Grader */}
      <section className="relative -mt-6 z-10">
        <GraderPage />
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-xtal-navy text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-xtal-navy/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-xtal-navy">1</span>
              </div>
              <h3 className="font-bold text-xtal-navy mb-2">Enter Your URL</h3>
              <p className="text-sm text-slate-500">
                Paste any ecommerce store URL. We support Shopify, WooCommerce, BigCommerce, Magento, Squarespace, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-xtal-navy/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-xtal-navy">2</span>
              </div>
              <h3 className="font-bold text-xtal-navy mb-2">We Run 10 Tests</h3>
              <p className="text-sm text-slate-500">
                AI generates realistic queries tailored to your store — typos, synonyms, natural language, long-tail — and tests each one.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-xtal-navy/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-xtal-navy">3</span>
              </div>
              <h3 className="font-bold text-xtal-navy mb-2">Get Your Score</h3>
              <p className="text-sm text-slate-500">
                See your overall grade, dimension-by-dimension breakdown, revenue impact estimate, and specific recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
