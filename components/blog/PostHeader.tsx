import Image from 'next/image';
import type { BlogPost } from '@/lib/blog';

export function PostHeader({ post }: { post: BlogPost }) {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-xtal-ice text-xtal-navy">
          {post.category}
        </span>
        <span className="text-sm text-slate-400">{post.readTime}</span>
      </div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-xtal-navy leading-tight mb-4">
        {post.title}
      </h1>
      <p className="text-lg text-slate-500 mb-6">{post.description}</p>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        {post.authorAvatar && (
          <Image src={post.authorAvatar} alt={post.author} width={36} height={36} className="rounded-full" />
        )}
        <div>
          <span className="font-medium text-xtal-navy">{post.author}</span>
          {post.authorTitle && <span className="text-slate-400"> &middot; {post.authorTitle}</span>}
        </div>
        <span className="text-slate-300">|</span>
        <time>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
        {post.updated && (
          <>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">Updated {new Date(post.updated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </>
        )}
      </div>
      {post.image && (
        <div className="relative aspect-[2/1] rounded-xl overflow-hidden mt-8">
          <Image src={post.image} alt={post.title} fill className="object-cover" priority />
        </div>
      )}
    </header>
  );
}
