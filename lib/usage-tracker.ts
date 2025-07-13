import { UserPlanType } from './types'

// ============================================================================
// USAGE CALCULATION SYSTEM - Export=Import Workflow
// ============================================================================

/**
 * Calculate total usage cost for selected platforms
 * Logic: 1 base (Universal) + 0.5 per additional platform
 * Example: Universal + Amazon + Shopify = 1 + 0.5 + 0.5 = 2.0 generations
 */
export function calculateUsage(platforms: string[]): number {
  if (!platforms || platforms.length === 0) {
    return 1.0 // Universal is always included
  }
  
  // Universal is always included (base cost = 1.0)
  const baseUsage = 1.0
  
  // Count additional platforms (excluding 'universal')
  const additionalPlatforms = platforms.filter(platform => platform !== 'universal')
  const additionalUsage = additionalPlatforms.length * 0.5
  
  return baseUsage + additionalUsage
}

/**
 * Validate if requested usage is within plan limits
 */
export function validateUsage(
  currentUsage: number, 
  requestedUsage: number, 
  planLimit: number
): boolean {
  return (currentUsage + requestedUsage) <= planLimit
}

/**
 * Get generation limit based on subscription plan
 */
export function getPlanLimit(plan: UserPlanType): number {
  const planLimits = {
    free: 5,
    pro: 500,
    business: 2000
  }
  
  return planLimits[plan] || planLimits.free
}

/**
 * Get platform restrictions based on subscription plan
 */
export function getPlatformRestrictions(plan: UserPlanType): string[] {
  const restrictions = {
    free: ['universal'], // Only Universal platform
    pro: ['universal', 'amazon', 'shopify', 'instagram', 'tiktok', 'facebook'], // Universal + 4 additional max
    business: [] // No restrictions - unlimited platforms
  }
  
  return restrictions[plan] || restrictions.free
}

/**
 * Format usage display for UI
 * Example: "15 / 500 generations used"
 */
export function formatUsageDisplay(used: number, limit: number): string {
  const percentage = Math.round((used / limit) * 100)
  return `${used} / ${limit} generations used (${percentage}%)`
}

/**
 * Calculate total cost for selected platforms (same as calculateUsage but more explicit name)
 */
export function calculatePlatformCost(selectedPlatforms: string[]): number {
  return calculateUsage(selectedPlatforms)
}

/**
 * Check if additional usage would exceed plan limit
 */
export function isWithinLimit(
  currentUsage: number, 
  additionalUsage: number, 
  planLimit: number
): boolean {
  return (currentUsage + additionalUsage) <= planLimit
}

/**
 * Get detailed breakdown of usage calculation
 */
export function getUsageBreakdown(platforms: string[]): {
  base: number
  additional: number
  total: number
  platformBreakdown: { platform: string; cost: number }[]
} {
  const baseUsage = 1.0 // Universal always included
  
  // Filter out universal and calculate additional platforms
  const additionalPlatforms = platforms.filter(platform => platform !== 'universal')
  const additionalUsage = additionalPlatforms.length * 0.5
  
  // Create detailed breakdown per platform
  const platformBreakdown = [
    { platform: 'universal', cost: 1.0 },
    ...additionalPlatforms.map(platform => ({
      platform,
      cost: 0.5
    }))
  ]
  
  return {
    base: baseUsage,
    additional: additionalUsage,
    total: baseUsage + additionalUsage,
    platformBreakdown
  }
}

/**
 * Validate platform selection against plan restrictions
 */
export function validatePlatformSelection(
  selectedPlatforms: string[], 
  userPlan: UserPlanType
): { valid: boolean; error?: string; maxAllowed?: number } {
  const allowedPlatforms = getPlatformRestrictions(userPlan)
  
  // Business plan has no restrictions
  if (userPlan === 'business') {
    return { valid: true }
  }
  
  // Free plan: only Universal
  if (userPlan === 'free') {
    const hasOnlyUniversal = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'universal'
    if (!hasOnlyUniversal) {
      return {
        valid: false,
        error: 'Free plan supports Universal platform only. Upgrade to Pro for additional platforms.',
        maxAllowed: 1
      }
    }
    return { valid: true }
  }
  
  // Pro plan: Universal + up to 4 additional (max 5 total)
  if (userPlan === 'pro') {
    const maxPlatforms = 5 // Universal + 4 additional
    if (selectedPlatforms.length > maxPlatforms) {
      return {
        valid: false,
        error: `Pro plan supports up to ${maxPlatforms} platforms. Upgrade to Business for unlimited platforms.`,
        maxAllowed: maxPlatforms
      }
    }
    return { valid: true }
  }
  
  return { valid: true }
}

/**
 * Calculate monthly usage statistics
 */
export function calculateMonthlyUsage(
  generations: Array<{ platforms: string[]; created_at: Date }>
): {
  totalUsage: number
  platformUsage: Record<string, number>
  averageUsagePerGeneration: number
} {
  let totalUsage = 0
  const platformUsage: Record<string, number> = {}
  
  generations.forEach(generation => {
    const usage = calculateUsage(generation.platforms)
    totalUsage += usage
    
    // Track usage per platform
    generation.platforms.forEach(platform => {
      platformUsage[platform] = (platformUsage[platform] || 0) + (platform === 'universal' ? 1.0 : 0.5)
    })
  })
  
  const averageUsagePerGeneration = generations.length > 0 ? totalUsage / generations.length : 0
  
  return {
    totalUsage,
    platformUsage,
    averageUsagePerGeneration
  }
}

/**
 * Get upgrade recommendation based on usage patterns
 */
export function getUpgradeRecommendation(
  currentPlan: UserPlanType,
  monthlyUsage: number,
  platformsUsed: string[]
): {
  shouldUpgrade: boolean
  recommendedPlan?: UserPlanType
  reason?: string
  savings?: string
} {
  const currentLimit = getPlanLimit(currentPlan)
  const usagePercentage = (monthlyUsage / currentLimit) * 100
  
  // Free plan upgrade recommendations
  if (currentPlan === 'free') {
    if (usagePercentage > 80 || platformsUsed.length > 1) {
      return {
        shouldUpgrade: true,
        recommendedPlan: 'pro',
        reason: usagePercentage > 80 
          ? 'You\'re using 80%+ of your free generations'
          : 'You need additional platforms beyond Universal',
        savings: '100x more generations + all platforms for $19/month'
      }
    }
  }
  
  // Pro plan upgrade recommendations
  if (currentPlan === 'pro') {
    if (usagePercentage > 90 || platformsUsed.length > 5) {
      return {
        shouldUpgrade: true,
        recommendedPlan: 'business',
        reason: usagePercentage > 90
          ? 'You\'re using 90%+ of your Pro generations'
          : 'You need unlimited platforms',
        savings: '4x more generations + unlimited platforms + API access'
      }
    }
  }
  
  return { shouldUpgrade: false }
}

/**
 * Estimate cost for bulk CSV processing
 */
export function estimateBulkProcessingCost(
  productCount: number,
  selectedPlatforms: string[]
): {
  costPerProduct: number
  totalCost: number
  breakdown: string
} {
  const costPerProduct = calculateUsage(selectedPlatforms)
  const totalCost = productCount * costPerProduct
  
  const breakdown = `${productCount} products × ${costPerProduct} generations = ${totalCost} total generations`
  
  return {
    costPerProduct,
    totalCost,
    breakdown
  }
}

/**
 * Check if user can afford bulk processing
 */
export function canAffordBulkProcessing(
  currentUsage: number,
  planLimit: number,
  estimatedCost: number
): {
  canAfford: boolean
  remainingGenerations: number
  shortfall?: number
} {
  const remainingGenerations = planLimit - currentUsage
  const canAfford = remainingGenerations >= estimatedCost
  
  return {
    canAfford,
    remainingGenerations,
    shortfall: canAfford ? undefined : estimatedCost - remainingGenerations
  }
}

// ============================================================================
// CONSTANTS FOR USAGE TRACKING
// ============================================================================

export const USAGE_CONSTANTS = {
  BASE_COST: 1.0,           // Universal platform cost
  ADDITIONAL_COST: 0.5,     // Each additional platform cost
  FREE_LIMIT: 5,            // Free plan limit
  PRO_LIMIT: 500,           // Pro plan limit  
  BUSINESS_LIMIT: 2000,     // Business plan limit
  MAX_PLATFORMS_PRO: 5,     // Max platforms for Pro plan
  WARNING_THRESHOLD: 0.8,   // Show warning at 80% usage
  CRITICAL_THRESHOLD: 0.95  // Show critical warning at 95% usage
} as const

/**
 * Get usage status with color coding for UI
 */
export function getUsageStatus(used: number, limit: number): {
  status: 'safe' | 'warning' | 'critical' | 'exceeded'
  color: 'green' | 'yellow' | 'red'
  message: string
} {
  const percentage = used / limit
  
  if (used > limit) {
    return {
      status: 'exceeded',
      color: 'red',
      message: 'Usage limit exceeded. Please upgrade your plan.'
    }
  }
  
  if (percentage >= USAGE_CONSTANTS.CRITICAL_THRESHOLD) {
    return {
      status: 'critical',
      color: 'red',
      message: 'Critical: Nearly at usage limit. Consider upgrading.'
    }
  }
  
  if (percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD) {
    return {
      status: 'warning',
      color: 'yellow',
      message: 'Warning: Approaching usage limit.'
    }
  }
  
  return {
    status: 'safe',
    color: 'green',
    message: 'Usage within normal limits.'
  }
}