import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateContent } from '@/lib/openai-client'
import { 
  calculateUsage, 
  validateUsage, 
  getPlanLimit,
  validatePlatformSelection,
  getUsageStatus 
} from '@/lib/usage-tracker'
import { handleError, ErrorType, ErrorSeverity } from '@/lib/error-handling'
import { 
  CopyFlowOutput, 
  GenerationRequest, 
  UserPlanType,
  EmojiSettings 
} from '@/lib/types'

// Response cache (in-memory for development, use Redis in production)
const responseCache = new Map<string, { data: TextGenerationResponse; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// ============================================================================
// TEXT GENERATION API - REAL OPENAI ASSISTANT INTEGRATION
// ============================================================================

// Request validation schema
const TextGenerationRequestSchema = z.object({
  // User context
  userId: z.string().min(1, 'User ID is required'),
  userPlan: z.enum(['free', 'pro', 'business']).default('free'),
  
  // Product information
  productName: z.string().min(1, 'Product name is required').max(200),
  category: z.string().min(1, 'Category is required'),
  productDescription: z.string().max(2000).optional(),
  keyFeatures: z.array(z.string().max(200)).max(10).default([]),
  
  // Generation settings
  writingStyle: z.enum(['professional', 'casual', 'luxury', 'technical', 'creative']),
  language: z.enum(['en', 'uk', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'zh', 'ja', 'ar']),
  selectedPlatforms: z.array(z.string()).min(1, 'At least one platform required'),
  
  // Emoji settings
  emojiSettings: z.object({
    enabled: z.boolean(),
    intensity: z.enum(['low', 'medium', 'high']),
    categorySpecific: z.boolean(),
    intensityConfig: z.object({
      low: z.object({ count: z.string(), example: z.string() }),
      medium: z.object({ count: z.string(), example: z.string() }),
      high: z.object({ count: z.string(), example: z.string() })
    })
  }),
  
  // Current usage for validation
  currentUsage: z.number().min(0).default(0)
})

type TextGenerationRequest = z.infer<typeof TextGenerationRequestSchema>

// Response interface
interface TextGenerationResponse {
  success: boolean
  data?: CopyFlowOutput
  usageInfo: {
    used: number
    limit: number
    remaining: number
    cost: number
  }
  processingInfo?: {
    assistantUsed: string
    processingTime: number
    tokensConsumed: number
    confidenceScore: number
  }
  error?: string
  errorCode?: string
}

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting check
 */
function checkRateLimit(userId: string, userPlan: UserPlanType): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  
  // Rate limits per plan
  const limits = {
    free: 10,      // 10 requests per minute
    pro: 60,       // 60 requests per minute
    business: 200  // 200 requests per minute
  }
  
  const limit = limits[userPlan]
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= limit) {
    return false // Rate limited
  }
  
  userLimit.count++
  return true
}

/**
 * Validate user permissions and usage
 */
function validateUserRequest(request: TextGenerationRequest): { valid: boolean; error?: string } {
  // Validate platform selection
  const platformValidation = validatePlatformSelection(request.selectedPlatforms, request.userPlan)
  if (!platformValidation.valid) {
    return { valid: false, error: platformValidation.error }
  }
  
  // Calculate usage cost
  const usageCost = calculateUsage(request.selectedPlatforms)
  const planLimit = getPlanLimit(request.userPlan)
  
  // Validate usage limit
  if (!validateUsage(request.currentUsage, usageCost, planLimit)) {
    return { 
      valid: false, 
      error: `Insufficient usage limit. Need ${usageCost} generations, but only ${planLimit - request.currentUsage} remaining.`
    }
  }
  
  return { valid: true }
}

/**
 * Generate cache key for request
 */
function generateCacheKey(request: TextGenerationRequest): string {
  // Create a deterministic key from request properties
  const key = {
    productName: request.productName,
    category: request.category,
    writingStyle: request.writingStyle,
    platforms: [...request.selectedPlatforms].sort(),
    language: request.language,
    emojiEnabled: request.emojiSettings.enabled,
    emojiIntensity: request.emojiSettings.intensity
  }
  
  return JSON.stringify(key)
}

/**
 * Get cached response
 */
function getCachedResponse(key: string): TextGenerationResponse | null {
  const cached = responseCache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL) {
    responseCache.delete(key)
    return null
  }
  
  return cached.data
}

/**
 * Cache response
 */
function cacheResponse(key: string, response: TextGenerationResponse): void {
  responseCache.set(key, {
    data: response,
    timestamp: Date.now()
  })
  
  // Limit cache size
  if (responseCache.size > 1000) {
    // Remove oldest entries
    const entries = Array.from(responseCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 100)
      
    entries.forEach(([key]) => responseCache.delete(key))
  }
}

/**
 * Build generation request for OpenAI client
 */
function buildGenerationRequest(request: TextGenerationRequest): GenerationRequest {
  return {
    inputMethod: 'text',
    productName: request.productName,
    productDescription: request.productDescription,
    keyFeatures: request.keyFeatures,
    category: request.category,
    writingStyle: request.writingStyle,
    platforms: request.selectedPlatforms,
    language: request.language,
    emojiSettings: request.emojiSettings,
    userId: request.userId,
    userPlan: {
      type: request.userPlan,
      generationsLimit: getPlanLimit(request.userPlan),
      platformsAllowed: request.userPlan === 'business' ? 999 : request.userPlan === 'pro' ? 5 : 1,
      features: {
        csvBulkProcessing: request.userPlan !== 'free',
        urlIntelligence: request.userPlan !== 'free',
        apiAccess: request.userPlan === 'business',
        prioritySupport: request.userPlan !== 'free',
        whiteLabel: request.userPlan === 'business'
      },
      pricing: {
        monthly: request.userPlan === 'free' ? 0 : request.userPlan === 'pro' ? 19 : 49,
        yearly: request.userPlan === 'free' ? 0 : request.userPlan === 'pro' ? 190 : 490
      }
    }
  }
}

/**
 * POST /api/magic-input/text-generation
 */
export async function POST(request: NextRequest): Promise<NextResponse<TextGenerationResponse>> {
  const startTime = Date.now()
  
  // Enable streaming for large responses
  const headers = new Headers()
  headers.set('Transfer-Encoding', 'chunked')
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')
  
  try {
    // Parse and validate request
    const body = await request.json()
    const validationResult = TextGenerationRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        usageInfo: { used: 0, limit: 0, remaining: 0, cost: 0 },
        error: 'Invalid request data',
        errorCode: 'VALIDATION_ERROR'
      }, { status: 400 })
    }
    
    const requestData = validationResult.data
    
    // Rate limiting check
    if (!checkRateLimit(requestData.userId, requestData.userPlan)) {
      return NextResponse.json({
        success: false,
        usageInfo: { 
          used: requestData.currentUsage, 
          limit: getPlanLimit(requestData.userPlan), 
          remaining: getPlanLimit(requestData.userPlan) - requestData.currentUsage,
          cost: 0
        },
        error: 'Rate limit exceeded. Please wait before making another request.',
        errorCode: 'RATE_LIMIT'
      }, { status: 429 })
    }
    
    // Validate user permissions and usage
    const userValidation = validateUserRequest(requestData)
    if (!userValidation.valid) {
      return NextResponse.json({
        success: false,
        usageInfo: { 
          used: requestData.currentUsage, 
          limit: getPlanLimit(requestData.userPlan), 
          remaining: getPlanLimit(requestData.userPlan) - requestData.currentUsage,
          cost: calculateUsage(requestData.selectedPlatforms)
        },
        error: userValidation.error,
        errorCode: 'USAGE_LIMIT'
      }, { status: 403 })
    }
    
    // Calculate usage cost
    const usageCost = calculateUsage(requestData.selectedPlatforms)
    const planLimit = getPlanLimit(requestData.userPlan)

    // Check cache for similar requests
    const cacheKey = generateCacheKey(requestData)
    const cachedResponse = getCachedResponse(cacheKey)
    
    if (cachedResponse) {
      headers.set('X-Cache', 'HIT')
      headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)
      return NextResponse.json(cachedResponse, { status: 200, headers })
    }
    
    // Build generation request
    const generationRequest = buildGenerationRequest(requestData)
    
    // Generate content using OpenAI client
    const generationResponse = await generateContent(generationRequest)
    
    if (!generationResponse.success || !generationResponse.data) {
      return NextResponse.json({
        success: false,
        usageInfo: { 
          used: requestData.currentUsage, 
          limit: planLimit, 
          remaining: planLimit - requestData.currentUsage,
          cost: usageCost
        },
        error: generationResponse.error || 'Content generation failed',
        errorCode: 'GENERATION_ERROR'
      }, { status: 500 })
    }
    
    // Calculate new usage after successful generation
    const newUsage = requestData.currentUsage + usageCost
    
    // Prepare response
    const response: TextGenerationResponse = {
      success: true,
      data: generationResponse.data,
      usageInfo: {
        used: newUsage,
        limit: planLimit,
        remaining: planLimit - newUsage,
        cost: usageCost
      },
      processingInfo: {
        assistantUsed: generationResponse.assistantUsed,
        processingTime: generationResponse.processingTime,
        tokensConsumed: generationResponse.tokensConsumed,
        confidenceScore: generationResponse.confidenceScore
      }
    }
    
    // Cache successful response
    cacheResponse(cacheKey, response)
    
    // Add processing time header
    headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)
    headers.set('X-Cache', 'MISS')
    headers.set('X-Generation-Time', `${generationResponse.processingTime}ms`)
    headers.set('X-Tokens-Used', `${generationResponse.tokensConsumed}`)
    
    return NextResponse.json(response, { 
      status: 200,
      headers 
    })
    
  } catch (error) {
    console.error('Text generation API error:', error)
    
    return NextResponse.json({
      success: false,
      usageInfo: { used: 0, limit: 0, remaining: 0, cost: 0 },
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

/**
 * GET /api/magic-input/text-generation - Health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    service: 'text-generation',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}