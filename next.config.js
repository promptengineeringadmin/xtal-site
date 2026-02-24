/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', '@sparticuz/chromium', 'next-mdx-remote'],
    outputFileTracingIncludes: {
      '/blog/[slug]': ['./content/blog/*.mdx'],
      '/compare/[slug]': ['./content/compare/*.mdx'],
      '/api/sandbox/site-clone/[slug]': ['./public/sandbox/**/*'],
    },
  },
}

module.exports = nextConfig
