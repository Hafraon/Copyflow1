import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// TypeScript Interfaces
export interface Category {
  id: string
  name: string
  description?: string
}

export interface WritingStyle {
  id: string
  name: string
  description: string
}

export interface Platform {
  id: string
  name: string
  cost: number
  included?: boolean
  description?: string
}

export interface Language {
  code: string
  name: string
  flag: string
  nativeName: string
}

export interface EmojiIntensity {
  id: string
  name: string
  count: string
  example: string
  description: string
}

export interface GenerationSettings {
  category: string
  writingStyle: string
  platforms: string[]
  language: string
  emojiIntensity: string
  includeEmojis: boolean
}

export interface UsageCalculation {
  baseGenerations: number
  platformAddOns: number
  totalUsed: number
  breakdown: {
    universal: number
    additionalPlatforms: { platform: string; cost: number }[]
  }
}

// 17 Product Categories
export const CATEGORIES: Category[] = [
  { id: 'electronics', name: 'Electronics', description: 'Gadgets, devices, tech accessories' },
  { id: 'fashion', name: 'Fashion', description: 'Clothing, accessories, footwear' },
  { id: 'beauty', name: 'Beauty', description: 'Cosmetics, skincare, personal care' },
  { id: 'home', name: 'Home', description: 'Furniture, decor, household items' },
  { id: 'sports', name: 'Sports', description: 'Fitness equipment, sportswear, outdoor gear' },
  { id: 'health', name: 'Health', description: 'Supplements, medical devices, wellness' },
  { id: 'automotive', name: 'Automotive', description: 'Car parts, accessories, tools' },
  { id: 'food', name: 'Food', description: 'Groceries, beverages, specialty foods' },
  { id: 'travel', name: 'Travel', description: 'Luggage, travel accessories, gear' },
  { id: 'toys', name: 'Toys', description: 'Children toys, games, educational items' },
  { id: 'jewelry', name: 'Jewelry', description: 'Rings, necklaces, watches, accessories' },
  { id: 'books', name: 'Books', description: 'Literature, educational, digital media' },
  { id: 'pets', name: 'Pets', description: 'Pet supplies, food, toys, accessories' },
  { id: 'business', name: 'Business', description: 'Office supplies, equipment, services' },
  { id: 'art', name: 'Art', description: 'Artwork, crafts, creative supplies' },
  { id: 'music', name: 'Music', description: 'Instruments, audio equipment, accessories' },
  { id: 'universal', name: 'Universal', description: 'General products, mixed categories' }
]

// Writing Styles with detailed descriptions
export const WRITING_STYLES: WritingStyle[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Formal, technical, business-focused'
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Friendly, conversational, approachable'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Premium, exclusive, sophisticated'
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Detailed specs, expert terminology'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Unique, artistic, attention-grabbing'
  }
]

// Platforms with usage costs (ключова бізнес-логіка)
export const PLATFORMS: Platform[] = [
  {
    id: 'universal',
    name: 'Universal (завжди включений)',
    cost: 0,
    included: true,
    description: 'Base content suitable for any platform'
  },
  {
    id: 'amazon',
    name: 'Amazon (+0.5 from limit)',
    cost: 0.5,
    description: 'Amazon-optimized with backend keywords, bullet points'
  },
  {
    id: 'shopify',
    name: 'Shopify (+0.5 from limit)',
    cost: 0.5,
    description: 'Shopify-optimized with SEO handles, structured data'
  },
  {
    id: 'instagram',
    name: 'Instagram (+0.5 from limit)',
    cost: 0.5,
    description: 'Instagram-optimized captions and hashtags'
  },
  {
    id: 'tiktok',
    name: 'TikTok (+0.5 from limit)',
    cost: 0.5,
    description: 'TikTok-optimized hooks and viral content'
  },
  {
    id: 'facebook',
    name: 'Facebook Ads (+0.5 from limit)',
    cost: 0.5,
    description: 'Facebook Ads optimized copy and targeting'
  },
  {
    id: 'ebay',
    name: 'eBay (+0.5 from limit)',
    cost: 0.5,
    description: 'eBay auction-style compelling descriptions'
  },
  {
    id: 'etsy',
    name: 'Etsy (+0.5 from limit)',
    cost: 0.5,
    description: 'Etsy artisan-focused, handmade appeal'
  }
]

// 11 Languages with flags and native names
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦', nativeName: 'Українська' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' }
]

// Emoji Intensities with examples
export const EMOJI_INTENSITIES: EmojiIntensity[] = [
  {
    id: 'low',
    name: 'Low',
    count: '3-5',
    example: '✅ Quality 🚚 Fast',
    description: 'Minimal emojis for professional look'
  },
  {
    id: 'medium',
    name: 'Medium',
    count: '8-12',
    example: '✅ Quality 🔥 Price 🚚 Delivery ⚡ Fast 💯 Guaranteed',
    description: 'Balanced emoji usage for engagement'
  },
  {
    id: 'high',
    name: 'High',
    count: '15-20',
    example: '✅🔥⚡💯🎯🚀💎✨🌟⭐🏆🎁🔋📱💝',
    description: 'Maximum emojis for viral social media content'
  }
]

// Usage Calculation Helper Functions
export function calculateUsage(selectedPlatforms: string[]): UsageCalculation {
  const baseGenerations = 1 // Universal is always included
  const additionalPlatforms = selectedPlatforms
    .filter(platformId => platformId !== 'universal')
    .map(platformId => {
      const platform = PLATFORMS.find(p => p.id === platformId)
      return {
        platform: platform?.name || platformId,
        cost: platform?.cost || 0.5
      }
    })
  
  const platformAddOns = additionalPlatforms.reduce((sum, p) => sum + p.cost, 0)
  const totalUsed = baseGenerations + platformAddOns

  return {
    baseGenerations,
    platformAddOns,
    totalUsed,
    breakdown: {
      universal: baseGenerations,
      additionalPlatforms
    }
  }
}

// Platform Helper Functions
export function getPlatformById(id: string): Platform | undefined {
  return PLATFORMS.find(platform => platform.id === id)
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(category => category.id === id)
}

export function getWritingStyleById(id: string): WritingStyle | undefined {
  return WRITING_STYLES.find(style => style.id === id)
}

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find(language => language.code === code)
}

export function getEmojiIntensityById(id: string): EmojiIntensity | undefined {
  return EMOJI_INTENSITIES.find(intensity => intensity.id === id)
}

// Validation Helpers
export function isValidCategory(categoryId: string): boolean {
  return CATEGORIES.some(category => category.id === categoryId)
}

export function isValidWritingStyle(styleId: string): boolean {
  return WRITING_STYLES.some(style => style.id === styleId)
}

export function isValidPlatform(platformId: string): boolean {
  return PLATFORMS.some(platform => platform.id === platformId)
}

export function isValidLanguage(languageCode: string): boolean {
  return LANGUAGES.some(language => language.code === languageCode)
}

// Default Values
export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  category: 'universal',
  writingStyle: 'professional',
  platforms: ['universal'],
  language: 'en',
  emojiIntensity: 'medium',
  includeEmojis: true
}

// Export Format Constants
export const EXPORT_FORMATS = {
  TXT: 'txt',
  CSV: 'csv',
  XLSX: 'xlsx',
  JSON: 'json'
} as const

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS]

// CopyFlow Column Prefixes (для Export=Import workflow)
export const COPYFLOW_COLUMN_PREFIXES = {
  CORE: [
    'CopyFlow_Product_Title',
    'CopyFlow_Description',
    'CopyFlow_SEO_Title',
    'CopyFlow_Meta_Description',
    'CopyFlow_Call_To_Action'
  ],
  MARKETING: [
    'CopyFlow_Bullet_Point_1',
    'CopyFlow_Bullet_Point_2',
    'CopyFlow_Bullet_Point_3',
    'CopyFlow_Key_Features',
    'CopyFlow_Tags'
  ],
  VIRAL: [
    'CopyFlow_TikTok_Hook_1',
    'CopyFlow_TikTok_Hook_2',
    'CopyFlow_Instagram_Caption_1',
    'CopyFlow_Instagram_Caption_2'
  ],
  COMPETITIVE: [
    'CopyFlow_Competitor_Advantage_1',
    'CopyFlow_Price_Anchor',
    'CopyFlow_Emotional_Hook_1',
    'CopyFlow_Trust_Signal_1'
  ],
  PLATFORM_SPECIFIC: {
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
    ]
  }
} as const

// Supported Platforms for Detection (CSV/URL Intelligence)
export const SUPPORTED_DETECTION_PLATFORMS = [
  'Shopify',
  'Amazon',
  'WooCommerce',
  'eBay',
  'Etsy',
  'Magento',
  'PrestaShop',
  'BigCommerce',
  'OpenCart',
  'Хорошоп'
] as const

export type SupportedPlatform = typeof SUPPORTED_DETECTION_PLATFORMS[number]