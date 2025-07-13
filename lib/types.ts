import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// CORE COPYFLOW TYPES - Export=Import Workflow
// ============================================================================

// CopyFlow Structured Output (6 tabs in UI)
export interface CopyFlowOutput {
  // 📝 Main Content Tab
  productTitle: string           // 40-60 chars, optimal: 50
  productDescription: string     // 500-1800 chars, optimal: 1200  
  seoTitle: string              // 40-60 chars, optimal: 55
  metaDescription: string       // 80-160 chars, optimal: 150
  callToAction: string          // 15-50 chars, optimal: 25

  // 🎯 Marketing Tab
  bulletPoints: string[]        // 3-7 items, each 30-80 chars
  keyFeatures: string[]         // 3-8 items, technical specs
  tags: string[]               // 5-15 SEO keywords
  amazonBackendKeywords: string // Exactly 249 characters

  // 📱 Viral Content Tab
  viralContent: {
    tiktokHooks: string[]       // 3-5 hooks, each 20-60 chars
    instagramCaptions: string[] // 3-5 captions, each 50-150 chars
  }

  // 👥 Audience Tab
  targetAudience: {
    primary: string             // 30-150 chars description
    painPoints: string[]        // 3-5 items, each 20-80 chars
    desires: string[]           // 3-5 items, each 20-80 chars
  }

  // 🧠 Psychology Tab
  emotionalHooks: string[]      // 3-6 emotional triggers
  conversionTriggers: string[]  // 3-6 psychology triggers
  trustSignals: string[]        // 3-6 credibility indicators
  urgencyElements: string[]     // 3-5 scarcity tactics
  socialProof: string[]        // 3-5 testimonial elements

  // 🏆 Competitive Tab
  competitorAdvantages: string[] // 3-6 USPs vs competition
  priceAnchor: string          // 50-200 chars value justification
  keywordGaps: string[]        // 3-5 missed keywords by competitors
}

// Generation Request (Magic Input → AI Assistant)
export interface GenerationRequest {
  // Input method
  inputMethod: 'text' | 'csv' | 'url'
  
  // Product data
  productName: string
  productDescription?: string
  keyFeatures?: string[]
  category: string
  
  // Generation settings
  writingStyle: string
  platforms: string[]          // ['universal', 'amazon', 'shopify']
  language: string
  emojiSettings: EmojiSettings
  
  // User context
  userId: string
  userPlan: UserPlan
}

// Usage Statistics & Billing
export interface UsageStats {
  userId: string
  period: string              // YYYY-MM format
  
  // Core tracking
  baseGenerations: number     // Universal генерації
  platformAddOns: number      // Додаткові платформи (×0.5)
  totalUsed: number          // baseGenerations + platformAddOns
  planLimit: number          // Free: 5, Pro: 500, Business: 2000
  
  // Advanced metrics
  breakdown: {
    textInput: number
    csvBulk: number
    urlParser: number
    postGeneration: number    // додавання платформ після генерації
  }
  
  // Performance data
  averageProcessingTime: number
  successRate: number
  errorRate: number
}

// Platform Detection Result (CSV Analysis)
export interface PlatformDetectionResult {
  // Detection results
  detectedPlatform: string | null    // 'shopify' | 'amazon' | 'woocommerce' | null
  confidence: number                 // 0-100 confidence score
  
  // Column analysis
  columnMapping: {
    productName?: string             // mapped column name
    description?: string
    price?: string
    sku?: string
    category?: string
    [key: string]: string | undefined
  }
  
  // Export structure planning
  exportStructurePlan: {
    preserveOriginalColumns: string[]  // ALL original columns to keep
    addCopyFlowColumns: string[]      // CopyFlow_ columns to add
    platformSpecificColumns: string[] // Platform-specific optimizations
  }
  
  // Metadata
  totalRows: number
  sampleData: Record<string, any>[]  // First 5 rows for preview
  processingTime: number
}

// CSV Analysis Result (Platform Detection Assistant output)
export interface CSVAnalysisResult {
  // File validation
  isValid: boolean
  fileSize: number
  totalProducts: number
  encoding: string
  
  // Platform detection
  platformDetection: PlatformDetectionResult
  
  // Column analysis
  detectedColumns: {
    name: string
    type: 'text' | 'number' | 'date' | 'boolean'
    sampleValues: string[]
    confidence: number
  }[]
  
  // Processing recommendations
  recommendations: {
    suggestedPlatforms: string[]
    requiredMappings: string[]
    warnings: string[]
  }
}

// Competitor Analysis (URL Intelligence)
export interface CompetitorAnalysis {
  // Source data
  sourceUrl: string
  detectedPlatform: string
  extractionSuccess: boolean
  
  // Extracted product data
  extractedData: {
    title: string
    description: string
    price?: string
    features: string[]
    images: string[]
    reviews?: {
      rating: number
      count: number
      highlights: string[]
    }
  }
  
  // Competitive insights
  competitiveInsights: {
    priceComparison: string
    featureGaps: string[]
    keywordOpportunities: string[]
    positioningAdvantages: string[]
    contentQualityAssessment: string
  }
  
  // Enhancement suggestions
  enhancementSuggestions: {
    improvedTitle: string
    betterDescription: string
    competitiveAdvantages: string[]
    pricingStrategy: string
  }
}

// Export Format Types (4 formats)
export type ExportFormat = 'txt' | 'csv' | 'xlsx' | 'json'

export interface ExportData {
  format: ExportFormat
  originalData?: Record<string, any>[]  // Original CSV data (preserved)
  enhancedData: {
    // Original columns (preserved exactly)
    [originalColumn: string]: any
    
    // CopyFlow enhanced columns (added)
    CopyFlow_Product_Title: string
    CopyFlow_Description: string
    CopyFlow_SEO_Title: string
    CopyFlow_Meta_Description: string
    CopyFlow_Call_To_Action: string
    CopyFlow_Bullet_Point_1: string
    CopyFlow_Bullet_Point_2: string
    CopyFlow_Bullet_Point_3: string
    CopyFlow_Key_Features: string
    CopyFlow_Tags: string
    CopyFlow_TikTok_Hook_1: string
    CopyFlow_TikTok_Hook_2: string
    CopyFlow_Instagram_Caption_1: string
    CopyFlow_Instagram_Caption_2: string
    CopyFlow_Emotional_Hook_1: string
    CopyFlow_Trust_Signal_1: string
    CopyFlow_Competitor_Advantage_1: string
    CopyFlow_Price_Anchor: string
    
    // Platform-specific columns (conditional)
    CopyFlow_Amazon_Backend_Keywords?: string
    CopyFlow_Amazon_Search_Terms?: string
    CopyFlow_Shopify_Handle?: string
    CopyFlow_Shopify_SEO_Title?: string
    CopyFlow_eBay_Auction_Style?: string
    CopyFlow_Etsy_Artisan_Story?: string
  }[]
  
  metadata: {
    generatedAt: string
    totalProducts: number
    magicInputMethod: 'text' | 'csv' | 'url'
    platformsGenerated: string[]
    generationsUsed: number
    language: string
    writingStyle: string
  }
}

// Assistant Phase Types (1A vs 1B rollout)
export type AssistantPhase = '1A' | '1B'

export interface AssistantConfig {
  phase: AssistantPhase
  availableAssistants: {
    universal: string           // Always available
    platformDetection: string  // Always available
    customerSupport: string     // Always available
    
    // Category specialists (Phase 1B)
    electronics?: string
    fashion?: string
    beauty?: string
    home?: string
    sports?: string
    health?: string
    automotive?: string
    food?: string
    travel?: string
    toys?: string
    jewelry?: string
    books?: string
    pets?: string
    business?: string
    art?: string
    music?: string
  }
  
  fallbackStrategy: 'universal' | 'error'
}

// User Plan Types (Free/Pro/Business)
export type UserPlanType = 'free' | 'pro' | 'business'

export interface UserPlan {
  type: UserPlanType
  generationsLimit: number    // Free: 5, Pro: 500, Business: 2000
  platformsAllowed: number    // Free: 1 (Universal only), Pro: 5, Business: unlimited
  features: {
    csvBulkProcessing: boolean
    urlIntelligence: boolean
    apiAccess: boolean
    prioritySupport: boolean
    whiteLabel: boolean
  }
  pricing: {
    monthly: number           // UAH
    yearly: number           // UAH (with discount)
  }
}

// Emoji Settings Interface
export interface EmojiSettings {
  enabled: boolean
  intensity: 'low' | 'medium' | 'high'  // 3-5, 8-12, 15-20 emojis
  categorySpecific: boolean             // Use category-specific emojis
  
  // Intensity details
  intensityConfig: {
    low: { count: string; example: string }
    medium: { count: string; example: string }
    high: { count: string; example: string }
  }
}

// Magic Input Method Types
export type MagicInputMethod = 'text' | 'csv' | 'url'

export interface MagicInputConfig {
  method: MagicInputMethod
  
  // Text input specific
  textInput?: {
    productName: string
    productDescription?: string
    keyFeatures?: string[]
    category: string
  }
  
  // CSV bulk specific
  csvBulk?: {
    file: File
    platformDetection: PlatformDetectionResult
    selectedProducts: number[]  // Row indices to process
    globalSettings: {
      writingStyle: string
      emojiSettings: EmojiSettings
      platforms: string[]
    }
  }
  
  // URL intelligence specific
  urlIntelligence?: {
    url: string
    analysisDepth: 'basic' | 'detailed' | 'competitive'
    targetPlatforms: string[]
    enhancementFocus: 'content' | 'competitive' | 'viral'
  }
}

// Generation Response (AI Assistant → Frontend)
export interface GenerationResponse {
  success: boolean
  data?: CopyFlowOutput
  error?: string
  
  // Processing metadata
  processingTime: number
  assistantUsed: string
  tokensConsumed: number
  usageCost: number
  
  // Quality metrics
  confidenceScore: number
  contentQuality: 'excellent' | 'good' | 'fair' | 'poor'
  
  // Export options
  exportOptions: {
    availableFormats: ExportFormat[]
    downloadUrls?: Record<ExportFormat, string>
  }
}

// Bulk Processing Status
export interface BulkProcessingStatus {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: {
    total: number
    processed: number
    failed: number
    currentProduct?: string
  }
  
  // Results
  results?: {
    successfulProducts: number
    failedProducts: number
    outputFileUrl?: string
    processingTime: number
    averageTimePerProduct: number
  }
  
  // Error handling
  errors?: {
    productIndex: number
    productName: string
    errorMessage: string
    retryable: boolean
  }[]
}

// Support Chat Types
export interface SupportChatMessage {
  id: string
  sessionId: string
  senderType: 'user' | 'ai_assistant' | 'human_support'
  messageContent: string
  messageType: 'text' | 'image' | 'file' | 'quick_reply'
  timestamp: Date
  
  // AI context
  assistantUsed?: string
  responseTime?: number
  confidenceScore?: number
}

export interface SupportChatSession {
  id: string
  userId: string
  status: 'active' | 'resolved' | 'escalated'
  startedAt: Date
  endedAt?: Date
  
  // Context
  userPage?: string
  userPlan?: string
  userUsageContext?: UsageStats
  
  // Resolution
  satisfactionRating?: number  // 1-5 stars
  resolutionTimeMinutes?: number
  escalatedToHuman: boolean
  
  messages: SupportChatMessage[]
}

// Error Types
export interface CopyFlowError {
  code: string
  message: string
  details?: Record<string, any>
  retryable: boolean
  userFriendlyMessage: string
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: CopyFlowError
  metadata?: {
    requestId: string
    processingTime: number
    timestamp: string
  }
}

// Constants from utils.ts (re-exported for convenience)
export type CategoryId = 'electronics' | 'fashion' | 'beauty' | 'home' | 'sports' | 'health' | 'automotive' | 'food' | 'travel' | 'toys' | 'jewelry' | 'books' | 'pets' | 'business' | 'art' | 'music' | 'universal'

export type WritingStyleId = 'professional' | 'casual' | 'luxury' | 'technical' | 'creative'

export type PlatformId = 'universal' | 'amazon' | 'shopify' | 'instagram' | 'tiktok' | 'facebook' | 'ebay' | 'etsy'

export type LanguageCode = 'en' | 'uk' | 'de' | 'es' | 'fr' | 'it' | 'pl' | 'pt' | 'zh' | 'ja' | 'ar'

export type EmojiIntensityId = 'low' | 'medium' | 'high'