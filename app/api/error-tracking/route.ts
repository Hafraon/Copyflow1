import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ErrorType, ErrorSeverity } from '@/lib/error-handling'

// ============================================================================
// ERROR TRACKING API - PRODUCTION MONITORING
// ============================================================================

// Error tracking schema
const ErrorTrackingSchema = z.object({
  type: z.nativeEnum(ErrorType),
  message: z.string(),
  severity: z.nativeEnum(ErrorSeverity),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  timestamp: z.string().datetime(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  context: z.record(z.any()).optional()
})

type ErrorTrackingPayload = z.infer<typeof ErrorTrackingSchema>

// In-memory error storage (replace with database in production)
const errorLogs: ErrorTrackingPayload[] = []

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>()

/**
 * Check rate limit
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const limit = 50 // 50 errors per minute
  
  const userLimit = rateLimits.get(identifier)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= limit) {
    return false
  }
  
  userLimit.count++
  return true
}

/**
 * POST /api/error-tracking - Log client-side errors
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({
        success: false,
        message: 'Rate limit exceeded'
      }, { status: 429 })
    }
    
    // Parse and validate request
    const body = await request.json()
    const validationResult = ErrorTrackingSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid error data',
        errors: validationResult.error.errors
      }, { status: 400 })
    }
    
    const errorData = validationResult.data
    
    // Store error (in production, send to error tracking service)
    if (process.env.NODE_ENV === 'production') {
      // In production, you would send to a service like Sentry, LogRocket, etc.
      console.log('Production error:', errorData)
      
      // Example integration with external service
      if (process.env.ERROR_TRACKING_URL) {
        try {
          await fetch(process.env.ERROR_TRACKING_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ERROR_TRACKING_API_KEY}`
            },
            body: JSON.stringify(errorData)
          })
        } catch (err) {
          console.error('Failed to send error to tracking service:', err)
        }
      }
    } else {
      // In development, store in memory
      errorLogs.push(errorData)
      console.log('Error logged:', errorData)
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Error logged successfully'
    })
    
  } catch (error) {
    console.error('Error tracking API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * GET /api/error-tracking - Get error logs (development only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Only available in development
  if (process.env.NODE_ENV !== 'production') {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    
    let filteredLogs = [...errorLogs]
    
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type)
    }
    
    return NextResponse.json({
      success: true,
      logs: filteredLogs.slice(-limit),
      total: filteredLogs.length
    })
  }
  
  // Disabled in production
  return NextResponse.json({
    success: false,
    message: 'Error logs API is disabled in production'
  }, { status: 403 })
}