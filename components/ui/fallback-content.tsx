import React from 'react'
import { RefreshCw, AlertCircle, HelpCircle, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface FallbackContentProps {
  title?: string
  message?: string
  icon?: React.ReactNode
  onRetry?: () => void
  onHome?: () => void
  onSupport?: () => void
  className?: string
  children?: React.ReactNode
}

export const FallbackContent: React.FC<FallbackContentProps> = ({
  title = 'Content Unavailable',
  message = 'We couldn\'t load this content right now.',
  icon = <AlertCircle className="h-8 w-8 text-yellow-500" />,
  onRetry,
  onHome,
  onSupport,
  className,
  children
}) => {
  return (
    <Card className={cn("border-yellow-200 bg-yellow-50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-center space-x-2 text-yellow-900">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <p className="text-yellow-700">
          {message}
        </p>
        
        {children}
      </CardContent>
      
      <CardFooter className="flex justify-center space-x-4">
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {onHome && (
          <Button 
            variant="outline" 
            onClick={onHome}
            className="border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        )}
        
        {onSupport && (
          <Button 
            variant="outline" 
            onClick={onSupport}
            className="border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Get Support
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}