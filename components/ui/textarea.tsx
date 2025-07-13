import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  loading?: boolean
  showCharacterCount?: boolean
  maxCharacters?: number
  autoResize?: boolean
  resizable?: boolean
  minRows?: number
  maxRows?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    error, 
    loading = false,
    showCharacterCount = false,
    maxCharacters,
    autoResize = false,
    resizable = true,
    minRows = 3,
    maxRows = 10,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "")
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    
    const currentValue = value !== undefined ? value : internalValue
    const characterCount = String(currentValue).length
    const isOverLimit = maxCharacters && characterCount > maxCharacters

    React.useImperativeHandle(ref, () => textareaRef.current!, [])

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (!textarea || !autoResize) return

      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
      const minHeight = lineHeight * minRows
      const maxHeight = lineHeight * maxRows
      
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      textarea.style.height = `${newHeight}px`
    }, [autoResize, minRows, maxRows])

    React.useEffect(() => {
      adjustHeight()
    }, [currentValue, adjustHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
      adjustHeight()
    }

    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !resizable && "resize-none",
            resizable && !autoResize && "resize-y",
            autoResize && "resize-none overflow-hidden",
            error && "border-destructive focus-visible:ring-destructive",
            isOverLimit && "border-destructive focus-visible:ring-destructive",
            loading && "opacity-50",
            className
          )}
          value={currentValue}
          onChange={handleChange}
          disabled={loading || props.disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          style={autoResize ? { minHeight: `${minRows * 1.5}rem` } : undefined}
          {...props}
        />

        {loading && (
          <div className="absolute right-3 top-3">
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

        {/* Character count */}
        {showCharacterCount && maxCharacters && (
          <div className={cn(
            "mt-1 text-xs text-right transition-colors",
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
Textarea.displayName = "Textarea"

export { Textarea }