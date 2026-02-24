'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BLOG_CATEGORIES } from '@/lib/blog-categories';

export function CategoryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get('category') || '';

  const handleClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    params.delete('page');
    router.push(`/blog?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => handleClick('')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !active ? 'bg-xtal-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        All
      </button>
      {BLOG_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => handleClick(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === cat ? 'bg-xtal-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
