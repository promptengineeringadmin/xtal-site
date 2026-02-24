import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');
const COMPARE_DIR = path.join(process.cwd(), 'content/compare');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  author: string;
  authorTitle?: string;
  authorAvatar?: string;
  category: 'Ecommerce Search' | 'Comparisons' | 'Case Studies' | 'Tutorials' | 'Industry Insights';
  tags: string[];
  image?: string;
  draft: boolean;
  readTime: string;
  content?: string;
  headings?: { id: string; text: string; level: 2 | 3 }[];
}

export interface ComparisonPage {
  slug: string;
  title: string;
  description: string;
  competitor: string;
  competitorLogo?: string;
  date: string;
  updated?: string;
  draft: boolean;
  readTime: string;
  faqItems?: { question: string; answer: string }[];
  content?: string;
  headings?: { id: string; text: string; level: 2 | 3 }[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractHeadings(source: string): { id: string; text: string; level: 2 | 3 }[] {
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    headings.push({ id: slugify(text), text, level });
  }
  return headings;
}

function readMdxFiles(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
}

export function getAllPosts(): BlogPost[] {
  const files = readMdxFiles(BLOG_DIR);
  const posts = files
    .map((filename) => {
      const filePath = path.join(BLOG_DIR, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);
      const stats = readingTime(fileContent);
      const slug = filename.replace(/\.mdx$/, '');

      if (data.draft && process.env.NODE_ENV === 'production') return null;

      return {
        slug,
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        updated: data.updated,
        author: data.author || 'XTAL Team',
        authorTitle: data.authorTitle,
        authorAvatar: data.authorAvatar,
        category: data.category || 'Ecommerce Search',
        tags: data.tags || [],
        image: data.image,
        draft: data.draft || false,
        readTime: stats.text,
      } as BlogPost;
    })
    .filter(Boolean) as BlogPost[];

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  const stats = readingTime(fileContent);

  if (data.draft && process.env.NODE_ENV === 'production') return null;

  return {
    slug,
    title: data.title || '',
    description: data.description || '',
    date: data.date || '',
    updated: data.updated,
    author: data.author || 'XTAL Team',
    authorTitle: data.authorTitle,
    authorAvatar: data.authorAvatar,
    category: data.category || 'Ecommerce Search',
    tags: data.tags || [],
    image: data.image,
    draft: data.draft || false,
    readTime: stats.text,
    content,
    headings: extractHeadings(content),
  };
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter((post) => post.category === category);
}

export function getRelatedPosts(current: BlogPost, limit = 3): BlogPost[] {
  const allPosts = getAllPosts().filter((p) => p.slug !== current.slug);

  const scored = allPosts.map((post) => {
    let score = 0;
    if (post.category === current.category) score += 2;
    const sharedTags = post.tags.filter((tag) => current.tags.includes(tag));
    score += sharedTags.length;
    return { post, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);
}

export function getAllComparisons(): ComparisonPage[] {
  const files = readMdxFiles(COMPARE_DIR);
  const pages = files
    .map((filename) => {
      const filePath = path.join(COMPARE_DIR, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);
      const stats = readingTime(fileContent);
      const slug = filename.replace(/\.mdx$/, '');

      if (data.draft && process.env.NODE_ENV === 'production') return null;

      return {
        slug,
        title: data.title || '',
        description: data.description || '',
        competitor: data.competitor || '',
        competitorLogo: data.competitorLogo,
        date: data.date || '',
        updated: data.updated,
        draft: data.draft || false,
        readTime: stats.text,
        faqItems: data.faqItems,
      } as ComparisonPage;
    })
    .filter(Boolean) as ComparisonPage[];

  return pages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getComparisonBySlug(slug: string): ComparisonPage | null {
  const filePath = path.join(COMPARE_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  const stats = readingTime(fileContent);

  if (data.draft && process.env.NODE_ENV === 'production') return null;

  return {
    slug,
    title: data.title || '',
    description: data.description || '',
    competitor: data.competitor || '',
    competitorLogo: data.competitorLogo,
    date: data.date || '',
    updated: data.updated,
    draft: data.draft || false,
    readTime: stats.text,
    faqItems: data.faqItems,
    content,
    headings: extractHeadings(content),
  };
}

export { BLOG_CATEGORIES } from './blog-categories';
