import { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { CategoryTabs } from '@/components/blog/CategoryTabs';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Insights | XTAL Search',
  description: 'Expert insights on ecommerce search, AI-powered product discovery, and search quality optimization.',
  openGraph: {
    title: 'Insights | XTAL Search',
    description: 'Expert insights on ecommerce search, AI-powered product discovery, and search quality optimization.',
    url: 'https://xtalsearch.com/blog',
  },
};

const POSTS_PER_PAGE = 9;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const allPosts = getAllPosts();
  const category = params.category || '';
  const page = parseInt(params.page || '1', 10);

  const filtered = category ? allPosts.filter((p) => p.category === category) : allPosts;
  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paged = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const featured = !category && page === 1 ? allPosts[0] : null;
  const gridPosts = featured ? paged.slice(1) : paged;

  return (
    <main className="pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-xtal-navy mb-4">Insights</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Insights on ecommerce search, AI-powered product discovery, and how to convert more shoppers.
          </p>
        </div>

        <Suspense fallback={null}>
          <CategoryTabs />
        </Suspense>

        {/* Featured post hero */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group block mb-12">
            <article className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xtal transition-shadow">
              <div className="grid md:grid-cols-2 gap-0">
                <div className={`aspect-[16/9] md:aspect-auto ${featured.image ? '' : 'bg-gradient-to-br from-xtal-navy/5 to-xtal-ice flex items-center justify-center'}`}>
                  {featured.image ? (
                    <img src={featured.image} alt={featured.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl text-xtal-navy/20 font-bold">XTAL</span>
                  )}
                </div>
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">{featured.category}</span>
                  <h2 className="text-2xl md:text-3xl font-bold text-xtal-navy mb-3 group-hover:text-blue-600 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-slate-500 mb-4 line-clamp-3">{featured.description}</p>
                  <div className="text-sm text-slate-400">
                    {featured.author} &middot; {new Date(featured.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {featured.readTime}
                  </div>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Post grid */}
        {gridPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-12">No posts found in this category yet.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              if (category) params.set('category', category);
              if (p > 1) params.set('page', String(p));
              const href = `/blog${params.toString() ? `?${params.toString()}` : ''}`;
              return (
                <Link
                  key={p}
                  href={href}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                    p === page ? 'bg-xtal-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
