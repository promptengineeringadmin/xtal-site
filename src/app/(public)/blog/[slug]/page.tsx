import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog';
import { getMDXComponents } from '@/components/blog/mdx-components';
import { PostHeader } from '@/components/blog/PostHeader';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { BreadcrumbNav } from '@/components/blog/BreadcrumbNav';
import { ReadingProgress } from '@/components/blog/ReadingProgress';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | XTAL Search Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: [post.author],
      url: `https://xtalsearch.com/blog/${post.slug}`,
      images: post.image ? [{ url: `https://xtalsearch.com${post.image}`, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `https://xtalsearch.com/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(post, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.date,
    dateModified: post.updated || post.date,
    publisher: {
      '@type': 'Organization',
      name: 'XTAL Search',
      url: 'https://xtalsearch.com',
    },
    mainEntityOfPage: `https://xtalsearch.com/blog/${post.slug}`,
    image: post.image ? `https://xtalsearch.com${post.image}` : undefined,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://xtalsearch.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://xtalsearch.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://xtalsearch.com/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title },
          ]} />
          <PostHeader post={post} />
        </div>
        <div className="mt-8">
          <BlogLayout post={post} relatedPosts={relatedPosts}>
            <MDXRemote source={post.content!} components={getMDXComponents()} />
          </BlogLayout>
        </div>
      </main>
    </>
  );
}
