import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean
  tooltip?: string
  helpText?: string
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, required = false, tooltip, helpText, children, ...props }, ref) => {
  const [showTooltip, setShowTooltip] = React.useState(false)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <LabelPrimitive.Root
          ref={ref}
          className={cn(labelVariants(), className)}
          {...props}
        >
          {children}
          {required && (
            <span className="text-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </LabelPrimitive.Root>

        {tooltip && (
          <div className="relative">
            <button
              type="button"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              aria-label="More information"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {showTooltip && (
              <div
                className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md border max-w-xs"
                role="tooltip"
              >
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
              </div>
            )}
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  )
})
Label.displayName = LabelPrimitive.Root.displayName

export { Label }