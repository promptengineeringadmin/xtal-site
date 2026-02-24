import { Metadata } from 'next';
import Link from 'next/link';
import { getAllComparisons } from '@/lib/blog';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compare XTAL Search | XTAL Search',
  description: 'See how XTAL Search compares to Algolia, Searchspring, Klevu, Doofinder, and other ecommerce search platforms.',
  openGraph: {
    title: 'Compare XTAL Search',
    description: 'See how XTAL Search compares to Algolia, Searchspring, Klevu, Doofinder, and other ecommerce search platforms.',
    url: 'https://xtalsearch.com/compare',
  },
};

export default function ComparePage() {
  const comparisons = getAllComparisons();

  return (
    <main className="pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-xtal-navy mb-4">
            How XTAL Compares
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Honest, detailed comparisons between XTAL Search and other ecommerce search platforms. We tell you where we shine and where others might be a better fit.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {comparisons.map((comp) => (
            <Link
              key={comp.slug}
              href={`/compare/${comp.slug}`}
              className="group block bg-white rounded-xl border border-slate-100 p-6 hover:shadow-xtal transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-xtal-navy group-hover:text-blue-600 transition-colors mb-2">
                    {comp.title}
                  </h2>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{comp.description}</p>
                  <span className="text-sm text-slate-400">{comp.readTime}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors mt-1 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        {comparisons.length === 0 && (
          <p className="text-center text-slate-400 py-12">Comparison pages coming soon.</p>
        )}
      </div>
    </main>
  );
}
