import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { parseCSV } from '@/lib/csv-parser'
import { generateContent } from '@/lib/openai-client'
import { analyzePlatform, generateColumnMapping, planExportStructure } from '@/lib/platform-detection'
import { 
  calculateUsage, 
  validateUsage, 
  getPlanLimit,
  canAffordBulkProcessing 
} from '@/lib/usage-tracker'
import { 
  GenerationRequest, 
  UserPlanType,
  EmojiSettings,
  CopyFlowOutput 
} from '@/lib/types'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// ============================================================================
// ENHANCED CSV BULK PROCESSING API - PLATFORM INTELLIGENCE + COPYFLOW STRUCTURE
// ============================================================================

// Request validation schema
const CSVBulkRequestSchema = z.object({
  // User context
  userId: z.string().min(1, 'User ID is required'),
  userPlan: z.enum(['free', 'pro', 'business']).default('free'),
  currentUsage: z.number().min(0).default(0),
  
  // File data (base64 encoded)
  fileData: z.string().min(1, 'File data is required'),
  fileName: z.string().min(1, 'File name is required'),
  
  // Selected rows to process
  selectedRows: z.array(z.number()).min(1, 'At least one row must be selected'),
  
  // Global settings for all products
  globalSettings: z.object({
    writingStyle: z.enum(['professional', 'casual', 'luxury', 'technical', 'creative']),
    language: z.enum(['en', 'uk', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'zh', 'ja', 'ar']),
    platforms: z.array(z.string()).default(['universal']),
    emojiSettings: z.object({
      enabled: z.boolean(),
      intensity: z.enum(['low', 'medium', 'high']),
      categorySpecific: z.boolean(),
      intensityConfig: z.object({
        low: z.object({ count: z.string(), example: z.string() }),
        medium: z.object({ count: z.string(), example: z.string() }),
        high: z.object({ count: z.string(), example: z.string() })
      })
    })
  }),
  
  // Platform detection override (optional)
  forcePlatform: z.string().optional(),
  
  // Column mapping override (optional)
  columnMapping: z.object({
    productName: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    price: z.string().optional(),
    sku: z.string().optional(),
    brand: z.string().optional()
  }).optional()
})

type CSVBulkRequest = z.infer<typeof CSVBulkRequestSchema>

// Enhanced job status interface
interface BulkJob {
  id: string
  userId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  
  // Platform intelligence
  platformDetection?: {
    detectedPlatform: string
    confidence: number
    columnMapping: Record<string, string>
    exportStructure: any
  }
  
  progress: {
    total: number
    processed: number
    failed: number
    currentProduct?: string
    currentPhase?: 'detection' | 'processing' | 'compilation'
  }
  
  results?: {
    successfulProducts: number
    failedProducts: number
    outputFileUrl?: string
    processingTime: number
    platformOptimizations: string[]
    copyFlowColumnsAdded: number
    originalColumnsPreserved: number
  }
  
  errors: Array<{
    rowIndex: number
    productName: string
    error: string
    phase: 'detection' | 'processing' | 'compilation'
  }>
  
  createdAt: Date
  completedAt?: Date
}

// In-memory job storage (in production, use Redis or database)
const jobStorage = new Map<string, BulkJob>()

// Rate limiting for bulk processing
const bulkRateLimits = new Map<string, number>()

/**
 * Check bulk processing rate limit
 */
function checkBulkRateLimit(userId: string, userPlan: UserPlanType): boolean {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  
  // Bulk processing limits per hour
  const limits = {
    free: 1,      // 1 bulk job per hour
    pro: 5,       // 5 bulk jobs per hour
    business: 20  // 20 bulk jobs per hour
  }
  
  const limit = limits[userPlan]
  const lastRequest = bulkRateLimits.get(userId) || 0
  
  if (now - lastRequest < windowMs / limit) {
    return false // Rate limited
  }
  
  bulkRateLimits.set(userId, now)
  return true
}

/**
 * Generate CopyFlow column structure based on platform
 */
function generateCopyFlowColumns(detectedPlatform: string): string[] {
  // Standard CopyFlow columns (always included)
  const standardColumns = [
    'CopyFlow_Product_Title',
    'CopyFlow_Description',
    'CopyFlow_SEO_Title',
    'CopyFlow_Meta_Description',
    'CopyFlow_Call_To_Action',
    'CopyFlow_Bullet_Point_1',
    'CopyFlow_Bullet_Point_2',
    'CopyFlow_Bullet_Point_3',
    'CopyFlow_Key_Features',
    'CopyFlow_Tags',
    'CopyFlow_TikTok_Hook_1',
    'CopyFlow_TikTok_Hook_2',
    'CopyFlow_Instagram_Caption_1',
    'CopyFlow_Instagram_Caption_2',
    'CopyFlow_Emotional_Hook_1',
    'CopyFlow_Trust_Signal_1',
    'CopyFlow_Competitor_Advantage_1',
    'CopyFlow_Price_Anchor'
  ]
  
  // Platform-specific columns
  const platformColumns: Record<string, string[]> = {
    amazon: [
      'CopyFlow_Amazon_Backend_Keywords',
      'CopyFlow_Amazon_Search_Terms',
      'CopyFlow_Amazon_Subject_Matter'
    ],
    shopify: [
      'CopyFlow_Shopify_Handle',
      'CopyFlow_Shopify_SEO_Title',
      'CopyFlow_Structured_Data'
    ],
    ebay: [
      'CopyFlow_eBay_Auction_Style',
      'CopyFlow_eBay_USP',
      'CopyFlow_eBay_Competitive_Price'
    ],
    etsy: [
      'CopyFlow_Etsy_Artisan_Story',
      'CopyFlow_Etsy_Handmade_Feel',
      'CopyFlow_Etsy_Keywords'
    ],
    woocommerce: [
      'CopyFlow_WooCommerce_Short_Description',
      'CopyFlow_WooCommerce_Attributes',
      'CopyFlow_WooCommerce_Categories'
    ]
  }
  
  const platformSpecific = platformColumns[detectedPlatform.toLowerCase()] || []
  return [...standardColumns, ...platformSpecific]
}

/**
 * Convert CopyFlowOutput to CopyFlow column values
 */
function convertToCopyFlowColumns(content: CopyFlowOutput, detectedPlatform: string): Record<string, string> {
  const columns: Record<string, string> = {
    // Standard columns
    CopyFlow_Product_Title: content.productTitle,
    CopyFlow_Description: content.productDescription,
    CopyFlow_SEO_Title: content.seoTitle,
    CopyFlow_Meta_Description: content.metaDescription,
    CopyFlow_Call_To_Action: content.callToAction,
    CopyFlow_Bullet_Point_1: content.bulletPoints[0] || '',
    CopyFlow_Bullet_Point_2: content.bulletPoints[1] || '',
    CopyFlow_Bullet_Point_3: content.bulletPoints[2] || '',
    CopyFlow_Key_Features: content.keyFeatures.join(', '),
    CopyFlow_Tags: content.tags.join(', '),
    CopyFlow_TikTok_Hook_1: content.viralContent.tiktokHooks[0] || '',
    CopyFlow_TikTok_Hook_2: content.viralContent.tiktokHooks[1] || '',
    CopyFlow_Instagram_Caption_1: content.viralContent.instagramCaptions[0] || '',
    CopyFlow_Instagram_Caption_2: content.viralContent.instagramCaptions[1] || '',
    CopyFlow_Emotional_Hook_1: content.emotionalHooks[0] || '',
    CopyFlow_Trust_Signal_1: content.trustSignals[0] || '',
    CopyFlow_Competitor_Advantage_1: content.competitorAdvantages[0] || '',
    CopyFlow_Price_Anchor: content.priceAnchor
  }
  
  // Platform-specific columns
  switch (detectedPlatform.toLowerCase()) {
    case 'amazon':
      columns.CopyFlow_Amazon_Backend_Keywords = content.amazonBackendKeywords
      columns.CopyFlow_Amazon_Search_Terms = content.tags.slice(0, 5).join(', ')
      columns.CopyFlow_Amazon_Subject_Matter = content.targetAudience.primary
      break
      
    case 'shopify':
      columns.CopyFlow_Shopify_Handle = content.productTitle.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
      columns.CopyFlow_Shopify_SEO_Title = content.seoTitle
      columns.CopyFlow_Structured_Data = JSON.stringify({
        type: 'Product',
        name: content.productTitle,
        description: content.metaDescription
      })
      break
      
    case 'ebay':
      columns.CopyFlow_eBay_Auction_Style = `${content.productTitle} - ${content.callToAction}`
      columns.CopyFlow_eBay_USP = content.competitorAdvantages[0] || content.bulletPoints[0]
      columns.CopyFlow_eBay_Competitive_Price = content.priceAnchor
      break
      
    case 'etsy':
      columns.CopyFlow_Etsy_Artisan_Story = `Handcrafted with care: ${content.productDescription.substring(0, 200)}`
      columns.CopyFlow_Etsy_Handmade_Feel = content.emotionalHooks.join('. ')
      columns.CopyFlow_Etsy_Keywords = content.tags.join(', ')
      break
      
    case 'woocommerce':
      columns.CopyFlow_WooCommerce_Short_Description = content.metaDescription
      columns.CopyFlow_WooCommerce_Attributes = content.keyFeatures.join(' | ')
      columns.CopyFlow_WooCommerce_Categories = content.tags.slice(0, 3).join(', ')
      break
  }
  
  return columns
}

/**
 * Process single product with platform intelligence
 */
async function processSingleProduct(
  productData: Record<string, any>,
  rowIndex: number,
  globalSettings: CSVBulkRequest['globalSettings'],
  columnMapping: Record<string, string>,
  detectedPlatform: string,
  userId: string,
  userPlan: UserPlanType
): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
  try {
    // Extract product information from row using column mapping
    const productName = columnMapping.productName 
      ? productData[columnMapping.productName] 
      : productData['Product Name'] || productData['product_name'] || productData['name'] || `Product ${rowIndex + 1}`
    
    const description = columnMapping.description
      ? productData[columnMapping.description]
      : productData['Description'] || productData['description'] || ''
    
    const category = columnMapping.category
      ? productData[columnMapping.category]
      : productData['Category'] || productData['category'] || 'universal'
    
    const price = columnMapping.price
      ? productData[columnMapping.price]
      : productData['Price'] || productData['price'] || ''
    
    const sku = columnMapping.sku
      ? productData[columnMapping.sku]
      : productData['SKU'] || productData['sku'] || ''
    
    const brand = columnMapping.brand
      ? productData[columnMapping.brand]
      : productData['Brand'] || productData['brand'] || ''
    
    // Build generation request with platform context
    const generationRequest: GenerationRequest = {
      inputMethod: 'csv',
      productName: String(productName).trim(),
      productDescription: String(description).trim() || undefined,
      keyFeatures: [],
      category: String(category).toLowerCase(),
      writingStyle: globalSettings.writingStyle,
      platforms: globalSettings.platforms,
      language: globalSettings.language,
      emojiSettings: globalSettings.emojiSettings,
      userId,
      userPlan: {
        type: userPlan,
        generationsLimit: getPlanLimit(userPlan),
        platformsAllowed: userPlan === 'business' ? 999 : userPlan === 'pro' ? 5 : 1,
        features: {
          csvBulkProcessing: userPlan !== 'free',
          urlIntelligence: userPlan !== 'free',
          apiAccess: userPlan === 'business',
          prioritySupport: userPlan !== 'free',
          whiteLabel: userPlan === 'business'
        },
        pricing: {
          monthly: userPlan === 'free' ? 0 : userPlan === 'pro' ? 19 : 49,
          yearly: userPlan === 'free' ? 0 : userPlan === 'pro' ? 190 : 490
        }
      }
    }
    
    // Generate content using Universal Assistant
    const response = await generateContent(generationRequest)
    
    if (response.success && response.data) {
      // Convert to CopyFlow column structure
      const copyFlowColumns = convertToCopyFlowColumns(response.data, detectedPlatform)
      
      // Combine original data with CopyFlow columns
      const enhancedData = {
        ...productData, // Original CSV data (КРИТИЧНО - preserved!)
        ...copyFlowColumns // CopyFlow enhanced columns
      }
      
      return {
        success: true,
        data: enhancedData
      }
    } else {
      return {
        success: false,
        error: response.error || 'Content generation failed'
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Process CSV bulk job with platform intelligence
 */
async function processBulkJob(job: BulkJob, request: CSVBulkRequest): Promise<void> {
  try {
    // Update job status
    job.status = 'processing'
    job.progress.currentPhase = 'detection'
    jobStorage.set(job.id, job)
    
    // Decode file data
    const fileBuffer = Buffer.from(request.fileData, 'base64')
    const file = new File([fileBuffer], request.fileName)
    
    // Parse CSV
    const parseResult = await parseCSV(file, request.userPlan)
    
    if (!parseResult.success) {
      job.status = 'failed'
      job.errors.push({
        rowIndex: -1,
        productName: 'File parsing',
        error: parseResult.error || 'Failed to parse CSV file',
        phase: 'detection'
      })
      jobStorage.set(job.id, job)
      return
    }
    
    // Platform detection analysis
    let detectedPlatform = 'universal'
    let columnMapping: Record<string, string> = {}
    let exportStructure: any = {}
    
    if (!request.forcePlatform) {
      try {
        const platformAnalysis = analyzePlatform(parseResult.headers, parseResult.sampleData)
        detectedPlatform = platformAnalysis.detectedPlatform
        columnMapping = platformAnalysis.columnMapping
        exportStructure = platformAnalysis.exportStructure
        
        // Store platform detection results
        job.platformDetection = {
          detectedPlatform,
          confidence: platformAnalysis.confidence,
          columnMapping,
          exportStructure
        }
        
        console.log(`Platform detected: ${detectedPlatform} (${platformAnalysis.confidence}% confidence)`)
      } catch (error) {
        console.warn('Platform detection failed, using universal:', error)
        detectedPlatform = 'universal'
      }
    } else {
      detectedPlatform = request.forcePlatform
      columnMapping = generateColumnMapping(parseResult.headers, detectedPlatform)
    }
    
    // Use provided column mapping if available
    if (request.columnMapping) {
      columnMapping = { ...columnMapping, ...request.columnMapping }
    }
    
    // Update job with platform info
    job.progress.currentPhase = 'processing'
    jobStorage.set(job.id, job)
    
    // Process selected rows
    const processedData: any[] = []
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < request.selectedRows.length; i++) {
      const rowIndex = request.selectedRows[i]
      const rowData = parseResult.sampleData[rowIndex]
      
      if (!rowData) {
        job.errors.push({
          rowIndex,
          productName: `Row ${rowIndex + 1}`,
          error: 'Row data not found',
          phase: 'processing'
        })
        failCount++
        continue
      }
      
      // Convert array to object using headers
      const productData: Record<string, any> = {}
      parseResult.headers.forEach((header, index) => {
        productData[header] = rowData[index] || ''
      })
      
      // Update progress
      job.progress.currentProduct = productData[columnMapping.productName || 'Product Name'] || `Product ${rowIndex + 1}`
      job.progress.processed = i
      jobStorage.set(job.id, job)
      
      // Process single product with platform intelligence
      const result = await processSingleProduct(
        productData,
        rowIndex,
        request.globalSettings,
        columnMapping,
        detectedPlatform,
        request.userId,
        request.userPlan
      )
      
      if (result.success && result.data) {
        processedData.push(result.data)
        successCount++
      } else {
        job.errors.push({
          rowIndex,
          productName: job.progress.currentProduct,
          error: result.error || 'Processing failed',
          phase: 'processing'
        })
        failCount++
      }
      
      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Compilation phase
    job.progress.currentPhase = 'compilation'
    jobStorage.set(job.id, job)
    
    // Generate enhanced CSV output
    if (processedData.length > 0) {
      try {
        // Get all unique headers (original + CopyFlow)
        const allHeaders = new Set<string>()
        processedData.forEach(row => {
          Object.keys(row).forEach(header => allHeaders.add(header))
        })
        
        const sortedHeaders = Array.from(allHeaders).sort((a, b) => {
          // Original columns first, then CopyFlow columns
          const aIsCopyFlow = a.startsWith('CopyFlow_')
          const bIsCopyFlow = b.startsWith('CopyFlow_')
          
          if (aIsCopyFlow && !bIsCopyFlow) return 1
          if (!aIsCopyFlow && bIsCopyFlow) return -1
          return a.localeCompare(b)
        })
        
        // Generate CSV content
        const csvRows = [
          // Header row
          sortedHeaders.map(header => `"${header}"`).join(','),
          // Data rows
          ...processedData.map(row => 
            sortedHeaders.map(header => {
              const value = row[header] || ''
              // Escape CSV values
              return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
                ? `"${value.replace(/"/g, '""')}"`
                : `"${value}"`
            }).join(',')
          )
        ]
        
        const csvContent = csvRows.join('\n')
        
        // Save to temporary storage
        const outputDir = join(process.cwd(), 'tmp', 'bulk-outputs')
        await mkdir(outputDir, { recursive: true })
        
        const outputFileName = `copyflow-enhanced-${job.id}.csv`
        const outputPath = join(outputDir, outputFileName)
        
        await writeFile(outputPath, csvContent, 'utf-8')
        
        // Calculate CopyFlow columns added
        const copyFlowColumns = sortedHeaders.filter(h => h.startsWith('CopyFlow_'))
        const originalColumns = sortedHeaders.filter(h => !h.startsWith('CopyFlow_'))
        
        // Update job with results
        job.results = {
          successfulProducts: successCount,
          failedProducts: failCount,
          outputFileUrl: `/api/download/bulk-output/${job.id}`,
          processingTime: Date.now() - job.createdAt.getTime(),
          platformOptimizations: [detectedPlatform],
          copyFlowColumnsAdded: copyFlowColumns.length,
          originalColumnsPreserved: originalColumns.length
        }
        
        console.log(`Enhanced CSV generated: ${originalColumns.length} original + ${copyFlowColumns.length} CopyFlow columns`)
        
      } catch (error) {
        job.errors.push({
          rowIndex: -1,
          productName: 'CSV compilation',
          error: error instanceof Error ? error.message : 'CSV generation failed',
          phase: 'compilation'
        })
      }
    }
    
    // Complete job
    job.status = 'completed'
    job.progress.processed = request.selectedRows.length
    job.progress.failed = failCount
    job.completedAt = new Date()
    jobStorage.set(job.id, job)
    
  } catch (error) {
    console.error('Bulk processing error:', error)
    job.status = 'failed'
    job.errors.push({
      rowIndex: -1,
      productName: 'System error',
      error: error instanceof Error ? error.message : 'Unknown system error',
      phase: 'processing'
    })
    jobStorage.set(job.id, job)
  }
}

/**
 * POST /api/magic-input/csv-bulk
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request
    const body = await request.json()
    const validationResult = CSVBulkRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 })
    }
    
    const requestData = validationResult.data
    
    // Check bulk rate limiting
    if (!checkBulkRateLimit(requestData.userId, requestData.userPlan)) {
      return NextResponse.json({
        success: false,
        error: 'Bulk processing rate limit exceeded. Please wait before starting another job.',
        errorCode: 'BULK_RATE_LIMIT'
      }, { status: 429 })
    }
    
    // Calculate total usage cost
    const usageCostPerProduct = calculateUsage(requestData.globalSettings.platforms)
    const totalUsageCost = requestData.selectedRows.length * usageCostPerProduct
    const planLimit = getPlanLimit(requestData.userPlan)
    
    // Check if user can afford bulk processing
    const affordabilityCheck = canAffordBulkProcessing(
      requestData.currentUsage,
      planLimit,
      totalUsageCost
    )
    
    if (!affordabilityCheck.canAfford) {
      return NextResponse.json({
        success: false,
        error: `Insufficient usage limit. Need ${totalUsageCost} generations, but only ${affordabilityCheck.remainingGenerations} remaining.`,
        errorCode: 'INSUFFICIENT_USAGE',
        usageInfo: {
          required: totalUsageCost,
          available: affordabilityCheck.remainingGenerations,
          shortfall: affordabilityCheck.shortfall
        }
      }, { status: 403 })
    }
    
    // Create enhanced bulk job
    const jobId = randomUUID()
    const job: BulkJob = {
      id: jobId,
      userId: requestData.userId,
      status: 'queued',
      progress: {
        total: requestData.selectedRows.length,
        processed: 0,
        failed: 0,
        currentPhase: 'detection'
      },
      errors: [],
      createdAt: new Date()
    }
    
    // Store job
    jobStorage.set(jobId, job)
    
    // Start processing asynchronously
    processBulkJob(job, requestData).catch(error => {
      console.error('Async bulk processing error:', error)
    })
    
    return NextResponse.json({
      success: true,
      jobId,
      status: job.status,
      progress: job.progress,
      estimatedTime: `${Math.ceil(requestData.selectedRows.length * 3 / 60)} minutes`, // Updated estimate
      usageInfo: {
        costPerProduct: usageCostPerProduct,
        totalCost: totalUsageCost,
        remainingAfter: planLimit - requestData.currentUsage - totalUsageCost
      },
      features: {
        platformDetection: true,
        copyFlowStructure: true,
        originalColumnsPreserved: true,
        importCompatibility: true
      }
    })
    
  } catch (error) {
    console.error('CSV bulk API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

/**
 * GET /api/magic-input/csv-bulk?jobId=xxx - Check job status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { status: 400 })
    }
    
    const job = jobStorage.get(jobId)
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      platformDetection: job.platformDetection,
      results: job.results,
      errors: job.errors.slice(0, 10), // Limit errors in response
      createdAt: job.createdAt,
      completedAt: job.completedAt
    })
    
  } catch (error) {
    console.error('Job status API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}