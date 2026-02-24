'use client';

import { useState, useEffect } from 'react';

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24" aria-label="Table of Contents">
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">On This Page</h4>
      <ul className="space-y-1.5 text-sm border-l border-slate-200">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block py-1 transition-colors border-l-2 -ml-px ${
                h.level === 3 ? 'pl-6' : 'pl-4'
              } ${
                activeId === h.id
                  ? 'border-l-xtal-navy text-xtal-navy font-medium'
                  : 'border-l-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
