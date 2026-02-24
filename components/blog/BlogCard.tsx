import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/lib/blog';

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xtal transition-shadow h-full flex flex-col">
        {post.image ? (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-xtal-navy/5 to-xtal-ice flex items-center justify-center">
            <span className="text-4xl text-xtal-navy/20 font-bold">XTAL</span>
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <span className="self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-3 bg-xtal-ice text-xtal-navy">
            {post.category}
          </span>
          <h3 className="font-bold text-xtal-navy text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{post.description}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-50">
            <span>{post.author}</span>
            <span>&middot;</span>
            <time>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
            <span>&middot;</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
