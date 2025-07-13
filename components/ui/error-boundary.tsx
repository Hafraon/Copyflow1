import React from 'react'
import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorType, ErrorSeverity, getActionableSteps } from '@/lib/error-handling'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
  onError?: (error: Error, info: { componentStack: string }) => void
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: { componentStack: string } | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ errorInfo })
    
    // Call onError callback
    this.props.onError?.(error, errorInfo)
    
    // Log error to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo)
    }
    
    // In production, log to error tracking service
    if (process.env.NODE_ENV === 'production') {
      try {
        fetch('/api/error-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: ErrorType.UNEXPECTED,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            severity: ErrorSeverity.ERROR,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
          }),
          keepalive: true
        })
      } catch (err) {
        // Silently fail if error tracking fails
        console.error('Failed to log error to server:', err)
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  handleGetSupport = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/support'
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // Default fallback UI
      return (
        <div className={cn("min-h-[300px] flex items-center justify-center p-4", this.props.className)}>
          <Card className="w-full max-w-md border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>Something went wrong</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 rounded-md border border-red-100">
                <p className="text-sm text-red-800 font-medium mb-2">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                {process.env.NODE_ENV !== 'production' && this.state.error?.stack && (
                  <pre className="text-xs text-red-700 overflow-auto max-h-32 p-2 bg-red-100 rounded">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Try these steps:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {getActionableSteps({
                    type: ErrorType.UNEXPECTED,
                    message: this.state.error?.message || '',
                    severity: ErrorSeverity.ERROR,
                    timestamp: new Date(),
                    retryable: true
                  }).map((step, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={this.handleGoHome}>
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                <Button variant="outline" size="sm" onClick={this.handleGetSupport}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Get Support
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for ErrorBoundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WithErrorBoundary.displayName = `WithErrorBoundary(${Component.displayName || Component.name || 'Component'})`
  
  return WithErrorBoundary
}