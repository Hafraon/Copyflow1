import React from 'react'
import { useState } from 'react'
import { AlertCircle, RefreshCw, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorType, ErrorSeverity, getActionableSteps } from '@/lib/error-handling'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

interface ApiErrorMessageProps {
  title?: string
  message: string
  error?: {
    type?: ErrorType
    code?: string
    details?: string
    retryable?: boolean
  }
  onRetry?: () => void
  onDismiss?: () => void
  onSupport?: () => void
  className?: string
  showDetails?: boolean
}

export const ApiErrorMessage: React.FC<ApiErrorMessageProps> = ({
  title,
  message,
  error = {},
  onRetry,
  onDismiss,
  onSupport,
  className,
  showDetails = false
}) => {
  const [expanded, setExpanded] = useState(showDetails)
  
  const errorType = error.type || ErrorType.API
  const isRetryable = error.retryable !== false
  
  // Get actionable steps
  const steps = getActionableSteps({
    type: errorType,
    message,
    severity: ErrorSeverity.ERROR,
    code: error.code,
    details: error.details,
    timestamp: new Date(),
    retryable: isRetryable
  })

  return (
    <Card className={cn("border-red-200", className)}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <h3 className="font-medium text-red-900">
              {title || 'An error occurred'}
            </h3>
            <p className="text-sm text-red-700">
              {message}
            </p>
          </div>
        </div>
        
        {/* Actionable Steps */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-sm text-red-800 hover:text-red-900"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 mr-1" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-1" />
            )}
            {expanded ? 'Hide troubleshooting steps' : 'Show troubleshooting steps'}
          </button>
          
          {expanded && (
            <div className="pl-4 space-y-1 text-sm text-red-700">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Technical Details */}
        {expanded && error.details && (
          <div className="text-xs bg-red-50 p-2 rounded border border-red-100">
            <div className="font-medium text-red-800 mb-1">Technical Details:</div>
            <div className="text-red-700 font-mono whitespace-pre-wrap">
              {error.code && `Error Code: ${error.code}\n`}
              {error.details}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-3 bg-red-50 border-t border-red-100 flex justify-between">
        <div className="flex space-x-2">
          {isRetryable && onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          )}
          
          {onSupport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSupport}
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Get Support
            </Button>
          )}
        </div>
        
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="text-red-700 hover:bg-red-100"
          >
            Dismiss
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}