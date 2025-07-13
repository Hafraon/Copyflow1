import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"
import { ErrorMessage } from "./error-message"

export interface FieldWrapperProps {
  children: React.ReactNode
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  tooltip?: string
  className?: string
  labelClassName?: string
  errorClassName?: string
  helperClassName?: string
  disabled?: boolean
  loading?: boolean
  size?: "sm" | "default" | "lg"
  layout?: "vertical" | "horizontal"
  labelWidth?: string
}

const FieldWrapper = React.forwardRef<HTMLDivElement, FieldWrapperProps>(
  ({ 
    children,
    label,
    required = false,
    error,
    helperText,
    tooltip,
    className,
    labelClassName,
    errorClassName,
    helperClassName,
    disabled = false,
    loading = false,
    size = "default",
    layout = "vertical",
    labelWidth = "150px",
    ...props 
  }, ref) => {
    const fieldId = React.useId()

    const sizeClasses = {
      sm: "space-y-1",
      default: "space-y-2",
      lg: "space-y-3"
    }

    const labelSizeClasses = {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base"
    }

    const helperSizeClasses = {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-sm"
    }

    if (layout === "horizontal") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-start gap-4",
            disabled && "opacity-50 pointer-events-none",
            className
          )}
          {...props}
        >
          {label && (
            <div 
              className="flex-shrink-0 pt-2"
              style={{ width: labelWidth }}
            >
              <Label
                htmlFor={fieldId}
                required={required}
                tooltip={tooltip}
                className={cn(
                  labelSizeClasses[size],
                  error && "text-destructive",
                  labelClassName
                )}
              >
                {label}
              </Label>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="relative">
              {React.cloneElement(children as React.ReactElement, {
                id: fieldId,
                'aria-invalid': !!error,
                'aria-describedby': error ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined,
                disabled: disabled || loading,
              })}
              
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg
                    className="h-4 w-4 animate-spin text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Helper text */}
            {helperText && !error && (
              <p
                id={`${fieldId}-helper`}
                className={cn(
                  "text-muted-foreground mt-1",
                  helperSizeClasses[size],
                  helperClassName
                )}
              >
                {helperText}
              </p>
            )}

            {/* Error message */}
            {error && (
              <div
                id={`${fieldId}-error`}
                className={cn("mt-1", errorClassName)}
              >
                <ErrorMessage
                  type="error"
                  message={error}
                  size="sm"
                  variant="outlined"
                />
              </div>
            )}
          </div>
        </div>
      )
    }

    // Vertical layout (default)
    return (
      <div
        ref={ref}
        className={cn(
          sizeClasses[size],
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        {...props}
      >
        {label && (
          <Label
            htmlFor={fieldId}
            required={required}
            tooltip={tooltip}
            className={cn(
              labelSizeClasses[size],
              error && "text-destructive",
              labelClassName
            )}
          >
            {label}
          </Label>
        )}

        <div className="relative">
          {React.cloneElement(children as React.ReactElement, {
            id: fieldId,
            'aria-invalid': !!error,
            'aria-describedby': error ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined,
            disabled: disabled || loading,
          })}
          
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-4 w-4 animate-spin text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Helper text */}
        {helperText && !error && (
          <p
            id={`${fieldId}-helper`}
            className={cn(
              "text-muted-foreground",
              helperSizeClasses[size],
              helperClassName
            )}
          >
            {helperText}
          </p>
        )}

        {/* Error message */}
        {error && (
          <div
            id={`${fieldId}-error`}
            className={cn(errorClassName)}
          >
            <ErrorMessage
              type="error"
              message={error}
              size="sm"
              variant="outlined"
            />
          </div>
        )}
      </div>
    )
  }
)
FieldWrapper.displayName = "FieldWrapper"

// Specialized field wrappers for common use cases
export interface FormFieldWrapperProps extends FieldWrapperProps {
  name: string
  control?: any // react-hook-form control
}

const FormFieldWrapper = React.forwardRef<HTMLDivElement, FormFieldWrapperProps>(
  ({ name, control, children, ...props }, ref) => {
    // This would integrate with react-hook-form's useController
    // For now, it's a simple wrapper
    return (
      <FieldWrapper ref={ref} {...props}>
        {children}
      </FieldWrapper>
    )
  }
)
FormFieldWrapper.displayName = "FormFieldWrapper"

// Grid layout for multiple fields
export interface FieldGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: "sm" | "default" | "lg"
  className?: string
}

const FieldGrid = React.forwardRef<HTMLDivElement, FieldGridProps>(
  ({ children, columns = 2, gap = "default", className }, ref) => {
    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    }

    const gapClasses = {
      sm: "gap-3",
      default: "gap-4",
      lg: "gap-6"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
      >
        {children}
      </div>
    )
  }
)
FieldGrid.displayName = "FieldGrid"

// Field group for related fields
export interface FieldGroupProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ 
    children, 
    title, 
    description, 
    className, 
    collapsible = false,
    defaultCollapsed = false 
  }, ref) => {
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

    return (
      <div
        ref={ref}
        className={cn(
          "space-y-4 p-4 border rounded-lg bg-card",
          className
        )}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium leading-6 text-foreground">
                  {title}
                </h3>
                {collapsible && (
                  <button
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={collapsed ? "Expand section" : "Collapse section"}
                  >
                    <svg
                      className={cn(
                        "h-5 w-5 transition-transform",
                        collapsed && "rotate-180"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        
        {(!collapsible || !collapsed) && (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    )
  }
)
FieldGroup.displayName = "FieldGroup"

export { 
  FieldWrapper, 
  FormFieldWrapper, 
  FieldGrid, 
  FieldGroup 
}