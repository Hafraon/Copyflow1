import React from 'react'
import { lazy, Suspense } from 'react'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface AppProps {
  children: React.ReactNode
}

// Lazy-loaded components
const LazyToaster = lazy(() => import('sonner').then(mod => ({ default: mod.Toaster })))
export default function App({ children }: AppProps) {
  const router = useRouter()

  const handleReset = () => {
    // Refresh the current page
    window.location.reload()
  }

  const handleGoHome = () => {
    // Navigate to home page
    router.push('/')
  }

  const handleGetSupport = () => {
    // Navigate to support page
    router.push('/support')
  }

  return (
    <>
      <ErrorBoundary
        onReset={handleReset}
        onError={(error, info) => {
          // Log error to console in development
          if (process.env.NODE_ENV !== 'production') {
            console.error('Root error boundary caught error:', error, info)
          }
        }}
      >
        {children}
      </ErrorBoundary>
      
      <Suspense fallback={null}>
        <LazyToaster 
          position="top-right"
          toastOptions={{
            duration: 5000,
            className: "toast-custom",
            style: {
              borderRadius: '0.5rem',
              padding: '1rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }
          }}
        />
      </Suspense>
    </>
  )
}