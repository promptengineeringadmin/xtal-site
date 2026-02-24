import type { BlogPost } from '@/lib/blog';
import { TableOfContents } from './TableOfContents';
import { RelatedPosts } from './RelatedPosts';
import { AuthorCard } from './AuthorCard';
import { NewsletterSignup } from './NewsletterSignup';

interface BlogLayoutProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
  children: React.ReactNode;
}

export function BlogLayout({ post, relatedPosts, children }: BlogLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex gap-12">
        {/* Main content */}
        <article className="min-w-0 max-w-[760px] flex-1">
          <div className="prose prose-slate prose-lg max-w-none prose-headings:text-xtal-navy prose-a:text-blue-600 prose-blockquote:border-l-xtal-navy prose-img:rounded-xl prose-img:shadow-xtal">
            {children}
          </div>
          <AuthorCard name={post.author} title={post.authorTitle} avatar={post.authorAvatar} />
          <NewsletterSignup />
          <RelatedPosts posts={relatedPosts} />
        </article>

        {/* Sidebar TOC */}
        {post.headings && post.headings.length > 0 && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents headings={post.headings} />
          </aside>
        )}
      </div>
    </div>
  );
}
