import Image from 'next/image';
import Link from 'next/link';
import { Callout } from './Callout';
import { InlineCTA } from './InlineCTA';
import { ComparisonTable } from './ComparisonTable';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getMDXComponents() {
  return {
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const id = slugify(String(children));
      return (
        <h2 id={id} className="text-xtal-navy scroll-mt-24" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const id = slugify(String(children));
      return (
        <h3 id={id} className="text-xtal-navy scroll-mt-24" {...props}>
          {children}
        </h3>
      );
    },
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      if (href?.startsWith('/')) {
        return (
          <Link href={href} className="text-blue-600 hover:text-xtal-navy transition-colors" {...props}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} className="text-blue-600 hover:text-xtal-navy transition-colors" target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      if (!src) return null;
      return (
        <span className="block my-6">
          <Image
            src={src}
            alt={alt || ''}
            width={760}
            height={400}
            className="rounded-xl shadow-xtal"
            {...(props as any)}
          />
        </span>
      );
    },
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote className="border-l-4 border-l-xtal-navy" {...props}>
        {children}
      </blockquote>
    ),
    code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
      // If it has a className, it's a code block (handled by syntax highlighter)
      if (className) {
        return <code className={className} {...props}>{children}</code>;
      }
      // Inline code
      return (
        <code className="bg-slate-100 text-xtal-navy rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    Callout,
    InlineCTA,
    ComparisonTable,
  };
}
