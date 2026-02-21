export default function StepLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div
        className="w-12 h-12 border-4 border-white/20 border-t-[var(--bt-accent,#ffcf33)] rounded-full animate-spin"
      />
      <h2
        className="text-xl md:text-3xl font-bold text-white"
        style={{ fontFamily: "'Special Gothic Expanded One', Impact, 'Arial Black', sans-serif" }}
      >
        Analyzing matches...
      </h2>
    </div>
  )
}
