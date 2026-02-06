interface Stat {
  label: string;
  metric: string;
  context: string;
}

interface StatsBarProps {
  headline?: string;
  stats: Stat[];
  kicker?: string;
}

export default function StatsBar({ headline, stats, kicker }: StatsBarProps) {
  return (
    <div className="py-20 px-6 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto">
        {headline && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {headline}
          </h2>
        )}

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="relative border border-slate-700 rounded-lg pt-8 pb-6 px-6 text-center">
              {/* Label breaking the top border */}
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-3 text-xs uppercase tracking-widest text-slate-500">
                {stat.label}
              </span>

              {/* Metric - hero number */}
              <p className="text-5xl md:text-6xl font-black text-blue-400 mb-2">
                {stat.metric}
              </p>

              {/* Context - single line explanation */}
              <p className="text-sm text-slate-400">
                {stat.context}
              </p>
            </div>
          ))}
        </div>

        {kicker && (
          <div className="text-center">
            <p className="text-xl text-slate-300 font-medium">{kicker}</p>
          </div>
        )}
      </div>
    </div>
  );
}
