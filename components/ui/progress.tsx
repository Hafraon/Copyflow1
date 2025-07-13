import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  max?: number
  showPercentage?: boolean
  showValue?: boolean
  label?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "success" | "warning" | "destructive"
  animated?: boolean
  striped?: boolean
  formatValue?: (value: number, max: number) => string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value = 0, 
  max = 100,
  showPercentage = false,
  showValue = false,
  label,
  size = "default",
  variant = "default",
  animated = false,
  striped = false,
  formatValue = (val, maximum) => `${val}/${maximum}`,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3"
  }

  const variantClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500", 
    destructive: "bg-destructive"
  }

  return (
    <div className="w-full space-y-2">
      {/* Header with label and value/percentage */}
      {(label || showPercentage || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-foreground">{label}</span>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            {showValue && (
              <span>{formatValue(value, max)}</span>
            )}
            {showPercentage && (
              <span>{Math.round(percentage)}%</span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-full bg-secondary",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out",
            variantClasses[variant],
            animated && "animate-pulse",
            striped && "bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_20px] animate-[stripe_1s_linear_infinite]"
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Circular Progress variant
export interface CircularProgressProps {
  value?: number
  max?: number
  size?: number
  strokeWidth?: number
  showPercentage?: boolean
  variant?: "default" | "success" | "warning" | "destructive"
  className?: string
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ 
    value = 0, 
    max = 100, 
    size = 120, 
    strokeWidth = 8,
    showPercentage = true,
    variant = "default",
    className 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const variantColors = {
      default: "stroke-primary",
      success: "stroke-green-500",
      warning: "stroke-yellow-500",
      destructive: "stroke-destructive"
    }

    return (
      <div 
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-500 ease-out",
              variantColors[variant]
            )}
          />
        </svg>
        {/* Percentage text */}
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    )
  }
)
CircularProgress.displayName = "CircularProgress"

// Multi-step Progress
export interface StepProgressProps {
  steps: string[]
  currentStep: number
  variant?: "default" | "success" | "warning" | "destructive"
  className?: string
}

const StepProgress = React.forwardRef<HTMLDivElement, StepProgressProps>(
  ({ steps, currentStep, variant = "default", className }, ref) => {
    const variantClasses = {
      default: "bg-primary",
      success: "bg-green-500", 
      warning: "bg-yellow-500",
      destructive: "bg-destructive"
    }

    return (
      <div ref={ref} className={cn("w-full", className)}>
        <div className="flex items-center">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    index < currentStep
                      ? `${variantClasses[variant]} border-transparent text-white`
                      : index === currentStep
                      ? `border-primary bg-primary text-white`
                      : "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {index < currentStep ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="mt-2 text-xs text-center max-w-20">{step}</span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-full mx-2 transition-colors",
                    index < currentStep ? variantClasses[variant] : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }
)
StepProgress.displayName = "StepProgress"

export { Progress, CircularProgress, StepProgress }