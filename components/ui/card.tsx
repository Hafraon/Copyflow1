import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "outline" | "ghost"
    hover?: boolean
  }
>(({ className, variant = "default", hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      variant === "outline" && "border-2",
      variant === "ghost" && "border-0 shadow-none",
      hover && "transition-all duration-200 hover:shadow-md hover:-translate-y-1",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    actions?: React.ReactNode
  }
>(({ className, children, actions, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  >
    {actions ? (
      <div className="flex items-start justify-between">
        <div className="flex flex-col space-y-1.5">
          {children}
        </div>
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      </div>
    ) : (
      children
    )}
  </div>
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  }
>(({ className, as: Component = "h3", ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean
  }
>(({ className, noPadding = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(noPadding ? "" : "p-6 pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    justify?: "start" | "center" | "end" | "between"
  }
>(({ className, justify = "start", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      justify === "start" && "justify-start",
      justify === "center" && "justify-center", 
      justify === "end" && "justify-end",
      justify === "between" && "justify-between",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Specialized card variants for CopyFlow
const FeatureCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon?: React.ReactNode
    title: string
    description: string
    badge?: string
    disabled?: boolean
  }
>(({ className, icon, title, description, badge, disabled = false, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
      disabled && "opacity-50 cursor-not-allowed hover:shadow-sm hover:translate-y-0",
      className
    )}
    {...props}
  >
    {badge && (
      <div className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
        {badge}
      </div>
    )}
    <CardHeader>
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  </Card>
))
FeatureCard.displayName = "FeatureCard"

const StatsCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string
    value: string | number
    change?: string
    changeType?: "positive" | "negative" | "neutral"
    icon?: React.ReactNode
  }
>(({ className, title, value, change, changeType = "neutral", icon, ...props }, ref) => (
  <Card ref={ref} className={cn("", className)} {...props}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className={cn(
          "text-xs",
          changeType === "positive" && "text-green-600",
          changeType === "negative" && "text-red-600",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </p>
      )}
    </CardContent>
  </Card>
))
StatsCard.displayName = "StatsCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  FeatureCard,
  StatsCard
}