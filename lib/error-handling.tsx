// ============================================================================
// ERROR HANDLING SYSTEM - PRODUCTION-READY RELIABILITY
// ============================================================================

import { toast } from 'sonner'

// Error types
export enum ErrorType {
  API = 'API_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  GENERATION = 'GENERATION_ERROR',
  PLATFORM_DETECTION = 'PLATFORM_DETECTION_ERROR',
  EXPORT = 'EXPORT_ERROR',
  IMPORT = 'IMPORT_ERROR',
  NETWORK = 'NETWORK_ERROR',
  UNEXPECTED = 'UNEXPECTED_ERROR'
}

// Error severity
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error interface
export interface AppError {
  type: ErrorType
  message: string
  severity: ErrorSeverity
  code?: string
  details?: string
  timestamp: Date
  retryable: boolean
  context?: Record<string, any>
  originalError?: Error | unknown
}

// Error handler options
export interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  logToServer?: boolean
  retry?: boolean
  maxRetries?: number
  fallback?: () => void | Promise<void>
  onError?: (error: AppError) => void | Promise<void>
}

// Default options
const defaultOptions: ErrorHandlerOptions = {
  showToast: true,
  logToConsole: true,
  logToServer: true,
  retry: false,
  maxRetries: 3,
  fallback: undefined,
  onError: undefined
}

// Retry state
const retryState = new Map<string, { count: number; lastAttempt: number }>()

/**
 * Create error object
 */
export function createError(
  type: ErrorType,
  message: string,
  options?: Partial<Omit<AppError, 'type' | 'message' | 'timestamp'>>
): AppError {
  return {
    type,
    message,
    severity: options?.severity || ErrorSeverity.ERROR,
    code: options?.code,
    details: options?.details,
    timestamp: new Date(),
    retryable: options?.retryable ?? false,
    context: options?.context,
    originalError: options?.originalError
  }
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: AppError): string {
  if (error.details) {
    return `${error.message}: ${error.details}`
  }
  return error.message
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  // Default messages by error type
  const defaultMessages: Record<ErrorType, string> = {
    [ErrorType.API]: 'We encountered an issue connecting to our service.',
    [ErrorType.VALIDATION]: 'Please check your input and try again.',
    [ErrorType.AUTHENTICATION]: 'Authentication failed. Please sign in again.',
    [ErrorType.GENERATION]: 'Content generation failed. Please try again.',
    [ErrorType.PLATFORM_DETECTION]: 'Platform detection failed. Try manual selection.',
    [ErrorType.EXPORT]: 'Export failed. Please try a different format.',
    [ErrorType.IMPORT]: 'Import failed. Please check your file format.',
    [ErrorType.NETWORK]: 'Network connection issue. Please check your internet.',
    [ErrorType.UNEXPECTED]: 'An unexpected error occurred. Please try again.'
  }

  // Use custom message if provided, otherwise use default
  return error.message || defaultMessages[error.type]
}

/**
 * Get actionable steps for error recovery
 */
export function getActionableSteps(error: AppError): string[] {
  const commonSteps = ['Refresh the page and try again.']
  
  switch (error.type) {
    case ErrorType.API:
      return [
        'Check your internet connection.',
        'Try again in a few moments.',
        'If the problem persists, contact support.'
      ]
      
    case ErrorType.VALIDATION:
      return [
        'Review the highlighted fields.',
        'Correct any invalid information.',
        'Ensure all required fields are filled.'
      ]
      
    case ErrorType.AUTHENTICATION:
      return [
        'Sign in again with your credentials.',
        'Reset your password if you\'re having trouble.',
        'Check if your account is active.'
      ]
      
    case ErrorType.GENERATION:
      return [
        'Try with a simpler product description.',
        'Select fewer platforms.',
        'Check your remaining usage limit.'
      ]
      
    case ErrorType.PLATFORM_DETECTION:
      return [
        'Try manual platform selection.',
        'Ensure your CSV has proper headers.',
        'Check if your platform is supported.'
      ]
      
    case ErrorType.EXPORT:
      return [
        'Try a different export format.',
        'Export smaller batches of data.',
        'Check if you have sufficient disk space.'
      ]
      
    case ErrorType.IMPORT:
      return [
        'Ensure your file format is supported.',
        'Check if the file is not corrupted.',
        'Try with a smaller file first.'
      ]
      
    case ErrorType.NETWORK:
      return [
        'Check your internet connection.',
        'Disable VPN or proxy if you\'re using one.',
        'Try again when your connection is stable.'
      ]
      
    default:
      return commonSteps
  }
}

/**
 * Log error to console
 */
function logToConsole(error: AppError): void {
  const { type, message, severity, code, details, timestamp, context, originalError } = error
  
  console.group(`[${severity.toUpperCase()}] ${type}: ${message}`)
  console.log('Timestamp:', timestamp.toISOString())
  if (code) console.log('Code:', code)
  if (details) console.log('Details:', details)
  if (context) console.log('Context:', context)
  if (originalError) console.error('Original Error:', originalError)
  console.groupEnd()
}

/**
 * Log error to server
 */
async function logToServer(error: AppError): Promise<void> {
  try {
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      const payload = {
        type: error.type,
        message: error.message,
        severity: error.severity,
        code: error.code,
        details: error.details,
        timestamp: error.timestamp.toISOString(),
        context: error.context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : '',
        // Don't include the original error as it might contain sensitive data
      }
      
      // Send to error tracking endpoint
      await fetch('/api/error-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Use keepalive to ensure the request completes even if the page is unloading
        keepalive: true
      })
    }
  } catch (err) {
    // Don't throw from error logger
    console.error('Failed to log error to server:', err)
  }
}

/**
 * Show error toast
 */
function showErrorToast(error: AppError): void {
  const message = getUserFriendlyMessage(error)
  
  switch (error.severity) {
    case ErrorSeverity.INFO:
      toast.info(message)
      break
    case ErrorSeverity.WARNING:
      toast.warning(message)
      break
    case ErrorSeverity.CRITICAL:
      toast.error(message, {
        duration: 10000, // 10 seconds for critical errors
        description: error.details
      })
      break
    default:
      toast.error(message, {
        description: error.details
      })
  }
}

/**
 * Check if retry is allowed
 */
function canRetry(error: AppError, options: ErrorHandlerOptions): boolean {
  if (!error.retryable || !options.retry) return false
  
  const key = `${error.type}:${error.code || 'unknown'}`
  const state = retryState.get(key) || { count: 0, lastAttempt: 0 }
  
  // Check max retries
  if (state.count >= (options.maxRetries || defaultOptions.maxRetries!)) {
    return false
  }
  
  // Update retry state
  retryState.set(key, {
    count: state.count + 1,
    lastAttempt: Date.now()
  })
  
  return true
}

/**
 * Reset retry state
 */
export function resetRetryState(type: ErrorType, code?: string): void {
  const key = `${type}:${code || 'unknown'}`
  retryState.delete(key)
}

/**
 * Main error handler
 */
export async function handleError(
  error: Error | AppError | unknown,
  options?: Partial<ErrorHandlerOptions>
): Promise<AppError> {
  // Merge options with defaults
  const mergedOptions = { ...defaultOptions, ...options }
  
  // Convert to AppError if needed
  let appError: AppError
  
  if ((error as AppError).type) {
    // Already an AppError
    appError = error as AppError
  } else if (error instanceof Error) {
    // Convert Error to AppError
    appError = createError(
      ErrorType.UNEXPECTED,
      error.message,
      {
        severity: ErrorSeverity.ERROR,
        details: error.stack,
        retryable: false,
        originalError: error
      }
    )
  } else {
    // Unknown error
    appError = createError(
      ErrorType.UNEXPECTED,
      'An unexpected error occurred',
      {
        severity: ErrorSeverity.ERROR,
        retryable: false,
        originalError: error
      }
    )
  }
  
  // Log to console
  if (mergedOptions.logToConsole) {
    logToConsole(appError)
  }
  
  // Log to server
  if (mergedOptions.logToServer) {
    await logToServer(appError)
  }
  
  // Show toast
  if (mergedOptions.showToast) {
    showErrorToast(appError)
  }
  
  // Call onError callback
  if (mergedOptions.onError) {
    await mergedOptions.onError(appError)
  }
  
  // Check if retry is allowed
  if (canRetry(appError, mergedOptions)) {
    // Execute fallback if provided
    if (mergedOptions.fallback) {
      await mergedOptions.fallback()
    }
  }
  
  return appError
}

/**
 * API error handler
 */
export async function handleApiError(
  error: Error | Response | unknown,
  options?: Partial<ErrorHandlerOptions>
): Promise<AppError> {
  let appError: AppError
  
  if (error instanceof Response) {
    // Handle fetch Response error
    try {
      const data = await error.json()
      appError = createError(
        ErrorType.API,
        data.message || `API Error: ${error.status} ${error.statusText}`,
        {
          code: data.code || `HTTP_${error.status}`,
          details: data.details || error.statusText,
          severity: error.status >= 500 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
          retryable: error.status >= 500 || error.status === 429,
          context: { status: error.status, url: error.url },
          originalError: error
        }
      )
    } catch {
      // Could not parse response JSON
      appError = createError(
        ErrorType.API,
        `API Error: ${error.status} ${error.statusText}`,
        {
          code: `HTTP_${error.status}`,
          severity: error.status >= 500 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
          retryable: error.status >= 500 || error.status === 429,
          context: { status: error.status, url: error.url },
          originalError: error
        }
      )
    }
  } else if (error instanceof Error) {
    // Network or other error
    const isNetworkError = error.message.includes('network') || 
                          error.message.includes('fetch') ||
                          error.message.includes('connection')
    
    appError = createError(
      isNetworkError ? ErrorType.NETWORK : ErrorType.API,
      isNetworkError ? 'Network connection issue' : `API Error: ${error.message}`,
      {
        details: error.stack,
        severity: ErrorSeverity.ERROR,
        retryable: isNetworkError,
        originalError: error
      }
    )
  } else {
    // Unknown error
    appError = createError(
      ErrorType.API,
      'Unknown API error occurred',
      {
        severity: ErrorSeverity.ERROR,
        retryable: false,
        originalError: error
      }
    )
  }
  
  return handleError(appError, options)
}

/**
 * Generation error handler with fallback chain
 */
export async function handleGenerationError(
  error: Error | unknown,
  fallbackChain: Array<() => Promise<any>>,
  options?: Partial<ErrorHandlerOptions>
): Promise<{ success: boolean; result?: any; error?: AppError }> {
  const appError = createError(
    ErrorType.GENERATION,
    error instanceof Error ? error.message : 'Content generation failed',
    {
      severity: ErrorSeverity.ERROR,
      retryable: true,
      originalError: error
    }
  )
  
  // Log error
  if (options?.logToConsole !== false) {
    logToConsole(appError)
  }
  
  // Try fallback chain
  for (const fallback of fallbackChain) {
    try {
      const result = await fallback()
      
      // Log recovery
      console.log('Generation recovered using fallback')
      
      // Show recovery toast
      if (options?.showToast !== false) {
        toast.success('Content generated using fallback method')
      }
      
      return { success: true, result }
    } catch (fallbackError) {
      console.error('Fallback generation failed:', fallbackError)
    }
  }
  
  // All fallbacks failed, handle the original error
  await handleError(appError, options)
  
  return { success: false, error: appError }
}

/**
 * Platform detection error handler
 */
export async function handlePlatformDetectionError(
  error: Error | unknown,
  options?: Partial<ErrorHandlerOptions> & {
    onManualSelection?: () => void
  }
): Promise<AppError> {
  const appError = createError(
    ErrorType.PLATFORM_DETECTION,
    error instanceof Error ? error.message : 'Platform detection failed',
    {
      severity: ErrorSeverity.WARNING,
      retryable: true,
      originalError: error
    }
  )
  
  // Custom toast with manual selection option
  if (options?.showToast !== false) {
    toast.warning('Platform detection failed', {
      description: 'We couldn\'t automatically detect your platform',
      action: {
        label: 'Select Manually',
        onClick: () => options.onManualSelection?.()
      }
    })
  }
  
  return handleError(appError, options)
}

/**
 * Export error handler
 */
export async function handleExportError(
  error: Error | unknown,
  options?: Partial<ErrorHandlerOptions> & {
    onTryAnotherFormat?: () => void
  }
): Promise<AppError> {
  const appError = createError(
    ErrorType.EXPORT,
    error instanceof Error ? error.message : 'Export failed',
    {
      severity: ErrorSeverity.ERROR,
      retryable: true,
      originalError: error
    }
  )
  
  // Custom toast with try another format option
  if (options?.showToast !== false) {
    toast.error('Export failed', {
      description: 'We couldn\'t export your content in this format',
      action: {
        label: 'Try Another Format',
        onClick: () => options.onTryAnotherFormat?.()
      }
    })
  }
  
  return handleError(appError, options)
}

/**
 * Create error boundary component
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode
    onError?: (error: Error, info: { componentStack: string }) => void
  }
): React.ComponentType<P> {
  return class ErrorBoundary extends React.Component<P, { hasError: boolean; error: Error | null }> {
    constructor(props: P) {
      super(props)
      this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
      // Log error
      logToConsole(createError(
        ErrorType.UNEXPECTED,
        error.message,
        {
          details: info.componentStack,
          severity: ErrorSeverity.ERROR,
          originalError: error
        }
      ))
      
      // Call onError callback
      options?.onError?.(error, info)
      
      // Log to server
      logToServer(createError(
        ErrorType.UNEXPECTED,
        error.message,
        {
          details: info.componentStack,
          severity: ErrorSeverity.ERROR,
          originalError: error
        }
      ))
    }

    render() {
      if (this.state.hasError) {
        if (options?.fallback) {
          return options.fallback
        }
        
        // Default fallback UI
        return (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        )
      }

      return <Component {...this.props} />
    }
  }
}

/**
 * Error tracking initialization
 */
export function initErrorTracking(): void {
  if (typeof window !== 'undefined') {
    // Global error handler
    window.addEventListener('error', (event) => {
      handleError(event.error || new Error(event.message), {
        showToast: false // Don't show toast for global errors
      })
      
      // Don't prevent default to allow browser's default error handling
      return false
    })
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      handleError(event.reason || new Error('Unhandled Promise Rejection'), {
        showToast: false // Don't show toast for unhandled rejections
      })
      
      // Don't prevent default
      return false
    })
    
    console.log('Error tracking initialized')
  }
}

// Export error utilities
export const ErrorUtils = {
  createError,
  formatErrorMessage,
  getUserFriendlyMessage,
  getActionableSteps,
  resetRetryState,
  handleError,
  handleApiError,
  handleGenerationError,
  handlePlatformDetectionError,
  handleExportError,
  withErrorBoundary,
  initErrorTracking
} as const