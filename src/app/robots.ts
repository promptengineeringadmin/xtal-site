import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/sandbox/'],
      },
    ],
    sitemap: 'https://xtalsearch.com/sitemap.xml',
  };
}
