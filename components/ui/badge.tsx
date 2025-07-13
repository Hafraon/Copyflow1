import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-500/80",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-500/80",
        outline: "text-foreground",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-accent",
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
  pulse?: boolean
  dot?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, removable, onRemove, pulse, dot, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size }),
          pulse && "animate-pulse",
          className
        )}
        {...props}
      >
        {dot && (
          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
        )}
        {icon && <span className="mr-1">{icon}</span>}
        <span>{children}</span>
        {removable && (
          <button
            type="button"
            className="ml-1 rounded-full hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-white"
            onClick={onRemove}
            aria-label="Remove badge"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)
Badge.displayName = "Badge"

// Status Badge for specific use cases
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'online' | 'offline' | 'busy' | 'away' | 'pending' | 'success' | 'error' | 'warning'
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const statusVariants = {
      online: { variant: "success" as const, dot: true },
      offline: { variant: "secondary" as const, dot: true },
      busy: { variant: "destructive" as const, dot: true },
      away: { variant: "warning" as const, dot: true },
      pending: { variant: "info" as const, pulse: true },
      success: { variant: "success" as const },
      error: { variant: "destructive" as const },
      warning: { variant: "warning" as const }
    }

    const statusConfig = statusVariants[status]

    return (
      <Badge
        ref={ref}
        {...statusConfig}
        {...props}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

// Count Badge for notifications
export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number
  max?: number
  showZero?: boolean
}

const CountBadge = React.forwardRef<HTMLDivElement, CountBadgeProps>(
  ({ count, max = 99, showZero = false, ...props }, ref) => {
    if (count === 0 && !showZero) return null

    const displayCount = count > max ? `${max}+` : count.toString()

    return (
      <Badge
        ref={ref}
        size="sm"
        {...props}
      >
        {displayCount}
      </Badge>
    )
  }
)
CountBadge.displayName = "CountBadge"

export { Badge, badgeVariants, StatusBadge, CountBadge }