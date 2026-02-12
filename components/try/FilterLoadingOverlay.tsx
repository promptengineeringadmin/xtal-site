"use client"

export default function FilterLoadingOverlay() {
  return (
    <div
      className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-lg flex items-start justify-center pt-8 z-10"
      role="status"
      aria-label="Updating results"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-full shadow-xtal border border-slate-100">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-xtal-navy rounded-full animate-spin" />
        <span className="text-sm text-slate-700 font-medium">Updating results&hellip;</span>
      </div>
    </div>
  )
}
