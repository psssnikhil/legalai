import Dashboard from '@/components/Dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - AI Legal Assistant',
  description: 'Comprehensive legal practice dashboard with AI-powered insights, case management, document tracking, and intelligent analytics.',
  openGraph: {
    title: 'Dashboard | Legal AI - AI-Powered Legal Assistant',
    description: 'Comprehensive legal practice dashboard with AI-powered insights, case management, and document tracking.',
    type: 'website',
  },
}

export default function Home() {
  return <Dashboard />
}
