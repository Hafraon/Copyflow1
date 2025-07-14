'use client'

import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import LanguageProvider from '@/components/providers/LanguageProvider'

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
    <LanguageProvider>
      <ErrorBoundary>
        {children}
        <Toaster />
      </ErrorBoundary>
    </LanguageProvider>
  )
}