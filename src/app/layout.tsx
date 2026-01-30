import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { StructuredData } from '../../components/StructuredData'
import { DemoModalProvider } from '@/contexts/DemoModalContext'
import DemoModal from '@/components/DemoModal'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://xtalsearch.com'),
  title: 'XTAL Search | AI-Native Product Discovery for E-Commerce',
  description: "Help your customers find what they're looking for. Natural language search that understands intent, not just keywords.",
  keywords: ['e-commerce search', 'AI search', 'product discovery', 'natural language search', 'Shopify search', 'WooCommerce search', 'BigCommerce search', 'full-spectrum search'],
  authors: [{ name: 'XTAL Search' }],
  openGraph: {
    title: 'XTAL Search | AI-Native Product Discovery for E-Commerce',
    description: "Help your customers find what they're looking for. Natural language search that understands intent, not just keywords.",
    url: 'https://xtalsearch.com',
    siteName: 'XTAL Search',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'XTAL Search - Full-Spectrum Search for E-Commerce',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XTAL Search | AI-Native Product Discovery for E-Commerce',
    description: "Help your customers find what they're looking for. Natural language search that understands intent, not just keywords.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <StructuredData />
      </head>
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <DemoModalProvider>
          {children}
          <DemoModal />
        </DemoModalProvider>
      </body>
    </html>
  )
}
