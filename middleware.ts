import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Middleware for security, redirects, and performance optimizations
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://analytics.copyflow.ai; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.pexels.com https://cdn.copyflow.ai https://via.placeholder.com; connect-src 'self' https://api.openai.com https://api.copyflow.ai; font-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';`
  }
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Performance headers
  response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
  
  // Auth protection for dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = await getToken({ req: request })
    
    if (!token) {
      const url = new URL('/auth/signin', request.url)
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }
  
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // In production, implement proper rate limiting with Redis
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Simple in-memory rate limiting (replace with Redis in production)
    const rateLimitKey = `${clientIp}:${request.nextUrl.pathname}`
    
    // Check rate limit (implement with Redis in production)
    // const isRateLimited = await checkRateLimit(rateLimitKey)
    const isRateLimited = false // Placeholder
    
    if (isRateLimited) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|robots.txt|sitemap.xml).*)',
  ],
}