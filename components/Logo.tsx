export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-auto fill-current text-xtal-navy">
        {/* The 4 rounded rectangular bars */}
        <rect x="42" y="10" width="16" height="35" rx="8" transform="rotate(45 50 50)" />
        <rect x="42" y="55" width="16" height="35" rx="8" transform="rotate(45 50 50)" />
        <rect x="10" y="42" width="35" height="16" rx="8" transform="rotate(45 50 50)" />
        <rect x="55" y="42" width="35" height="16" rx="8" transform="rotate(45 50 50)" />
      </svg>
      <span className="text-xl font-bold tracking-brand text-xtal-navy">XTAL</span>
    </div>
  );
}
