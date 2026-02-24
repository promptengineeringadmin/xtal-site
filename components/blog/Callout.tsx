import { AlertCircle, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';

const styles = {
  info: { bg: 'bg-blue-50', border: 'border-blue-400', icon: AlertCircle, iconColor: 'text-blue-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-400', icon: AlertTriangle, iconColor: 'text-amber-500' },
  tip: { bg: 'bg-green-50', border: 'border-green-400', icon: Lightbulb, iconColor: 'text-green-500' },
  insight: { bg: 'bg-purple-50', border: 'border-purple-400', icon: Sparkles, iconColor: 'text-purple-500' },
};

export function Callout({ type = 'info', children }: { type?: keyof typeof styles; children: React.ReactNode }) {
  const s = styles[type];
  const Icon = s.icon;
  return (
    <aside className={`${s.bg} ${s.border} border-l-4 rounded-r-lg p-4 my-6 not-prose`}>
      <div className="flex gap-3">
        <Icon className={`${s.iconColor} w-5 h-5 mt-0.5 flex-shrink-0`} />
        <div className="text-sm text-slate-700 [&>p]:m-0">{children}</div>
      </div>
    </aside>
  );
}
