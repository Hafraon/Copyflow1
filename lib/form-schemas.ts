import { z } from 'zod'

// ============================================================================
// COPYFLOW FORM VALIDATION SCHEMAS
// ============================================================================

// Supported file types for CSV upload
const SUPPORTED_FILE_TYPES = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/

// Product categories
const PRODUCT_CATEGORIES = [
  'electronics', 'fashion', 'beauty', 'home', 'sports', 'health', 
  'automotive', 'food', 'travel', 'toys', 'jewelry', 'books', 
  'pets', 'business', 'art', 'music', 'universal'
] as const

// Writing styles
const WRITING_STYLES = [
  'professional', 'casual', 'luxury', 'technical', 'creative'
] as const

// Platforms
const PLATFORMS = [
  'universal', 'amazon', 'shopify', 'instagram', 'tiktok', 
  'facebook', 'ebay', 'etsy'
] as const

// Languages
const LANGUAGES = [
  'en', 'uk', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'zh', 'ja', 'ar'
] as const

// Emoji intensities
const EMOJI_INTENSITIES = ['low', 'medium', 'high'] as const

// ============================================================================
// TEXT INPUT SCHEMA
// ============================================================================

export const TextInputSchema = z.object({
  productName: z
    .string()
    .min(1, 'Product name is required')
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must be less than 100 characters')
    .trim(),
  
  productDescription: z
    .string()
    .max(2000, 'Product description must be less than 2000 characters')
    .optional()
    .transform(val => val?.trim() || undefined),
  
  keyFeatures: z
    .array(z.string().min(1, 'Feature cannot be empty').max(200, 'Feature too long'))
    .max(10, 'Maximum 10 features allowed')
    .optional()
    .default([]),
  
  category: z
    .enum(PRODUCT_CATEGORIES, {
      errorMap: () => ({ message: 'Please select a valid category' })
    }),
  
  writingStyle: z
    .enum(WRITING_STYLES, {
      errorMap: () => ({ message: 'Please select a writing style' })
    }),
  
  platforms: z
    .array(z.enum(PLATFORMS))
    .min(1, 'At least one platform must be selected')
    .max(8, 'Maximum 8 platforms allowed')
    .refine(
      (platforms) => platforms.includes('universal'),
      'Universal platform is always required'
    ),
  
  language: z
    .enum(LANGUAGES, {
      errorMap: () => ({ message: 'Please select a language' })
    }),
  
  emojiIntensity: z
    .enum(EMOJI_INTENSITIES, {
      errorMap: () => ({ message: 'Please select emoji intensity' })
    }),
  
  includeEmojis: z.boolean().default(true),
})

export type TextInputFormData = z.infer<typeof TextInputSchema>

// ============================================================================
// CSV UPLOAD SCHEMA
// ============================================================================

export const CSVUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'Please select a file' })
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      'File size must be less than 10MB'
    )
    .refine(
      (file) => SUPPORTED_FILE_TYPES.includes(file.type) || file.name.endsWith('.csv'),
      'Only CSV and Excel files are supported'
    ),
  
  // Global settings for all products
  globalWritingStyle: z
    .enum(WRITING_STYLES, {
      errorMap: () => ({ message: 'Please select a writing style' })
    }),
  
  globalPlatforms: z
    .array(z.enum(PLATFORMS))
    .min(1, 'At least one platform must be selected')
    .refine(
      (platforms) => platforms.includes('universal'),
      'Universal platform is always required'
    ),
  
  globalLanguage: z
    .enum(LANGUAGES, {
      errorMap: () => ({ message: 'Please select a language' })
    }),
  
  globalEmojiIntensity: z
    .enum(EMOJI_INTENSITIES, {
      errorMap: () => ({ message: 'Please select emoji intensity' })
    }),
  
  globalIncludeEmojis: z.boolean().default(true),
  
  // Column mapping (filled after file analysis)
  columnMapping: z.object({
    productName: z.string().optional(),
    description: z.string().optional(),
    price: z.string().optional(),
    category: z.string().optional(),
    sku: z.string().optional(),
  }).optional(),
  
  // Processing options
  skipFirstRow: z.boolean().default(true),
  maxProducts: z.number().min(1).max(1000).default(100),
  
  // Platform detection override
  detectedPlatform: z.string().optional(),
  platformConfidence: z.number().min(0).max(100).optional(),
})

export type CSVUploadFormData = z.infer<typeof CSVUploadSchema>

// ============================================================================
// URL INPUT SCHEMA
// ============================================================================

export const URLInputSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .regex(URL_REGEX, 'Please enter a valid URL')
    .refine(
      (url) => {
        try {
          const domain = new URL(url).hostname.toLowerCase()
          // Check if it's a supported e-commerce platform
          const supportedDomains = [
            'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr',
            'shopify.com', 'myshopify.com',
            'ebay.com', 'ebay.co.uk',
            'etsy.com',
            'aliexpress.com',
            'walmart.com',
            'target.com'
          ]
          return supportedDomains.some(supported => domain.includes(supported))
        } catch {
          return false
        }
      },
      'URL must be from a supported e-commerce platform'
    ),
  
  analysisDepth: z
    .enum(['basic', 'detailed', 'competitive'], {
      errorMap: () => ({ message: 'Please select analysis depth' })
    })
    .default('detailed'),
  
  targetPlatforms: z
    .array(z.enum(PLATFORMS))
    .min(1, 'At least one target platform must be selected')
    .refine(
      (platforms) => platforms.includes('universal'),
      'Universal platform is always required'
    ),
  
  enhancementFocus: z
    .enum(['content', 'competitive', 'viral'], {
      errorMap: () => ({ message: 'Please select enhancement focus' })
    })
    .default('content'),
  
  writingStyle: z
    .enum(WRITING_STYLES, {
      errorMap: () => ({ message: 'Please select a writing style' })
    }),
  
  language: z
    .enum(LANGUAGES, {
      errorMap: () => ({ message: 'Please select a language' })
    }),
  
  emojiIntensity: z
    .enum(EMOJI_INTENSITIES, {
      errorMap: () => ({ message: 'Please select emoji intensity' })
    }),
  
  includeEmojis: z.boolean().default(true),
})

export type URLInputFormData = z.infer<typeof URLInputSchema>

// ============================================================================
// USER PREFERENCES SCHEMA
// ============================================================================

export const UserPreferencesSchema = z.object({
  // Language preferences
  defaultLanguage: z
    .enum(LANGUAGES, {
      errorMap: () => ({ message: 'Please select a default language' })
    }),
  
  defaultWritingStyle: z
    .enum(WRITING_STYLES, {
      errorMap: () => ({ message: 'Please select a default writing style' })
    }),
  
  // Emoji preferences
  emojiPreference: z.boolean().default(true),
  defaultEmojiIntensity: z
    .enum(EMOJI_INTENSITIES, {
      errorMap: () => ({ message: 'Please select default emoji intensity' })
    }),
  
  // Platform preferences
  preferredPlatforms: z
    .array(z.enum(PLATFORMS))
    .min(1, 'At least one preferred platform must be selected')
    .refine(
      (platforms) => platforms.includes('universal'),
      'Universal platform must be included in preferences'
    ),
  
  // Notification preferences
  emailNotifications: z.boolean().default(true),
  usageAlerts: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  
  // Export preferences
  defaultExportFormat: z
    .enum(['txt', 'csv', 'xlsx', 'json'], {
      errorMap: () => ({ message: 'Please select a default export format' })
    })
    .default('csv'),
  
  // Privacy preferences
  dataRetention: z
    .enum(['30days', '90days', '1year', 'forever'], {
      errorMap: () => ({ message: 'Please select data retention period' })
    })
    .default('1year'),
  
  shareUsageData: z.boolean().default(false),
})

export type UserPreferencesFormData = z.infer<typeof UserPreferencesSchema>

// ============================================================================
// SUPPORT CHAT SCHEMA
// ============================================================================

export const SupportChatSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .trim(),
  
  category: z
    .enum(['technical', 'billing', 'feature', 'bug', 'general'], {
      errorMap: () => ({ message: 'Please select a category' })
    })
    .optional(),
  
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'], {
      errorMap: () => ({ message: 'Please select priority' })
    })
    .default('medium'),
  
  attachments: z
    .array(z.instanceof(File))
    .max(3, 'Maximum 3 attachments allowed')
    .optional(),
})

export type SupportChatFormData = z.infer<typeof SupportChatSchema>

// ============================================================================
// SUBSCRIPTION SCHEMA
// ============================================================================

export const SubscriptionSchema = z.object({
  plan: z
    .enum(['free', 'pro', 'business'], {
      errorMap: () => ({ message: 'Please select a subscription plan' })
    }),
  
  billingCycle: z
    .enum(['monthly', 'yearly'], {
      errorMap: () => ({ message: 'Please select billing cycle' })
    })
    .default('monthly'),
  
  // Payment information (basic validation)
  paymentMethod: z
    .enum(['card', 'paypal', 'bank'], {
      errorMap: () => ({ message: 'Please select payment method' })
    })
    .optional(),
  
  // Promotional code
  promoCode: z
    .string()
    .max(50, 'Promo code too long')
    .optional()
    .transform(val => val?.trim().toUpperCase() || undefined),
  
  // Terms acceptance
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
  
  acceptPrivacy: z
    .boolean()
    .refine(val => val === true, 'You must accept the privacy policy'),
})

export type SubscriptionFormData = z.infer<typeof SubscriptionSchema>

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

// Custom validation for platform restrictions based on user plan
export const validatePlatformSelection = (platforms: string[], userPlan: 'free' | 'pro' | 'business') => {
  if (userPlan === 'free') {
    return platforms.length === 1 && platforms[0] === 'universal'
  }
  
  if (userPlan === 'pro') {
    return platforms.length <= 5 // Universal + 4 additional
  }
  
  return true // Business has no restrictions
}

// Custom validation for usage limits
export const validateUsageLimit = (requestedUsage: number, currentUsage: number, planLimit: number) => {
  return (currentUsage + requestedUsage) <= planLimit
}

// File validation helper
export const validateFileSize = (file: File, maxSizeMB: number = 10) => {
  return file.size <= (maxSizeMB * 1024 * 1024)
}

// URL validation helper
export const validateEcommerceURL = (url: string) => {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.toLowerCase()
    
    const supportedDomains = [
      'amazon', 'shopify', 'ebay', 'etsy', 'aliexpress', 
      'walmart', 'target', 'woocommerce'
    ]
    
    return supportedDomains.some(supported => domain.includes(supported))
  } catch {
    return false
  }
}

// Export all schemas for easy import
export const FormSchemas = {
  TextInput: TextInputSchema,
  CSVUpload: CSVUploadSchema,
  URLInput: URLInputSchema,
  UserPreferences: UserPreferencesSchema,
  SupportChat: SupportChatSchema,
  Subscription: SubscriptionSchema,
} as const

// Export validation constants
export const ValidationConstants = {
  PRODUCT_CATEGORIES,
  WRITING_STYLES,
  PLATFORMS,
  LANGUAGES,
  EMOJI_INTENSITIES,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
  URL_REGEX,
} as const