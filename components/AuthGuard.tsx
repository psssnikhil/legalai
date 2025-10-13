'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Scale } from 'lucide-react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // Don't protect auth pages
  const isAuthPage = pathname?.startsWith('/auth/')

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session && !isAuthPage) {
      router.push('/auth/signin')
    }
  }, [session, status, router, isAuthPage])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If on auth page, render children directly without layout
  if (isAuthPage) {
    return <>{children}</>
  }

  // If not authenticated and not on auth page, show loading (will redirect)
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // If authenticated, just render children (layout.tsx will handle Sidebar)
  return <>{children}</>
}
