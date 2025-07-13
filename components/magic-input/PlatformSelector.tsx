import React from 'react'
import { Check, Lock, Crown, Zap, ShoppingCart, Instagram, Video, Facebook, Package, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLATFORMS, getPlatformById } from '@/lib/utils'
import { UserPlanType } from '@/lib/types'
import { 
  calculateUsage, 
  getPlatformRestrictions, 
  validatePlatformSelection,
  getUsageBreakdown,
  getUpgradeRecommendation
} from '@/lib/usage-tracker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Platform icons mapping
const PLATFORM_ICONS = {
  universal: Zap,
  amazon: ShoppingCart,
  shopify: Package,
  instagram: Instagram,
  tiktok: Video,
  facebook: Facebook,
  ebay: Package,
  etsy: Palette,
} as const

interface PlatformSelectorProps {
  selectedPlatforms: string[]
  onPlatformsChange: (platforms: string[]) => void
  userPlan: UserPlanType
  currentUsage: number
  planLimit: number
  className?: string
  error?: string
  disabled?: boolean
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformsChange,
  userPlan,
  currentUsage,
  planLimit,
  className,
  error,
  disabled = false
}) => {
  // Ensure Universal is always selected
  React.useEffect(() => {
    if (!selectedPlatforms.includes('universal')) {
      onPlatformsChange(['universal', ...selectedPlatforms.filter(p => p !== 'universal')])
    }
  }, [selectedPlatforms, onPlatformsChange])

  // Get platform restrictions for current plan
  const allowedPlatforms = getPlatformRestrictions(userPlan)
  const isBusinessPlan = userPlan === 'business'

  // Calculate usage breakdown
  const usageBreakdown = getUsageBreakdown(selectedPlatforms)
  const totalCost = usageBreakdown.total

  // Validate platform selection
  const platformValidation = validatePlatformSelection(selectedPlatforms, userPlan)

  // Get upgrade recommendation
  const upgradeRecommendation = getUpgradeRecommendation(
    userPlan,
    currentUsage + totalCost,
    selectedPlatforms
  )

  const handlePlatformToggle = (platformId: string) => {
    if (disabled) return
    
    // Universal cannot be deselected
    if (platformId === 'universal') return

    const isSelected = selectedPlatforms.includes(platformId)
    
    if (isSelected) {
      // Remove platform
      onPlatformsChange(selectedPlatforms.filter(p => p !== platformId))
    } else {
      // Add platform (check restrictions)
      const newPlatforms = [...selectedPlatforms, platformId]
      const validation = validatePlatformSelection(newPlatforms, userPlan)
      
      if (validation.valid) {
        onPlatformsChange(newPlatforms)
      }
    }
  }

  const isPlatformDisabled = (platformId: string) => {
    if (disabled) return true
    if (platformId === 'universal') return true // Always selected, can't change
    
    // Check plan restrictions
    if (userPlan === 'free') return true
    if (userPlan === 'pro' && !allowedPlatforms.includes(platformId)) return false
    if (userPlan === 'pro' && selectedPlatforms.length >= 5 && !selectedPlatforms.includes(platformId)) return true
    
    return false
  }

  const getPlatformBadge = (platformId: string) => {
    if (platformId === 'universal') {
      return <Badge variant="success" size="sm">Free</Badge>
    }
    return <Badge variant="outline" size="sm">+0.5</Badge>
  }

  const getPlatformDescription = (platformId: string) => {
    const platform = getPlatformById(platformId)
    return platform?.description || ''
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with usage calculation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Platform Selection
            <div className="text-sm font-normal text-muted-foreground">
              {usageBreakdown.base} base + {usageBreakdown.additional} additional = {usageBreakdown.total} generations
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Usage calculation: {currentUsage} used + {totalCost} requested = {currentUsage + totalCost} / {planLimit}
            </span>
            {(currentUsage + totalCost) > planLimit && (
              <Badge variant="destructive">Exceeds limit</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id)
          const isDisabled = isPlatformDisabled(platform.id)
          const Icon = PLATFORM_ICONS[platform.id as keyof typeof PLATFORM_ICONS] || Package
          const needsUpgrade = userPlan === 'free' && platform.id !== 'universal'

          return (
            <Card
              key={platform.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-primary bg-primary/5',
                isDisabled && 'opacity-50 cursor-not-allowed',
                needsUpgrade && 'border-yellow-200 bg-yellow-50'
              )}
              onClick={() => !isDisabled && handlePlatformToggle(platform.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Checkbox */}
                  <div className={cn(
                    'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                    isSelected 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground',
                    isDisabled && 'opacity-50'
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  {/* Platform info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{platform.name}</span>
                      </div>
                      {getPlatformBadge(platform.id)}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {getPlatformDescription(platform.id)}
                    </p>

                    {/* Upgrade message for free plan */}
                    {needsUpgrade && (
                      <div className="flex items-center space-x-1 text-xs text-yellow-700">
                        <Lock className="h-3 w-3" />
                        <span>Upgrade to Pro required</span>
                      </div>
                    )}

                    {/* Pro plan limit warning */}
                    {userPlan === 'pro' && selectedPlatforms.length >= 5 && !isSelected && (
                      <div className="flex items-center space-x-1 text-xs text-yellow-700">
                        <Crown className="h-3 w-3" />
                        <span>Pro plan limit reached</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Usage breakdown */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Usage Breakdown:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              {usageBreakdown.platformBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="capitalize">{item.platform}</span>
                  <span>{item.cost} generation{item.cost !== 1 ? 's' : ''}</span>
                </div>
              ))}
              <div className="border-t pt-1 flex justify-between font-medium text-foreground">
                <span>Total Cost</span>
                <span>{totalCost} generation{totalCost !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {(error || !platformValidation.valid) && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {error || platformValidation.error}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade suggestion */}
      {upgradeRecommendation.shouldUpgrade && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Upgrade Recommended
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  {upgradeRecommendation.reason}
                </p>
                {upgradeRecommendation.savings && (
                  <p className="text-xs text-blue-600 font-medium">
                    {upgradeRecommendation.savings}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                Upgrade to {upgradeRecommendation.recommendedPlan}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan info */}
      <div className="text-xs text-muted-foreground text-center">
        <span className="capitalize">{userPlan}</span> plan: {' '}
        {userPlan === 'free' && 'Universal platform only'}
        {userPlan === 'pro' && 'Universal + up to 4 additional platforms'}
        {userPlan === 'business' && 'Unlimited platforms'}
      </div>
    </div>
  )
}