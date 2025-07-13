import { useState, useCallback } from 'react'
import { 
  handleError, 
  handleApiError, 
  handleGenerationError, 
  handlePlatformDetectionError, 
  handleExportError,
  ErrorType,
  ErrorSeverity,
  AppError
} from '@/lib/error-handling'

interface UseErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  logToServer?: boolean
  onError?: (error: AppError) => void
}

export function useErrorHandler(options?: UseErrorHandlerOptions) {
  const [lastError, setLastError] = useState<AppError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Generic error handler
  const catchError = useCallback(async (
    fn: () => Promise<any>,
    errorType: ErrorType = ErrorType.UNEXPECTED,
    context?: Record<string, any>
  ) => {
    setIsLoading(true)
    setLastError(null)
    
    try {
      const result = await fn()
      setIsLoading(false)
      return { success: true, data: result }
    } catch (error) {
      const appError = await handleError(error, {
        type: errorType,
        context,
        ...options
      })
      
      setLastError(appError)
      setIsLoading(false)
      return { success: false, error: appError }
    }
  }, [options])
  
  // API error handler
  const catchApiError = useCallback(async (
    fn: () => Promise<Response>,
    context?: Record<string, any>
  ) => {
    setIsLoading(true)
    setLastError(null)
    
    try {
      const response = await fn()
      
      if (!response.ok) {
        const appError = await handleApiError(response, {
          context,
          ...options
        })
        
        setLastError(appError)
        setIsLoading(false)
        return { success: false, error: appError }
      }
      
      const data = await response.json()
      setIsLoading(false)
      return { success: true, data }
    } catch (error) {
      const appError = await handleApiError(error, {
        context,
        ...options
      })
      
      setLastError(appError)
      setIsLoading(false)
      return { success: false, error: appError }
    }
  }, [options])
  
  // Generation error handler with fallback chain
  const catchGenerationError = useCallback(async (
    fn: () => Promise<any>,
    fallbackChain: Array<() => Promise<any>>,
    context?: Record<string, any>
  ) => {
    setIsLoading(true)
    setLastError(null)
    
    try {
      const result = await fn()
      setIsLoading(false)
      return { success: true, data: result }
    } catch (error) {
      const result = await handleGenerationError(error, fallbackChain, {
        context,
        ...options
      })
      
      if (!result.success && result.error) {
        setLastError(result.error)
      }
      
      setIsLoading(false)
      return result
    }
  }, [options])
  
  // Platform detection error handler
  const catchPlatformDetectionError = useCallback(async (
    fn: () => Promise<any>,
    onManualSelection?: () => void,
    context?: Record<string, any>
  ) => {
    setIsLoading(true)
    setLastError(null)
    
    try {
      const result = await fn()
      setIsLoading(false)
      return { success: true, data: result }
    } catch (error) {
      const appError = await handlePlatformDetectionError(error, {
        onManualSelection,
        context,
        ...options
      })
      
      setLastError(appError)
      setIsLoading(false)
      return { success: false, error: appError }
    }
  }, [options])
  
  // Export error handler
  const catchExportError = useCallback(async (
    fn: () => Promise<any>,
    onTryAnotherFormat?: () => void,
    context?: Record<string, any>
  ) => {
    setIsLoading(true)
    setLastError(null)
    
    try {
      const result = await fn()
      setIsLoading(false)
      return { success: true, data: result }
    } catch (error) {
      const appError = await handleExportError(error, {
        onTryAnotherFormat,
        context,
        ...options
      })
      
      setLastError(appError)
      setIsLoading(false)
      return { success: false, error: appError }
    }
  }, [options])
  
  // Clear last error
  const clearError = useCallback(() => {
    setLastError(null)
  }, [])
  
  return {
    catchError,
    catchApiError,
    catchGenerationError,
    catchPlatformDetectionError,
    catchExportError,
    lastError,
    isLoading,
    clearError
  }
}