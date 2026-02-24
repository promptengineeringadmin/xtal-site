import type { BlogPost } from '@/lib/blog';
import { BlogCard } from './BlogCard';

export function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-16 pt-12 border-t border-slate-100">
      <h2 className="text-2xl font-bold text-xtal-navy mb-6">Continue Reading</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
