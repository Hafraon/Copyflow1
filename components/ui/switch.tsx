import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  loading?: boolean
  size?: "sm" | "default" | "lg"
  label?: string
  description?: string
  error?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, loading = false, size = "default", label, description, error, disabled, ...props }, ref) => {
  const sizeClasses = {
    sm: "h-4 w-7",
    default: "h-6 w-11", 
    lg: "h-7 w-12"
  }

  const thumbSizeClasses = {
    sm: "h-3 w-3 data-[state=checked]:translate-x-3",
    default: "h-5 w-5 data-[state=checked]:translate-x-5",
    lg: "h-5 w-5 data-[state=checked]:translate-x-5"
  }

  const switchElement = (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        sizeClasses[size],
        loading && "cursor-not-allowed opacity-50",
        error && "data-[state=checked]:bg-destructive",
        className
      )}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0",
          thumbSizeClasses[size],
          loading && "flex items-center justify-center"
        )}
      >
        {loading && (
          <svg
            className="h-2 w-2 animate-spin"
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
        )}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )

  if (label || description || error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          {switchElement}
          {label && (
            <label 
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                error && "text-destructive"
              )}
              onClick={() => !disabled && !loading && props.onCheckedChange?.(!props.checked)}
            >
              {label}
            </label>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return switchElement
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }