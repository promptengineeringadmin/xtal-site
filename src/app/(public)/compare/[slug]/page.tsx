import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllComparisons, getComparisonBySlug } from '@/lib/blog';
import { getMDXComponents } from '@/components/blog/mdx-components';
import { BreadcrumbNav } from '@/components/blog/BreadcrumbNav';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllComparisons().map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparisonBySlug(slug);
  if (!page) return {};

  return {
    title: `${page.title} | XTAL Search`,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
      type: 'article',
      url: `https://xtalsearch.com/compare/${page.slug}`,
    },
    alternates: {
      canonical: `https://xtalsearch.com/compare/${page.slug}`,
    },
  };
}

export default async function ComparePostPage({ params }: Props) {
  const { slug } = await params;
  const page = getComparisonBySlug(slug);
  if (!page) notFound();

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.description,
    datePublished: page.date,
    dateModified: page.updated || page.date,
    publisher: {
      '@type': 'Organization',
      name: 'XTAL Search',
      url: 'https://xtalsearch.com',
    },
    mainEntityOfPage: `https://xtalsearch.com/compare/${page.slug}`,
  };

  const faqLd = page.faqItems?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqItems.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }
    : null;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://xtalsearch.com' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://xtalsearch.com/compare' },
      { '@type': 'ListItem', position: 3, name: page.title, item: `https://xtalsearch.com/compare/${page.slug}` },
    ],
  };

  return (
    <>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Compare', href: '/compare' },
            { label: page.title },
          ]} />

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-xtal-navy leading-tight mb-4">
              {page.title}
            </h1>
            <p className="text-lg text-slate-500 mb-4">{page.description}</p>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <time>{new Date(page.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
              {page.updated && (
                <>
                  <span>&middot;</span>
                  <span>Updated {new Date(page.updated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </>
              )}
              <span>&middot;</span>
              <span>{page.readTime}</span>
            </div>
          </header>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-12">
            <article className="min-w-0 max-w-[760px] flex-1">
              <div className="prose prose-slate prose-lg max-w-none prose-headings:text-xtal-navy prose-a:text-blue-600 prose-blockquote:border-l-xtal-navy prose-img:rounded-xl prose-img:shadow-xtal">
                <MDXRemote source={page.content!} components={getMDXComponents()} />
              </div>
              <NewsletterSignup />
            </article>
            {page.headings && page.headings.length > 0 && (
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <TableOfContents headings={page.headings} />
              </aside>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
