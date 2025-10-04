import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Legal AI - Intelligent Legal Assistant',
  description: 'AI-powered legal document analysis and case management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </SessionProvider>
      </body>
    </html>
  )
}
