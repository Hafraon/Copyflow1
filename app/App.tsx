'use client'

import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/lib/error-handling'

export default function App({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Client-side initialization
    if (typeof window !== 'undefined') {
      // Initialize error tracking only on client side
      const initErrorTracking = async () => {
        const { initErrorTracking: init } = await import('@/lib/error-handling')
        init()
      }
      initErrorTracking()
    }
  }, [])

  return (
    <ErrorBoundary>
      {children}
      <Toaster />
    </ErrorBoundary>
  )
}