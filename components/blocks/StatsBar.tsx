interface Stat {
  value: string;
  label: string;
  subtext?: string;
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

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-blue-400 mb-2">
                {stat.value}
              </div>
              <p className="text-lg text-white font-medium mb-1">{stat.label}</p>
              {stat.subtext && (
                <p className="text-sm text-slate-400">{stat.subtext}</p>
              )}
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
