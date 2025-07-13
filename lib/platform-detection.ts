// ============================================================================
// PLATFORM DETECTION ENGINE - ANALYSIS ONLY (NO CONTENT GENERATION!)
// ============================================================================

import { z } from 'zod'

// Platform types
export type PlatformType = 
  | 'shopify' 
  | 'amazon' 
  | 'woocommerce' 
  | 'ebay' 
  | 'etsy' 
  | 'magento'
  | 'prestashop'
  | 'bigcommerce'
  | 'opencart'
  | 'khoroshop'
  | 'unknown'

// Evidence interface
export interface Evidence {
  type: 'required_column' | 'optional_column' | 'pattern_match' | 'data_format'
  field: string
  value: string
  weight: number // 1-10
  confidence: number // 0-100
}

// Column mapping interface
export interface ColumnMapping {
  productName?: string
  description?: string
  price?: string
  sku?: string
  category?: string
  brand?: string
  images?: string
  weight?: string
  dimensions?: string
  inventory?: string
  [key: string]: string | undefined
}

// Export structure interface
export interface ExportStructure {
  preserveOriginalColumns: string[]
  addCopyFlowColumns: string[]
  platformSpecificColumns: string[]
  totalColumns: number
  estimatedFileSize: string
}

// Platform detection result
export interface PlatformDetectionResult {
  detectedPlatform: PlatformType
  confidence: number // 0-100
  evidence: Evidence[]
  columnMapping: ColumnMapping
  exportStructure: ExportStructure
  warnings: string[]
  processingTime: number
}

// Platform signature definitions
const PLATFORM_SIGNATURES = {
  shopify: {
    required: ['Handle', 'Title', 'Vendor'],
    optional: ['Body (HTML)', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price'],
    patterns: {
      handle: /^[a-z0-9-]+$/,
      published: /^(true|false)$/i,
      price: /^\d+\.\d{2}$/
    },
    weight: 10
  },
  amazon: {
    required: ['ASIN', 'Product Title'],
    optional: ['Brand', 'Manufacturer', 'Product Description', 'Bullet Point 1', 'Bullet Point 2', 'Search Terms'],
    patterns: {
      asin: /^[A-Z0-9]{10}$/,
      bulletPoint: /^Bullet Point \d+$/
    },
    weight: 10
  },
  woocommerce: {
    required: ['SKU', 'Name', 'Regular price'],
    optional: ['Short description', 'Description', 'Categories', 'Tags', 'Stock', 'Weight', 'Length', 'Width', 'Height'],
    patterns: {
      sku: /^[A-Z0-9-_]+$/,
      price: /^\d+(\.\d{2})?$/,
      stock: /^\d+$/
    },
    weight: 9
  },
  ebay: {
    required: ['Item ID', 'Title', 'Category'],
    optional: ['Condition', 'Price', 'Quantity', 'Format', 'Duration', 'Start Price', 'Reserve Price'],
    patterns: {
      itemId: /^\d{12}$/,
      format: /^(Auction|FixedPrice)$/i,
      condition: /^(New|Used|Refurbished)$/i
    },
    weight: 9
  },
  etsy: {
    required: ['Listing ID', 'Title', 'Tags'],
    optional: ['Description', 'Price', 'Quantity', 'SKU', 'Materials', 'Shop Section'],
    patterns: {
      listingId: /^\d{8,12}$/,
      tags: /^[^,]+(,[^,]+)*$/,
      materials: /^[^,]+(,[^,]+)*$/
    },
    weight: 8
  },
  magento: {
    required: ['sku', 'name', 'price'],
    optional: ['description', 'short_description', 'weight', 'status', 'visibility', 'tax_class_id'],
    patterns: {
      sku: /^[A-Z0-9-_]+$/,
      status: /^[01]$/,
      visibility: /^[1-4]$/
    },
    weight: 7
  },
  prestashop: {
    required: ['ID', 'Name', 'Price'],
    optional: ['Description', 'Short description', 'Reference', 'EAN13', 'UPC', 'Weight', 'Categories'],
    patterns: {
      id: /^\d+$/,
      ean13: /^\d{13}$/,
      upc: /^\d{12}$/
    },
    weight: 7
  },
  bigcommerce: {
    required: ['Product ID', 'Product Name', 'Price'],
    optional: ['Description', 'SKU', 'Weight', 'Width', 'Height', 'Depth', 'Categories', 'Brand'],
    patterns: {
      productId: /^\d+$/,
      price: /^\d+(\.\d{2})?$/
    },
    weight: 7
  },
  opencart: {
    required: ['product_id', 'name', 'price'],
    optional: ['description', 'model', 'sku', 'quantity', 'status', 'weight', 'length', 'width', 'height'],
    patterns: {
      productId: /^\d+$/,
      status: /^[01]$/,
      quantity: /^\d+$/
    },
    weight: 6
  },
  khoroshop: {
    required: ['Назва', 'Ціна', 'Категорія'],
    optional: ['Опис', 'Артикул', 'Бренд', 'Вага', 'Наявність', 'Знижка'],
    patterns: {
      price: /^\d+(\.\d{2})?\s*(грн|UAH)?$/,
      availability: /^(В наявності|Немає в наявності|Під замовлення)$/
    },
    weight: 8
  }
} as const

/**
 * Analyze platform based on CSV headers and sample data
 */
export function analyzePlatform(
  headers: string[], 
  sampleData: any[]
): PlatformDetectionResult {
  const startTime = Date.now()
  const evidence: Evidence[] = []
  const warnings: string[] = []
  
  // Validate input
  if (!headers || headers.length === 0) {
    return createFailureResult('No headers provided', startTime)
  }
  
  if (!sampleData || sampleData.length === 0) {
    warnings.push('No sample data provided - detection based on headers only')
  }
  
  // Normalize headers for comparison
  const normalizedHeaders = headers.map(h => h.trim())
  
  // Score each platform
  const platformScores: Record<PlatformType, number> = {} as any
  
  for (const [platform, signature] of Object.entries(PLATFORM_SIGNATURES)) {
    const score = scorePlatform(
      platform as PlatformType,
      signature,
      normalizedHeaders,
      sampleData,
      evidence
    )
    platformScores[platform as PlatformType] = score
  }
  
  // Find best match
  const bestPlatform = Object.entries(platformScores)
    .sort(([,a], [,b]) => b - a)[0]
  
  const detectedPlatform = bestPlatform[1] > 30 ? bestPlatform[0] as PlatformType : 'unknown'
  const confidence = Math.min(bestPlatform[1], 100)
  
  // Generate column mapping
  const columnMapping = generateColumnMapping(normalizedHeaders, detectedPlatform)
  
  // Plan export structure
  const exportStructure = planExportStructure(normalizedHeaders, detectedPlatform)
  
  // Add warnings for low confidence
  if (confidence < 50) {
    warnings.push('Low confidence detection - manual verification recommended')
  }
  
  if (confidence < 30) {
    warnings.push('Platform could not be reliably detected')
  }
  
  return {
    detectedPlatform,
    confidence,
    evidence: evidence.slice(0, 10), // Limit evidence items
    columnMapping,
    exportStructure,
    warnings,
    processingTime: Date.now() - startTime
  }
}

/**
 * Score a platform based on signature matching
 */
function scorePlatform(
  platform: PlatformType,
  signature: any,
  headers: string[],
  sampleData: any[],
  evidence: Evidence[]
): number {
  let score = 0
  const maxScore = 100
  
  // Check required columns (high weight)
  const requiredMatches = signature.required.filter((req: string) => 
    headers.some(header => 
      header.toLowerCase() === req.toLowerCase() ||
      header.toLowerCase().includes(req.toLowerCase())
    )
  )
  
  const requiredScore = (requiredMatches.length / signature.required.length) * 60
  score += requiredScore
  
  // Add evidence for required matches
  requiredMatches.forEach((match: string) => {
    evidence.push({
      type: 'required_column',
      field: match,
      value: 'present',
      weight: 10,
      confidence: 95
    })
  })
  
  // Check optional columns (medium weight)
  const optionalMatches = signature.optional.filter((opt: string) =>
    headers.some(header => 
      header.toLowerCase() === opt.toLowerCase() ||
      header.toLowerCase().includes(opt.toLowerCase())
    )
  )
  
  const optionalScore = (optionalMatches.length / signature.optional.length) * 25
  score += optionalScore
  
  // Add evidence for optional matches
  optionalMatches.forEach((match: string) => {
    evidence.push({
      type: 'optional_column',
      field: match,
      value: 'present',
      weight: 5,
      confidence: 80
    })
  })
  
  // Check data patterns (medium weight)
  if (sampleData && sampleData.length > 0) {
    const patternScore = checkDataPatterns(platform, signature.patterns, headers, sampleData, evidence)
    score += patternScore
  }
  
  // Platform-specific bonuses
  score += getPlatformSpecificBonus(platform, headers, sampleData)
  
  return Math.min(score, maxScore)
}

/**
 * Check data patterns against platform signatures
 */
function checkDataPatterns(
  platform: PlatformType,
  patterns: any,
  headers: string[],
  sampleData: any[],
  evidence: Evidence[]
): number {
  let patternScore = 0
  const maxPatternScore = 15
  
  if (!patterns || !sampleData.length) return 0
  
  for (const [patternName, regex] of Object.entries(patterns)) {
    const headerIndex = headers.findIndex(h => 
      h.toLowerCase().includes(patternName.toLowerCase())
    )
    
    if (headerIndex === -1) continue
    
    let matches = 0
    const sampleSize = Math.min(sampleData.length, 5)
    
    for (let i = 0; i < sampleSize; i++) {
      const value = sampleData[i][headerIndex]
      if (value && (regex as RegExp).test(String(value))) {
        matches++
      }
    }
    
    const matchRate = matches / sampleSize
    if (matchRate > 0.5) {
      patternScore += (matchRate * 3)
      
      evidence.push({
        type: 'pattern_match',
        field: headers[headerIndex],
        value: `${Math.round(matchRate * 100)}% match`,
        weight: 7,
        confidence: Math.round(matchRate * 100)
      })
    }
  }
  
  return Math.min(patternScore, maxPatternScore)
}

/**
 * Get platform-specific bonus points
 */
function getPlatformSpecificBonus(
  platform: PlatformType,
  headers: string[],
  sampleData: any[]
): number {
  let bonus = 0
  
  switch (platform) {
    case 'shopify':
      // Shopify has very specific column names
      if (headers.includes('Handle') && headers.includes('Vendor')) bonus += 5
      if (headers.some(h => h.startsWith('Option'))) bonus += 3
      break
      
    case 'amazon':
      // Amazon has ASIN pattern and bullet points
      if (headers.some(h => h.includes('ASIN'))) bonus += 5
      if (headers.filter(h => h.includes('Bullet Point')).length >= 3) bonus += 3
      break
      
    case 'woocommerce':
      // WooCommerce has specific field naming
      if (headers.includes('Regular price') && headers.includes('Sale price')) bonus += 4
      if (headers.some(h => h.includes('attribute'))) bonus += 2
      break
      
    case 'khoroshop':
      // Ukrainian platform detection
      const ukrainianHeaders = headers.filter(h => /[а-яё]/i.test(h))
      if (ukrainianHeaders.length > headers.length * 0.5) bonus += 5
      break
  }
  
  return bonus
}

/**
 * Generate column mapping for detected platform
 */
export function generateColumnMapping(
  headers: string[], 
  detectedPlatform: PlatformType
): ColumnMapping {
  const mapping: ColumnMapping = {}
  
  // Standard field mappings
  const fieldMappings = {
    productName: ['name', 'title', 'product name', 'product title', 'назва'],
    description: ['description', 'body', 'content', 'опис'],
    price: ['price', 'regular price', 'ціна'],
    sku: ['sku', 'model', 'артикул'],
    category: ['category', 'categories', 'type', 'категорія'],
    brand: ['brand', 'vendor', 'manufacturer', 'бренд'],
    images: ['image', 'images', 'photo', 'зображення'],
    weight: ['weight', 'вага'],
    inventory: ['stock', 'quantity', 'inventory', 'наявність']
  }
  
  // Map fields to headers
  for (const [field, variations] of Object.entries(fieldMappings)) {
    const matchedHeader = headers.find(header => 
      variations.some(variation => 
        header.toLowerCase().includes(variation.toLowerCase())
      )
    )
    
    if (matchedHeader) {
      mapping[field] = matchedHeader
    }
  }
  
  // Platform-specific mappings
  switch (detectedPlatform) {
    case 'shopify':
      mapping.productName = headers.find(h => h === 'Title') || mapping.productName
      mapping.description = headers.find(h => h === 'Body (HTML)') || mapping.description
      break
      
    case 'amazon':
      mapping.productName = headers.find(h => h === 'Product Title') || mapping.productName
      mapping.sku = headers.find(h => h === 'ASIN') || mapping.sku
      break
      
    case 'woocommerce':
      mapping.productName = headers.find(h => h === 'Name') || mapping.productName
      mapping.price = headers.find(h => h === 'Regular price') || mapping.price
      break
  }
  
  return mapping
}

/**
 * Plan export structure for detected platform
 */
export function planExportStructure(
  originalColumns: string[], 
  detectedPlatform: PlatformType
): ExportStructure {
  // Always preserve ALL original columns
  const preserveOriginalColumns = [...originalColumns]
  
  // Standard CopyFlow columns to add
  const standardCopyFlowColumns = [
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
  const platformSpecificColumns: string[] = []
  
  switch (detectedPlatform) {
    case 'amazon':
      platformSpecificColumns.push(
        'CopyFlow_Amazon_Backend_Keywords',
        'CopyFlow_Amazon_Search_Terms',
        'CopyFlow_Amazon_Subject_Matter'
      )
      break
      
    case 'shopify':
      platformSpecificColumns.push(
        'CopyFlow_Shopify_Handle',
        'CopyFlow_Shopify_SEO_Title',
        'CopyFlow_Structured_Data'
      )
      break
      
    case 'ebay':
      platformSpecificColumns.push(
        'CopyFlow_eBay_Auction_Style',
        'CopyFlow_eBay_USP',
        'CopyFlow_eBay_Competitive_Price'
      )
      break
      
    case 'etsy':
      platformSpecificColumns.push(
        'CopyFlow_Etsy_Artisan_Story',
        'CopyFlow_Etsy_Handmade_Feel',
        'CopyFlow_Etsy_Keywords'
      )
      break
  }
  
  const addCopyFlowColumns = [...standardCopyFlowColumns, ...platformSpecificColumns]
  const totalColumns = preserveOriginalColumns.length + addCopyFlowColumns.length
  
  // Estimate file size increase
  const estimatedIncrease = Math.round((addCopyFlowColumns.length / preserveOriginalColumns.length) * 100)
  const estimatedFileSize = `+${estimatedIncrease}% larger (${addCopyFlowColumns.length} new columns)`
  
  return {
    preserveOriginalColumns,
    addCopyFlowColumns,
    platformSpecificColumns,
    totalColumns,
    estimatedFileSize
  }
}

/**
 * Calculate confidence score based on evidence
 */
export function calculateConfidence(platform: PlatformType, evidence: Evidence[]): number {
  if (!evidence || evidence.length === 0) return 0
  
  let totalWeight = 0
  let weightedScore = 0
  
  evidence.forEach(item => {
    totalWeight += item.weight
    weightedScore += (item.confidence * item.weight)
  })
  
  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0
}

/**
 * Create failure result
 */
function createFailureResult(error: string, startTime: number): PlatformDetectionResult {
  return {
    detectedPlatform: 'unknown',
    confidence: 0,
    evidence: [],
    columnMapping: {},
    exportStructure: {
      preserveOriginalColumns: [],
      addCopyFlowColumns: [],
      platformSpecificColumns: [],
      totalColumns: 0,
      estimatedFileSize: 'Unknown'
    },
    warnings: [error],
    processingTime: Date.now() - startTime
  }
}

/**
 * Get supported platforms list
 */
export function getSupportedPlatforms(): PlatformType[] {
  return Object.keys(PLATFORM_SIGNATURES) as PlatformType[]
}

/**
 * Validate platform detection result
 */
export function validateDetectionResult(result: PlatformDetectionResult): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!result.detectedPlatform) {
    errors.push('No platform detected')
  }
  
  if (result.confidence < 0 || result.confidence > 100) {
    errors.push('Invalid confidence score')
  }
  
  if (!result.exportStructure.preserveOriginalColumns) {
    errors.push('Export structure missing original columns')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Export utilities
export const PlatformDetection = {
  analyzePlatform,
  generateColumnMapping,
  planExportStructure,
  calculateConfidence,
  getSupportedPlatforms,
  validateDetectionResult
} as const