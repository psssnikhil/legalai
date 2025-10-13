import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SessionProvider from '@/components/SessionProvider'
import Sidebar from '@/components/Sidebar'
import AuthGuard from '@/components/AuthGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Legal AI - AI-Powered Legal Assistant',
    template: '%s | Legal AI'
  },
  description: 'Comprehensive legal practice management with AI-powered document drafting, case management, legal research, and intelligent document analysis for law firms.',
  keywords: [
    'legal AI',
    'legal assistant',
    'law firm software',
    'document drafting',
    'case management',
    'legal research',
    'legal dashboard',
    'case analysis',
    'legal analytics',
    'AI lawyer',
    'document analysis',
    'legal technology'
  ],
  authors: [{ name: 'Legal AI Team' }],
  creator: 'Legal AI Team',
  publisher: 'Legal AI',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://legalai.com',
    title: 'Legal AI - AI-Powered Legal Assistant',
    description: 'Comprehensive legal practice management with AI-powered insights, case management, and document tracking.',
    siteName: 'Legal AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Legal AI - AI-Powered Legal Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal AI - AI-Powered Legal Assistant',
    description: 'Comprehensive legal practice management with AI-powered insights, case management, and document tracking.',
    images: ['/og-image.png'],
    creator: '@legalai',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#1e40af',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Legal AI Platform',
              operatingSystem: 'Web Browser',
              applicationCategory: 'BusinessApplication',
              description: 'Comprehensive legal practice management with AI-powered document drafting, case management, and legal research tools for law firms.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: 'Free trial available',
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <AuthGuard>
            <div className="flex h-screen bg-gray-50">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </AuthGuard>
        </SessionProvider>
      </body>
    </html>
  )
}
