// ============================================================================
// URL PARSER - COMPETITOR ANALYSIS FOUNDATION
// ============================================================================

import { z } from 'zod'

// Supported platforms
export type PlatformType = 
  | 'amazon' 
  | 'shopify' 
  | 'aliexpress' 
  | 'khoroshop' 
  | 'etsy' 
  | 'ebay' 
  | 'instagram' 
  | 'facebook' 
  | 'unknown'

// URL validation schema
const URLSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  },
  'Invalid URL format'
)

// Product data interface
export interface ProductData {
  title: string
  description: string
  price?: string
  currency?: string
  images: string[]
  specifications: Record<string, string>
  features: string[]
  sellerInfo?: {
    name: string
    rating?: number
    reviewCount?: number
  }
  seoElements: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
  availability?: string
  sku?: string
  brand?: string
  category?: string
}

// URL parse result
export interface URLParseResult {
  success: boolean
  platform: PlatformType
  url: string
  data?: ProductData
  error?: string
  extractionTime: number
  cached: boolean
  warnings: string[]
}

// Cache interface
interface CacheEntry {
  data: URLParseResult
  timestamp: number
  ttl: number
}

// Platform detection patterns
const PLATFORM_PATTERNS: Record<PlatformType, RegExp[]> = {
  amazon: [
    /amazon\.(com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp)/i,
    /\/dp\/[A-Z0-9]{10}/i,
    /\/gp\/product\/[A-Z0-9]{10}/i
  ],
  shopify: [
    /\.myshopify\.com/i,
    /shopify/i,
    /\/products\//i
  ],
  aliexpress: [
    /aliexpress\.(com|ru)/i,
    /\/item\//i
  ],
  khoroshop: [
    /khoroshop\.(ua|com)/i,
    /хорошоп/i
  ],
  etsy: [
    /etsy\.com/i,
    /\/listing\//i
  ],
  ebay: [
    /ebay\.(com|co\.uk|de|fr|it|es|ca|com\.au)/i,
    /\/itm\//i
  ],
  instagram: [
    /instagram\.com/i,
    /\/p\//i
  ],
  facebook: [
    /facebook\.com/i,
    /\/marketplace\//i,
    /\/shop\//i
  ],
  unknown: []
}

// User agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
]

// Rate limiting
const RATE_LIMITS = new Map<string, number>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_MINUTE = 10

// Cache storage
const URL_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): PlatformType {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    const pathname = parsed.pathname.toLowerCase()
    const fullUrl = url.toLowerCase()

    for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
      if (platform === 'unknown') continue
      
      for (const pattern of patterns) {
        if (pattern.test(hostname) || pattern.test(pathname) || pattern.test(fullUrl)) {
          return platform as PlatformType
        }
      }
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Validate URL security
 */
function validateURLSecurity(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /localhost/i,
      /127\.0\.0\.1/i,
      /192\.168\./i,
      /10\./i,
      /172\.(1[6-9]|2[0-9]|3[0-1])\./i,
      /javascript:/i,
      /data:/i,
      /file:/i
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return { valid: false, error: 'URL contains suspicious patterns' }
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Check rate limiting
 */
function checkRateLimit(domain: string): boolean {
  const now = Date.now()
  const key = domain.toLowerCase()
  const lastRequest = RATE_LIMITS.get(key) || 0

  if (now - lastRequest < RATE_LIMIT_WINDOW / MAX_REQUESTS_PER_MINUTE) {
    return false // Rate limited
  }

  RATE_LIMITS.set(key, now)
  return true
}

/**
 * Get random user agent
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

/**
 * Get cached result
 */
function getCachedResult(url: string): URLParseResult | null {
  const cached = URL_CACHE.get(url)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > cached.ttl) {
    URL_CACHE.delete(url)
    return null
  }

  return {
    ...cached.data,
    cached: true
  }
}

/**
 * Cache result
 */
function cacheResult(url: string, result: URLParseResult): void {
  URL_CACHE.set(url, {
    data: { ...result, cached: false },
    timestamp: Date.now(),
    ttl: CACHE_TTL
  })
}

/**
 * Extract product data from HTML
 */
async function extractProductDataFromHTML(html: string, platform: PlatformType, url: string): Promise<ProductData> {
  // Create a simple DOM parser (in real implementation, use jsdom or similar)
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const data: ProductData = {
    title: '',
    description: '',
    images: [],
    specifications: {},
    features: [],
    seoElements: {}
  }

  try {
    // Extract title
    data.title = 
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('[data-testid="product-title"]')?.textContent?.trim() ||
      doc.querySelector('.product-title')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() ||
      'Product Title Not Found'

    // Extract description
    const descriptionSelectors = [
      '[data-testid="product-description"]',
      '.product-description',
      '.description',
      '#description',
      '.product-details'
    ]

    for (const selector of descriptionSelectors) {
      const element = doc.querySelector(selector)
      if (element?.textContent?.trim()) {
        data.description = element.textContent.trim()
        break
      }
    }

    // Extract price
    const priceSelectors = [
      '.price',
      '[data-testid="price"]',
      '.product-price',
      '.current-price',
      '.sale-price'
    ]

    for (const selector of priceSelectors) {
      const element = doc.querySelector(selector)
      if (element?.textContent?.trim()) {
        data.price = element.textContent.trim()
        break
      }
    }

    // Extract images
    const imageElements = doc.querySelectorAll('img[src*="product"], img[alt*="product"], .product-image img')
    data.images = Array.from(imageElements)
      .map(img => (img as HTMLImageElement).src)
      .filter(src => src && !src.includes('data:'))
      .slice(0, 10) // Limit to 10 images

    // Extract SEO elements
    data.seoElements.metaTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                                doc.querySelector('title')?.textContent?.trim()

    data.seoElements.metaDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                                      doc.querySelector('meta[name="description"]')?.getAttribute('content')

    // Extract keywords
    const keywordsElement = doc.querySelector('meta[name="keywords"]')
    if (keywordsElement) {
      data.seoElements.keywords = keywordsElement.getAttribute('content')?.split(',').map(k => k.trim()) || []
    }

    // Platform-specific extraction
    switch (platform) {
      case 'amazon':
        data.brand = doc.querySelector('#bylineInfo')?.textContent?.trim()
        data.sku = url.match(/\/dp\/([A-Z0-9]{10})/)?.[1]
        break
        
      case 'shopify':
        data.sku = doc.querySelector('[data-product-sku]')?.getAttribute('data-product-sku')
        break
        
      case 'etsy':
        data.sellerInfo = {
          name: doc.querySelector('.shop-name')?.textContent?.trim() || 'Unknown Seller'
        }
        break
    }

  } catch (error) {
    console.warn('Error extracting product data:', error)
  }

  return data
}

/**
 * Fetch URL content with error handling
 */
async function fetchURLContent(url: string): Promise<{ html: string; warnings: string[] }> {
  const warnings: string[] = []
  
  try {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      // Browser environment - use CORS proxy or return mock data
      warnings.push('Browser environment detected - using mock data for demonstration')
      
      return {
        html: `
          <html>
            <head>
              <title>Sample Product Title</title>
              <meta name="description" content="Sample product description">
            </head>
            <body>
              <h1>Sample Product Title</h1>
              <div class="description">This is a sample product description for demonstration purposes.</div>
              <div class="price">$99.99</div>
              <img src="https://via.placeholder.com/300x300" alt="Product Image">
            </body>
          </html>
        `,
        warnings
      }
    }

    // Server environment - actual fetch
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    return { html, warnings }

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - URL took too long to respond')
      }
      throw new Error(`Failed to fetch URL: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching URL')
  }
}

/**
 * Extract product data from specific platform
 */
export async function extractProductData(url: string, platform: PlatformType): Promise<ProductData> {
  const { html } = await fetchURLContent(url)
  return extractProductDataFromHTML(html, platform, url)
}

/**
 * Main URL extraction function
 */
export async function extractDataFromURL(url: string): Promise<URLParseResult> {
  const startTime = Date.now()
  const warnings: string[] = []

  try {
    // Validate URL format
    const urlValidation = URLSchema.safeParse(url)
    if (!urlValidation.success) {
      return {
        success: false,
        platform: 'unknown',
        url,
        error: 'Invalid URL format',
        extractionTime: Date.now() - startTime,
        cached: false,
        warnings
      }
    }

    // Check cache first
    const cached = getCachedResult(url)
    if (cached) {
      return cached
    }

    // Security validation
    const securityCheck = validateURLSecurity(url)
    if (!securityCheck.valid) {
      return {
        success: false,
        platform: 'unknown',
        url,
        error: securityCheck.error,
        extractionTime: Date.now() - startTime,
        cached: false,
        warnings
      }
    }

    // Rate limiting check
    const domain = new URL(url).hostname
    if (!checkRateLimit(domain)) {
      return {
        success: false,
        platform: 'unknown',
        url,
        error: 'Rate limit exceeded. Please wait before making another request.',
        extractionTime: Date.now() - startTime,
        cached: false,
        warnings
      }
    }

    // Detect platform
    const platform = detectPlatform(url)
    if (platform === 'unknown') {
      warnings.push('Platform not recognized - using generic extraction')
    }

    // Extract product data
    const productData = await extractProductData(url, platform)

    const result: URLParseResult = {
      success: true,
      platform,
      url,
      data: productData,
      extractionTime: Date.now() - startTime,
      cached: false,
      warnings
    }

    // Cache successful result
    cacheResult(url, result)

    return result

  } catch (error) {
    const result: URLParseResult = {
      success: false,
      platform: detectPlatform(url),
      url,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      extractionTime: Date.now() - startTime,
      cached: false,
      warnings
    }

    return result
  }
}

/**
 * Clear cache (utility function)
 */
export function clearCache(): void {
  URL_CACHE.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: URL_CACHE.size,
    entries: Array.from(URL_CACHE.keys())
  }
}

/**
 * Validate if URL is from supported platform
 */
export function isSupportedPlatform(url: string): boolean {
  const platform = detectPlatform(url)
  return platform !== 'unknown'
}

/**
 * Get supported platforms list
 */
export function getSupportedPlatforms(): PlatformType[] {
  return Object.keys(PLATFORM_PATTERNS).filter(p => p !== 'unknown') as PlatformType[]
}

// Export utilities
export const URLParserUtils = {
  detectPlatform,
  extractDataFromURL,
  extractProductData,
  isSupportedPlatform,
  getSupportedPlatforms,
  clearCache,
  getCacheStats
} as const