/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/client/v1/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },
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
