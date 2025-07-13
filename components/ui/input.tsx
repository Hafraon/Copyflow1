import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  loading?: boolean
  showCharacterCount?: boolean
  maxCharacters?: number
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    error, 
    loading = false, 
    showCharacterCount = false, 
    maxCharacters,
    leftIcon,
    rightIcon,
    value,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "")
    const currentValue = value !== undefined ? value : internalValue
    const characterCount = String(currentValue).length
    const isOverLimit = maxCharacters && characterCount > maxCharacters

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      props.onChange?.(e)
    }

    return (
      <div className="relative">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              loading && "pr-10",
              error && "border-destructive focus-visible:ring-destructive",
              isOverLimit && "border-destructive focus-visible:ring-destructive",
              className
            )}
            ref={ref}
            value={currentValue}
            onChange={handleChange}
            disabled={loading || props.disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />

          {(rightIcon || loading) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {loading ? (
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {/* Character count */}
        {showCharacterCount && maxCharacters && (
          <div className={cn(
            "mt-1 text-xs text-right",
            isOverLimit ? "text-destructive" : "text-muted-foreground"
          )}>
            {characterCount}/{maxCharacters}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p 
            id={`${props.id}-error`}
            className="mt-1 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }