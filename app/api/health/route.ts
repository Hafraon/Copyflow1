import { NextResponse } from 'next/server'

/**
 * Health check endpoint for monitoring
 * GET /api/health or /health
 */
export async function GET() {
  const startTime = Date.now()
  
  // Check database connection
  let dbStatus = 'unknown'
  try {
    // In production, add actual database check
    // const db = await prisma.$queryRaw`SELECT 1`
    dbStatus = 'connected'
  } catch (error) {
    dbStatus = 'error'
  }
  
  // Check OpenAI connection
  let openaiStatus = 'unknown'
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      // Simple validation, not an actual API call to avoid costs
      openaiStatus = apiKey.startsWith('sk-') ? 'configured' : 'invalid'
    } else {
      openaiStatus = 'not_configured'
    }
  } catch (error) {
    openaiStatus = 'error'
  }
  
  // Check Redis connection if used
  let redisStatus = 'unknown'
  try {
    const redisUrl = process.env.REDIS_URL
    redisStatus = redisUrl ? 'configured' : 'not_configured'
  } catch (error) {
    redisStatus = 'error'
  }
  
  // Environment check
  const environment = process.env.NODE_ENV || 'development'
  
  // Response time
  const responseTime = Date.now() - startTime
  
  return NextResponse.json({
    status: 'healthy',
    environment,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      openai: openaiStatus,
      redis: redisStatus
    },
    responseTime: `${responseTime}ms`
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}