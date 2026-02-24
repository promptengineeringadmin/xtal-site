import { Sparkles } from 'lucide-react';
import Link from 'next/link';

interface InlineCTAProps {
  title?: string;
  body?: string;
  cta?: string;
  href?: string;
}

export function InlineCTA({
  title = "How does your store's search measure up?",
  body = "Get a free, instant search quality report with scores across 8 dimensions.",
  cta = "Grade your store's search",
  href = '/grade',
}: InlineCTAProps) {
  return (
    <div className="glass-card border-l-4 border-l-xtal-navy p-6 my-8 not-prose">
      <div className="flex items-start gap-4">
        <div className="bg-xtal-navy/10 rounded-lg p-2 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-xtal-navy" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-xtal-navy text-lg mb-1">{title}</h4>
          <p className="text-slate-600 text-sm mb-3">{body}</p>
          <Link
            href={href}
            className="inline-flex items-center gap-2 bg-xtal-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-xtal-navy/90 transition-colors"
          >
            {cta}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
