import * as React from "react"
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "error" | "warning" | "info" | "success"
  title?: string
  message: string
  details?: string[]
  actions?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  size?: "sm" | "default" | "lg"
  variant?: "default" | "filled" | "outlined"
}

const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ 
    className, 
    type = "error", 
    title, 
    message, 
    details, 
    actions,
    dismissible = false,
    onDismiss,
    size = "default",
    variant = "default",
    ...props 
  }, ref) => {
    const [dismissed, setDismissed] = React.useState(false)

    const handleDismiss = () => {
      setDismissed(true)
      onDismiss?.()
    }

    if (dismissed) return null

    const icons = {
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info,
      success: CheckCircle,
    }

    const Icon = icons[type]

    const typeClasses = {
      error: {
        default: "bg-red-50 border-red-200 text-red-800",
        filled: "bg-red-500 text-white",
        outlined: "border-red-500 text-red-700"
      },
      warning: {
        default: "bg-yellow-50 border-yellow-200 text-yellow-800",
        filled: "bg-yellow-500 text-white",
        outlined: "border-yellow-500 text-yellow-700"
      },
      info: {
        default: "bg-blue-50 border-blue-200 text-blue-800",
        filled: "bg-blue-500 text-white",
        outlined: "border-blue-500 text-blue-700"
      },
      success: {
        default: "bg-green-50 border-green-200 text-green-800",
        filled: "bg-green-500 text-white",
        outlined: "border-green-500 text-green-700"
      }
    }

    const sizeClasses = {
      sm: "p-3 text-sm",
      default: "p-4 text-sm",
      lg: "p-6 text-base"
    }

    const iconSizeClasses = {
      sm: "h-4 w-4",
      default: "h-5 w-5",
      lg: "h-6 w-6"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border",
          typeClasses[type][variant],
          sizeClasses[size],
          className
        )}
        role="alert"
        aria-live="polite"
        {...props}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <Icon 
              className={cn(
                iconSizeClasses[size],
                variant === "filled" ? "text-white" : ""
              )} 
              aria-hidden="true" 
            />
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={cn(
                "font-medium",
                size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base"
              )}>
                {title}
              </h3>
            )}
            
            <div className={cn(
              title && "mt-1",
              size === "sm" ? "text-xs" : "text-sm"
            )}>
              <p>{message}</p>
              
              {details && details.length > 0 && (
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>

            {actions && (
              <div className="mt-3">
                {actions}
              </div>
            )}
          </div>

          {dismissible && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className={cn(
                    "inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2",
                    variant === "filled" 
                      ? "text-white hover:bg-black/10 focus:ring-white focus:ring-offset-current"
                      : type === "error" 
                        ? "text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50"
                        : type === "warning"
                          ? "text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50"
                          : type === "info"
                            ? "text-blue-500 hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50"
                            : "text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50"
                  )}
                  aria-label="Dismiss"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)
ErrorMessage.displayName = "ErrorMessage"

// Specialized error components for common use cases
export interface FormErrorProps {
  errors: Record<string, any>
  className?: string
}

const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  ({ errors, className }, ref) => {
    const errorMessages = Object.entries(errors)
      .filter(([_, error]) => error?.message)
      .map(([field, error]) => `${field}: ${error.message}`)

    if (errorMessages.length === 0) return null

    return (
      <ErrorMessage
        ref={ref}
        type="error"
        title="Please fix the following errors:"
        message=""
        details={errorMessages}
        className={className}
      />
    )
  }
)
FormError.displayName = "FormError"

export interface APIErrorProps {
  error: {
    code?: string
    message: string
    details?: string[]
  }
  onRetry?: () => void
  className?: string
}

const APIError = React.forwardRef<HTMLDivElement, APIErrorProps>(
  ({ error, onRetry, className }, ref) => {
    const getErrorTitle = (code?: string) => {
      switch (code) {
        case 'NETWORK_ERROR':
          return 'Connection Error'
        case 'RATE_LIMIT':
          return 'Rate Limit Exceeded'
        case 'VALIDATION_ERROR':
          return 'Validation Error'
        case 'UNAUTHORIZED':
          return 'Authentication Required'
        case 'FORBIDDEN':
          return 'Access Denied'
        case 'NOT_FOUND':
          return 'Resource Not Found'
        case 'SERVER_ERROR':
          return 'Server Error'
        default:
          return 'An Error Occurred'
      }
    }

    const actions = onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Try Again
      </button>
    ) : undefined

    return (
      <ErrorMessage
        ref={ref}
        type="error"
        title={getErrorTitle(error.code)}
        message={error.message}
        details={error.details}
        actions={actions}
        dismissible
        className={className}
      />
    )
  }
)
APIError.displayName = "APIError"

export interface ValidationErrorProps {
  field: string
  message: string
  className?: string
}

const ValidationError = React.forwardRef<HTMLDivElement, ValidationErrorProps>(
  ({ field, message, className }, ref) => (
    <ErrorMessage
      ref={ref}
      type="error"
      message={message}
      size="sm"
      variant="outlined"
      className={cn("mt-1", className)}
    />
  )
)
ValidationError.displayName = "ValidationError"

export { ErrorMessage, FormError, APIError, ValidationError }