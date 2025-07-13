import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError, ErrorType, ErrorSeverity } from '@/lib/error-handling'
import { 
  analyzePlatform, 
  generateColumnMapping, 
  planExportStructure,
  calculateConfidence,
  getSupportedPlatforms,
  validateDetectionResult,
  type PlatformDetectionResult,
  type ColumnMapping,
  type ExportStructure,
  type PlatformType
} from '@/lib/platform-detection'

// ============================================================================
// PLATFORM DETECTION API - ANALYSIS ONLY (NO CONTENT GENERATION!)
// ============================================================================

// Performance optimization: Precompile regular expressions
const HEADER_PATTERNS = {
  productName: /(?:product|item|title|name)/i,
  description: /(?:description|content|details)/i,
  price: /(?:price|cost|amount)/i,
  sku: /(?:sku|id|code|asin)/i,
  category: /(?:category|type|department)/i
}

// Request validation schema
const PlatformDetectionRequestSchema = z.object({
  headers: z.array(z.string().min(1)).min(1, 'At least one header is required').max(100, 'Too many headers'),
  sampleData: z.array(z.array(z.any())).max(50, 'Too many sample rows'),
  language: z.enum(['en', 'uk', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'zh', 'ja', 'ar']).optional().default('en'),
  userId: z.string().optional() // For caching and analytics
})

type PlatformDetectionRequest = z.infer<typeof PlatformDetectionRequestSchema>

// Response interface
interface PlatformDetectionResponse {
  success: boolean
  detectedPlatform: PlatformType
  confidence: number
  columnMapping: ColumnMapping
  exportStructure: ExportStructure
  recommendations: string[]
  supportedOptimizations: string[]
  processingInfo: {
    processingTime: number
    evidenceCount: number
    cached: boolean
  }
  error?: string
  errorCode?: string
}

// Cache storage (in production, use Redis)
const detectionCache = new Map<string, { data: PlatformDetectionResponse; timestamp: number; ttl: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Generate cache key for detection request
 */
function generateCacheKey(headers: string[], sampleData: any[][]): string {
  const headersKey = headers.sort().join('|')
  const dataKey = sampleData.slice(0, 3).map(row => row.slice(0, 5).join(',')).join('|')
  return `detection:${Buffer.from(headersKey + dataKey).toString('base64').substring(0, 32)}`
}

/**
 * Get cached detection result
 */
function getCachedResult(cacheKey: string): PlatformDetectionResponse | null {
  const cached = detectionCache.get(cacheKey)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > cached.ttl) {
    detectionCache.delete(cacheKey)
    return null
  }

  return {
    ...cached.data,
    processingInfo: {
      ...cached.data.processingInfo,
      cached: true
    }
  }
}

/**
 * Cache detection result
 */
function cacheResult(cacheKey: string, result: PlatformDetectionResponse): void {
  detectionCache.set(cacheKey, {
    data: { ...result, processingInfo: { ...result.processingInfo, cached: false } },
    timestamp: Date.now(),
    ttl: CACHE_TTL
  })
}

/**
 * Rate limiting check
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const limit = 60 // 60 requests per minute

  const userLimit = rateLimitMap.get(identifier)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= limit) {
    return false
  }
  
  userLimit.count++
  return true
}

/**
 * Generate recommendations based on detection result
 */
function generateRecommendations(result: PlatformDetectionResult): string[] {
  const recommendations: string[] = []
  
  if (result.confidence < 50) {
    recommendations.push('Low confidence detection - consider manual platform selection')
  }
  
  if (result.confidence >= 80) {
    recommendations.push(`High confidence ${result.detectedPlatform} detection - proceed with platform-specific optimizations`)
  }
  
  if (result.columnMapping.productName) {
    recommendations.push('Product name column detected - ready for title optimization')
  }
  
  if (result.columnMapping.description) {
    recommendations.push('Description column detected - ready for content enhancement')
  }
  
  if (result.columnMapping.price) {
    recommendations.push('Price column detected - ready for value proposition optimization')
  }
  
  if (!result.columnMapping.category) {
    recommendations.push('No category column detected - consider adding product categorization')
  }
  
  if (result.detectedPlatform === 'amazon' && !result.columnMapping.sku) {
    recommendations.push('Amazon platform detected but no ASIN/SKU column found')
  }
  
  if (result.exportStructure.platformSpecificColumns.length > 0) {
    recommendations.push(`${result.exportStructure.platformSpecificColumns.length} platform-specific optimizations available`)
  }
  
  return recommendations
}

/**
 * Generate supported optimizations list
 */
function generateSupportedOptimizations(detectedPlatform: PlatformType): string[] {
  const optimizations: string[] = [
    'SEO title optimization',
    'Meta description enhancement',
    'Product description improvement',
    'Bullet points generation',
    'Keywords optimization',
    'Call-to-action creation'
  ]

  // Only add platform-specific optimizations if we have a detected platform
  
  switch (detectedPlatform) {
    case 'amazon':
      optimizations.push(
        'Amazon backend keywords (249 chars)',
        'Amazon search terms optimization',
        'Bullet points for Amazon format',
        'A+ content suggestions'
      )
      break
      
    case 'shopify':
      optimizations.push(
        'Shopify SEO handles',
        'Collection descriptions',
        'Product variants optimization',
        'Shopify-specific structured data'
      )
      break
      
    case 'ebay':
      optimizations.push(
        'eBay auction-style descriptions',
        'eBay category optimization',
        'Competitive pricing strategies',
        'eBay-specific keywords'
      )
      break
      
    case 'etsy':
      optimizations.push(
        'Etsy artisan storytelling',
        'Handmade appeal content',
        'Etsy tags optimization',
        'Creative product descriptions'
      )
      break
      
    case 'woocommerce':
      optimizations.push(
        'WooCommerce SEO optimization',
        'Product attributes enhancement',
        'Category descriptions',
        'WordPress-specific optimizations'
      )
      break
  }
  
  return optimizations
}

/**
 * Validate sample data structure
 */
function validateSampleData(headers: string[], sampleData: any[][]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (sampleData.length === 0) {
    return { valid: true, errors: [] } // Sample data is optional
  }
  
  // Check if sample data matches headers length
  const inconsistentRows = sampleData.filter(row => row.length !== headers.length)
  if (inconsistentRows.length > 0) {
    errors.push(`${inconsistentRows.length} sample rows have inconsistent column count`)
  }
  
  // Check for completely empty rows
  const emptyRows = sampleData.filter(row => row.every(cell => !cell || String(cell).trim() === ''))
  if (emptyRows.length === sampleData.length) {
    errors.push('All sample rows are empty')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Fast column mapping for performance
 */
function fastColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  
  // Use precompiled patterns for faster matching
  for (const header of headers) {
    const lowerHeader = header.toLowerCase()
    
    if (HEADER_PATTERNS.productName.test(lowerHeader) && !mapping.productName) {
      mapping.productName = header
    } else if (HEADER_PATTERNS.description.test(lowerHeader) && !mapping.description) {
      mapping.description = header
    } else if (HEADER_PATTERNS.price.test(lowerHeader) && !mapping.price) {
      mapping.price = header
    } else if (HEADER_PATTERNS.sku.test(lowerHeader) && !mapping.sku) {
      mapping.sku = header
    } else if (HEADER_PATTERNS.category.test(lowerHeader) && !mapping.category) {
      mapping.category = header
    }
  }
  
  return mapping
}

/**
 * POST /api/platform-detection
 */
export async function POST(request: NextRequest): Promise<NextResponse<PlatformDetectionResponse>> {
  const startTime = Date.now()
  
  try {
    // Set performance headers
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=3600')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Timing-Allow-Origin', '*')
    
    // Parse and validate request
    const body = await request.json()
    const validationResult = PlatformDetectionRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        detectedPlatform: 'unknown',
        confidence: 0,
        columnMapping: {},
        exportStructure: {
          preserveOriginalColumns: [],
          addCopyFlowColumns: [],
          platformSpecificColumns: [],
          totalColumns: 0,
          estimatedFileSize: 'Unknown'
        },
        recommendations: [],
        supportedOptimizations: [],
        processingInfo: {
          processingTime: Date.now() - startTime,
          evidenceCount: 0,
          cached: false
        },
        error: 'Invalid request data',
        errorCode: 'VALIDATION_ERROR'
      }, { status: 400 })
      
    }
    
    const requestData = validationResult.data
    
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitKey = requestData.userId || clientIP
    
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({
        success: false,
        detectedPlatform: 'unknown',
        confidence: 0,
        columnMapping: {},
        exportStructure: {
          preserveOriginalColumns: [],
          addCopyFlowColumns: [],
          platformSpecificColumns: [],
          totalColumns: 0,
          estimatedFileSize: 'Unknown'
        },
        recommendations: [],
        supportedOptimizations: [],
        processingInfo: {
          processingTime: Date.now() - startTime,
          evidenceCount: 0,
          cached: false
        },
        error: 'Rate limit exceeded. Please wait before making another request.',
        errorCode: 'RATE_LIMIT'
      }, { status: 429 })
    }
    
    // Validate sample data structure
    const dataValidation = validateSampleData(requestData.headers, requestData.sampleData)
    if (!dataValidation.valid) {
      return NextResponse.json({
        success: false,
        detectedPlatform: 'unknown',
        confidence: 0,
        columnMapping: {},
        exportStructure: {
          preserveOriginalColumns: [],
          addCopyFlowColumns: [],
          platformSpecificColumns: [],
          totalColumns: 0,
          estimatedFileSize: 'Unknown'
        },
        recommendations: [],
        supportedOptimizations: [],
        processingInfo: {
          processingTime: Date.now() - startTime,
          evidenceCount: 0,
          cached: false
        },
        error: `Invalid sample data: ${dataValidation.errors.join(', ')}`,
        errorCode: 'INVALID_DATA'
      }, { status: 400 })
    }
    
    // Check cache
    const cacheKey = generateCacheKey(requestData.headers, requestData.sampleData)
    const cachedResult = getCachedResult(cacheKey)
    
    if (cachedResult) {
      // Add performance metrics to headers
      headers.set('X-Cache', 'HIT')
      headers.set('X-Processing-Time', '0ms')
      
      return NextResponse.json(cachedResult, {
        headers
      })
    }
    
    // Fast path: If we have very few headers, use fast mapping
    if (requestData.headers.length <= 10 && (!requestData.sampleData || requestData.sampleData.length === 0)) {
      const fastMapping = fastColumnMapping(requestData.headers)
      const exportStructure = planExportStructure(requestData.headers, 'universal')
      
      // For very simple cases, return immediately without full analysis
      if (Object.keys(fastMapping).length >= 3) {
        const confidence = 60 // Medium confidence for fast path
        
        const response: PlatformDetectionResponse = {
          success: true,
          detectedPlatform: 'universal',
          confidence,
          columnMapping: fastMapping,
          exportStructure,
          recommendations: [
            'Fast detection completed - basic column mapping available',
            'Consider providing sample data for more accurate platform detection'
          ],
          supportedOptimizations: generateSupportedOptimizations('universal'),
          processingInfo: {
            processingTime: Date.now() - startTime,
            evidenceCount: 0,
            cached: false
          }
        }
        
        // Cache fast result
        cacheResult(cacheKey, response)
        
        // Add performance metrics
        headers.set('X-Cache', 'MISS')
        headers.set('X-Fast-Path', 'TRUE')
        headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)
        
        return NextResponse.json(response, { headers })
      }
    }
    
    // Full analysis path
    const analysisStartTime = Date.now()
    
    // Perform platform detection analysis with timeout
    const detectionPromise = analyzePlatform(requestData.headers, requestData.sampleData)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Platform detection timed out')), 5000)
    })
    
    let detectionResult: PlatformDetectionResult
    try {
      detectionResult = await Promise.race([detectionPromise, timeoutPromise])
    } catch (error) {
      // Fallback to basic detection on timeout
      console.warn('Platform detection timed out, using fallback')
      detectionResult = {
        detectedPlatform: 'universal',
        confidence: 30,
        evidence: [],
        columnMapping: fastColumnMapping(requestData.headers),
        exportStructure: planExportStructure(requestData.headers, 'universal'),
        warnings: ['Detection timed out, using fallback detection'],
        processingTime: Date.now() - analysisStartTime
      }
    }
    
    // Validate detection result
    const resultValidation = validateDetectionResult(detectionResult)
    if (!resultValidation.valid) {
      return NextResponse.json({
        success: false,
        detectedPlatform: 'unknown',
        confidence: 0,
        columnMapping: {},
        exportStructure: {
          preserveOriginalColumns: [],
          addCopyFlowColumns: [],
          platformSpecificColumns: [],
          totalColumns: 0,
          estimatedFileSize: 'Unknown'
        },
        recommendations: [],
        supportedOptimizations: [],
        processingInfo: {
          processingTime: Date.now() - startTime,
          evidenceCount: 0,
          cached: false
        },
        error: `Detection validation failed: ${resultValidation.errors.join(', ')}`,
        errorCode: 'DETECTION_ERROR'
      }, { status: 500 })
    }
    
    // Generate recommendations and optimizations
    const recommendations = generateRecommendations(detectionResult)
    const supportedOptimizations = generateSupportedOptimizations(detectionResult.detectedPlatform)
    
    // Prepare response
    const response: PlatformDetectionResponse = {
      success: true,
      detectedPlatform: detectionResult.detectedPlatform,
      confidence: detectionResult.confidence,
      columnMapping: detectionResult.columnMapping,
      exportStructure: detectionResult.exportStructure,
      recommendations,
      supportedOptimizations,
      processingInfo: {
        processingTime: Date.now() - startTime,
        evidenceCount: detectionResult.evidence.length,
        cached: false
      }
    }
    
    // Cache successful result
    cacheResult(cacheKey, response)
    
    // Set response headers
    headers.set('X-Cache', 'MISS')
    headers.set('X-Processing-Time', `${response.processingInfo.processingTime}ms`)
    headers.set('X-Detection-Confidence', `${detectionResult.confidence}`)
    
    return NextResponse.json(response, { 
      status: 200,
      headers 
    })
    
  } catch (error) {
    console.error('Platform detection API error:', error)
    
    return NextResponse.json({
      success: false,
      detectedPlatform: 'unknown',
      confidence: 0,
      columnMapping: {},
      exportStructure: {
        preserveOriginalColumns: [],
        addCopyFlowColumns: [],
        platformSpecificColumns: [],
        totalColumns: 0,
        estimatedFileSize: 'Unknown'
      },
      recommendations: [],
      supportedOptimizations: [],
      processingInfo: {
        processingTime: Date.now() - startTime,
        evidenceCount: 0,
        cached: false
      },
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

/**
 * GET /api/platform-detection - Get supported platforms
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supportedPlatforms = getSupportedPlatforms()
    
    return NextResponse.json({
      success: true,
      supportedPlatforms,
      totalPlatforms: supportedPlatforms.length,
      capabilities: {
        confidenceScoring: true,
        columnMapping: true,
        exportPlanning: true,
        multiLanguageSupport: true,
        caching: true
      },
      version: '1.0.0'
    })
    
  } catch (error) {
    console.error('Platform detection info API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get platform information'
    }, { status: 500 })
  }
}