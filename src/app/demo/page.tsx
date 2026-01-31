import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import Logo from "@/components/Logo"
import DemoForm from "@/components/DemoForm"

export const metadata: Metadata = {
  title: "Request a Demo | XTAL Search",
  description: "See XTAL Search in action with your own product catalog. Schedule a personalized demo.",
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FCFDFF]">
        <div className="relative pt-32 pb-24 px-6 overflow-hidden brand-gradient text-white">
          {/* Background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-[10%] right-[-5%] w-[400px] h-[80px] bg-xtal-ice rounded-full rotate-[-45deg]" />
            <div className="absolute top-[20%] right-[5%] w-[300px] h-[60px] bg-xtal-ice rounded-full rotate-[-45deg]" />
          </div>

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold tracking-widest uppercase mb-6">
              {plan === "enterprise" ? "Enterprise Demo" : "Request a Demo"}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-[1.1] tracking-tight">
              {plan === "enterprise"
                ? "Let's discuss your enterprise needs"
                : "See XTAL Search in action"}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
              We&apos;ll connect to your store, run real searches side-by-side,
              and show you exactly what your customers are missing.
            </p>
          </div>
        </div>

        <div className="py-16 px-6">
          <div className="max-w-xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-xtal border border-slate-100">
            <DemoForm source="demo-page" preselectedPlan={plan} />
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-slate-200 text-center text-slate-500 text-sm bg-white">
        <div className="flex justify-center mb-6">
          <Logo className="h-6 opacity-50 grayscale" />
        </div>
        <p>&copy; Prompt Engineering, Inc 2026. All Rights Reserved.</p>
      </footer>
    </>
  )
}
