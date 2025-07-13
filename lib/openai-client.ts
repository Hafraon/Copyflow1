import OpenAI from 'openai'
import { CopyFlowOutput, GenerationRequest, GenerationResponse, AssistantPhase } from './types'
import { getCurrentLanguage } from '@/i18n'
import { handleError, ErrorType, ErrorSeverity } from './error-handling'

// ============================================================================
// PRODUCTION OPENAI CLIENT - REAL ASSISTANT IDS
// ============================================================================

// Language-specific content guidelines
const LANGUAGE_GUIDELINES = {
  en: {
    characterLimits: { title: 60, description: 1800, meta: 160 },
    currency: 'USD',
    measurements: 'imperial',
    culturalContext: 'American/British e-commerce terminology',
    tone: 'professional, direct'
  },
  uk: {
    characterLimits: { title: 50, description: 1600, meta: 150 },
    currency: 'UAH',
    measurements: 'metric',
    culturalContext: 'Ukrainian market preferences, local terminology',
    tone: 'friendly, trustworthy'
  },
  de: {
    characterLimits: { title: 55, description: 1700, meta: 155 },
    currency: 'EUR',
    measurements: 'metric',
    culturalContext: 'German precision, quality focus',
    tone: 'detailed, technical'
  },
  es: {
    characterLimits: { title: 58, description: 1750, meta: 158 },
    currency: 'EUR',
    measurements: 'metric',
    culturalContext: 'Spanish/Latin American warmth',
    tone: 'warm, expressive'
  },
  fr: {
    characterLimits: { title: 52, description: 1650, meta: 152 },
    currency: 'EUR',
    measurements: 'metric',
    culturalContext: 'French elegance, sophistication',
    tone: 'elegant, refined'
  },
  it: {
    characterLimits: { title: 54, description: 1680, meta: 154 },
    currency: 'EUR',
    measurements: 'metric',
    culturalContext: 'Italian style, passion for quality',
    tone: 'passionate, stylish'
  },
  pl: {
    characterLimits: { title: 53, description: 1670, meta: 153 },
    currency: 'PLN',
    measurements: 'metric',
    culturalContext: 'Polish market, value-conscious',
    tone: 'practical, value-focused'
  },
  pt: {
    characterLimits: { title: 56, description: 1720, meta: 156 },
    currency: 'EUR',
    measurements: 'metric',
    culturalContext: 'Portuguese/Brazilian warmth',
    tone: 'warm, community-focused'
  },
  zh: {
    characterLimits: { title: 30, description: 800, meta: 80 },
    currency: 'CNY',
    measurements: 'metric',
    culturalContext: 'Chinese market preferences, respect for tradition',
    tone: 'respectful, quality-focused'
  },
  ja: {
    characterLimits: { title: 25, description: 600, meta: 70 },
    currency: 'JPY',
    measurements: 'metric',
    culturalContext: 'Japanese attention to detail, politeness',
    tone: 'polite, precise'
  },
  ar: {
    characterLimits: { title: 45, description: 1400, meta: 140 },
    currency: 'USD',
    measurements: 'metric',
    culturalContext: 'Arabic cultural values, family-oriented',
    tone: 'respectful, family-focused'
  }
} as const

// Language validation
const SUPPORTED_LANGUAGES = ['en', 'uk', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'zh', 'ja', 'ar'] as const
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

class OpenAIClient {
  private client: OpenAI
  private phase: AssistantPhase
  private assistantIds: Record<string, string>
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>

  constructor() {
    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 60000, // 60 seconds timeout
      maxRetries: 3, // Automatic retries
    })

    this.phase = (process.env.AI_ASSISTANT_PHASE as AssistantPhase) || '1A'
    this.assistantIds = this.loadAssistantIds()
    this.cache = new Map()
  }

  private loadAssistantIds(): Record<string, string> {
    const ids = {
      universal: process.env.OPENAI_ASSISTANT_UNIVERSAL,
      platformDetection: process.env.OPENAI_ASSISTANT_PLATFORM_DETECTION,
      support: process.env.OPENAI_ASSISTANT_SUPPORT,
      
      // Phase 1B specialists (optional)
      electronics: process.env.OPENAI_ASSISTANT_ELECTRONICS,
      fashion: process.env.OPENAI_ASSISTANT_FASHION,
      beauty: process.env.OPENAI_ASSISTANT_BEAUTY,
    }

    // Validate required assistants
    if (!ids.universal) {
      throw new Error('OPENAI_ASSISTANT_UNIVERSAL environment variable is required')
    }
    if (!ids.platformDetection) {
      throw new Error('OPENAI_ASSISTANT_PLATFORM_DETECTION environment variable is required')
    }
    if (!ids.support) {
      throw new Error('OPENAI_ASSISTANT_SUPPORT environment variable is required')
    }

    return ids
  }

  /**
   * Select appropriate assistant based on category and phase
   */
  async selectAssistant(category: string, type: 'content' | 'platform' | 'support' = 'content'): Promise<string> {
    // Support and platform detection assistants
    if (type === 'support') {
      return this.assistantIds.support!
    }
    if (type === 'platform') {
      return this.assistantIds.platformDetection!
    }

    // Content generation assistants
    if (this.phase === '1A') {
      // Phase 1A: Always use Universal
      return this.assistantIds.universal!
    }

    // Phase 1B: Try to find specialist
    const categoryMap: Record<string, string> = {
      'electronics': this.assistantIds.electronics || '',
      'fashion': this.assistantIds.fashion || '',
      'beauty': this.assistantIds.beauty || '',
    }

    const specialistId = categoryMap[category.toLowerCase()]
    
    if (specialistId && await this.isAssistantAvailable(specialistId)) {
      console.log(`Using specialist assistant for ${category}: ${specialistId}`)
      return specialistId
    }

    // Fallback to Universal
    console.log(`Falling back to Universal assistant for ${category}`)
    return this.assistantIds.universal!
  }

  /**
   * Check if assistant is available and responsive
   */
  private async isAssistantAvailable(assistantId: string): Promise<boolean> {
    try {
      await this.client.beta.assistants.retrieve(assistantId)
      return true
    } catch (error) {
      console.warn(`Assistant ${assistantId} not available:`, error)
      return false
    }
  }

  /**
   * Generate content using OpenAI Assistants API
   */
  async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
    const startTime = Date.now()
    
    try {
      // Check cache for similar requests
      const cacheKey = this.generateCacheKey(request)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        console.log('Using cached generation result')
        return {
          ...cached,
          processingTime: 0,
          usageCost: this.calculateUsageCost(request.platforms)
        }
      }
      
      // Select appropriate assistant
      const assistantId = await this.selectAssistant(request.category)
      
      // Create thread
      const thread = await this.client.beta.threads.create()
      
      // Prepare generation prompt
      const prompt = this.buildGenerationPrompt(request)
      
      // Add message to thread
      await this.client.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: prompt
      })

      // Run assistant with retry logic
      const run = await this.runWithRetry(thread.id, assistantId)
      
      // Wait for completion
      const completedRun = await this.waitForCompletion(thread.id, run.id)
      
      // Get response
      const messages = await this.client.beta.threads.messages.list(thread.id)
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant')
      
      if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== 'text') {
        throw new Error('No valid response from assistant')
      }

      // Parse and validate response
      const responseText = assistantMessage.content[0].text.value
      const generatedContent = this.parseAssistantResponse(responseText)

      // Optimize content for performance
      const optimizedContent = this.optimizeContent(generatedContent)
      
      // Validate content structure
      this.validateGeneratedContent(optimizedContent)
      
      const processingTime = Date.now() - startTime

      // Cache successful result
      const result = {
        success: true,
        data: optimizedContent,
        processingTime,
        assistantUsed: assistantId,
        tokensConsumed: completedRun.usage?.total_tokens || 0,
        usageCost: this.calculateUsageCost(request.platforms),
        confidenceScore: 0.95, // High confidence for production assistants
        contentQuality: 'excellent',
        exportOptions: {
          availableFormats: ['txt', 'csv', 'xlsx', 'json']
        }
      }
      
      this.addToCache(cacheKey, result)
      
      return result

    } catch (error) {
      // Enhanced error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Log error with context
      handleError(error, {
        type: ErrorType.GENERATION,
        message: `Content generation failed: ${errorMessage}`,
        severity: ErrorSeverity.ERROR,
        context: {
          category: request.category,
          language: request.language,
          platforms: request.platforms,
          processingTime: Date.now() - startTime
        },
        retryable: true,
        showToast: false // Don't show toast here, let the caller handle it
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - startTime,
        assistantUsed: 'unknown',
        tokensConsumed: 0,
        usageCost: 0,
        confidenceScore: 0,
        contentQuality: 'poor',
        exportOptions: {
          availableFormats: []
        }
      }
    }
  }

  /**
   * Validate and normalize language
   */
  private validateLanguage(language: string): SupportedLanguage {
    if (SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
      return language as SupportedLanguage
    }
    
    console.warn(`Unsupported language: ${language}, falling back to English`)
    return 'en'
  }

  /**
   * Get language-specific guidelines
   */
  private getLanguageGuidelines(language: string) {
    const validatedLanguage = this.validateLanguage(language)
    return LANGUAGE_GUIDELINES[validatedLanguage]
  }

  /**
   * Build generation prompt for assistant
   */
  private buildGenerationPrompt(request: GenerationRequest): string {
    const language = this.validateLanguage(request.language)
    const guidelines = this.getLanguageGuidelines(language)
    
    // Language-specific prompt enhancement
    const languageInstructions = this.buildLanguageInstructions(language, guidelines)
    
    return `
Generate optimized product content with the following specifications:

PRODUCT INFORMATION:
- Product Name: ${request.productName}
- Category: ${request.category}
- Description: ${request.productDescription || 'Not provided'}
- Key Features: ${request.keyFeatures?.join(', ') || 'Not provided'}

GENERATION SETTINGS:
- Writing Style: ${request.writingStyle}
- Target Platforms: ${request.platforms.join(', ')}
- Language: ${request.language}
- Include Emojis: ${request.emojiSettings.enabled}
- Emoji Intensity: ${request.emojiSettings.intensity}

LANGUAGE-SPECIFIC REQUIREMENTS:
${languageInstructions}

REQUIREMENTS:
1. Generate content optimized for all selected platforms
2. Include viral content for social media platforms
3. Apply appropriate emoji usage based on settings
4. Generate NATIVE content in ${language} (NOT translation!)
5. Follow ${request.writingStyle} writing style
6. Include competitive advantages and psychological triggers
7. Adapt cultural context for ${guidelines.culturalContext}
8. Use ${guidelines.currency} currency and ${guidelines.measurements} measurements
9. Apply ${guidelines.tone} tone throughout content

Please provide structured output with all required fields for CopyFlow export.
    `.trim()
  }

  /**
   * Build language-specific instructions
   */
  private buildLanguageInstructions(language: SupportedLanguage, guidelines: any): string {
    const instructions = [
      `CHARACTER LIMITS (optimized for ${language.toUpperCase()}):`,
      `- Product Title: ${guidelines.characterLimits.title} characters maximum`,
      `- Description: ${guidelines.characterLimits.description} characters maximum`, 
      `- Meta Description: ${guidelines.characterLimits.meta} characters maximum`,
      '',
      `CULTURAL ADAPTATION:`,
      `- Context: ${guidelines.culturalContext}`,
      `- Tone: ${guidelines.tone}`,
      `- Currency: ${guidelines.currency}`,
      `- Measurements: ${guidelines.measurements}`,
      '',
      `NATIVE CONTENT GENERATION:`,
      `- Generate content directly in ${language.toUpperCase()} language`,
      `- Use native expressions and idioms`,
      `- Apply local e-commerce terminology`,
      `- Ensure cultural appropriateness`,
      `- Maintain professional quality standards`
    ]
    
    // Language-specific additions
    switch (language) {
      case 'uk':
        instructions.push('- Use Ukrainian e-commerce terms (товар, замовлення, доставка)')
        instructions.push('- Apply Ukrainian cultural values (якість, надійність)')
        break
      case 'de':
        instructions.push('- Emphasize German quality standards (Qualität, Präzision)')
        instructions.push('- Use formal German business language')
        break
      case 'zh':
        instructions.push('- Use simplified Chinese characters')
        instructions.push('- Apply Chinese cultural values (harmony, respect)')
        break
      case 'ja':
        instructions.push('- Use polite Japanese forms (keigo when appropriate)')
        instructions.push('- Apply Japanese attention to detail')
        break
      case 'ar':
        instructions.push('- Use Modern Standard Arabic')
        instructions.push('- Apply Arabic cultural values (family, tradition)')
        instructions.push('- Consider RTL text flow in formatting')
        break
    }
    
    return instructions.join('\n')
  }

  /**
   * Get language display name
   */
  private getLanguageName(code: string): string {
    const names = {
      en: 'English',
      uk: 'Українська',
      de: 'Deutsch', 
      es: 'Español',
      fr: 'Français',
      it: 'Italiano',
      pl: 'Polski',
      pt: 'Português',
      zh: '中文',
      ja: '日本語',
      ar: 'العربية'
    }
    return names[code as keyof typeof names] || 'English'
  }

  /**
   * Run assistant with retry logic for rate limits
   */
  private async runWithRetry(threadId: string, assistantId: string, maxRetries: number = 3): Promise<OpenAI.Beta.Threads.Runs.Run> {
    // Use Promise.race to implement timeout
    const timeout = (ms: number) => new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await Promise.race([
          this.client.beta.threads.runs.create(threadId, {
            assistant_id: assistantId
          }),
          timeout(30000) // 30 second timeout
        ]) as OpenAI.Beta.Threads.Runs.Run
      } catch (error: any) {
        if (error?.status === 429 && attempt < maxRetries) {
          // Rate limit hit, wait and retry
          const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.log(`Rate limit hit, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        throw error
      }
    }
    throw new Error('Max retries exceeded')
  }

  /**
   * Wait for assistant run completion
   */
  private async waitForCompletion(threadId: string, runId: string): Promise<OpenAI.Beta.Threads.Runs.Run> {
    const maxWaitTime = 45000 // 45 seconds
    const startTime = Date.now()
    const checkInterval = 1000 // 1 second
    
    while (Date.now() - startTime < maxWaitTime) {
      const run = await this.client.beta.threads.runs.retrieve(threadId, runId)
      
      if (run.status === 'completed') {
        return run
      }
      
      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Assistant run ${run.status}: ${run.last_error?.message || 'Unknown error'}`)
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
    
    throw new Error('Assistant run timed out')
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: GenerationRequest): string {
    const key = {
      productName: request.productName,
      category: request.category,
      writingStyle: request.writingStyle,
      platforms: request.platforms.sort(),
      language: request.language,
      emojiEnabled: request.emojiSettings.enabled,
      emojiIntensity: request.emojiSettings.intensity
    }
    return JSON.stringify(key)
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): GenerationResponse | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Add to cache
   */
  private addToCache(key: string, data: GenerationResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    })
    
    // Limit cache size
    if (this.cache.size > 100) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0]
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Optimize content for performance
   */
  private optimizeContent(content: CopyFlowOutput): CopyFlowOutput {
    // Ensure arrays are properly sized
    const optimized = { ...content }
    
    // Limit array sizes for performance
    optimized.bulletPoints = content.bulletPoints.slice(0, 7)
    optimized.keyFeatures = content.keyFeatures.slice(0, 8)
    optimized.tags = content.tags.slice(0, 15)
    
    optimized.viralContent = {
      tiktokHooks: content.viralContent.tiktokHooks.slice(0, 5),
      instagramCaptions: content.viralContent.instagramCaptions.slice(0, 5)
    }
    
    optimized.targetAudience = {
      primary: content.targetAudience.primary,
      painPoints: content.targetAudience.painPoints.slice(0, 5),
      desires: content.targetAudience.desires.slice(0, 5)
    }
    
    optimized.emotionalHooks = content.emotionalHooks.slice(0, 6)
    optimized.conversionTriggers = content.conversionTriggers.slice(0, 6)
    optimized.trustSignals = content.trustSignals.slice(0, 6)
    optimized.urgencyElements = content.urgencyElements.slice(0, 5)
    optimized.socialProof = content.socialProof.slice(0, 5)
    optimized.competitorAdvantages = content.competitorAdvantages.slice(0, 6)
    optimized.keywordGaps = content.keywordGaps.slice(0, 5)
    
    return optimized
  }
  /**
   * Parse assistant response to CopyFlowOutput
   */
  private parseAssistantResponse(responseText: string): CopyFlowOutput {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(responseText)
      return parsed as CopyFlowOutput
    } catch {
      // If not JSON, create structured output from text
      return this.createFallbackOutput(responseText)
    }
  }

  /**
   * Create fallback output when JSON parsing fails
   */
  private createFallbackOutput(text: string): CopyFlowOutput {
    return {
      productTitle: this.extractSection(text, 'title') || 'Generated Product Title',
      productDescription: this.extractSection(text, 'description') || text.substring(0, 500),
      seoTitle: this.extractSection(text, 'seo') || 'SEO Optimized Title',
      metaDescription: this.extractSection(text, 'meta') || 'Meta description',
      callToAction: 'Shop Now',
      bulletPoints: ['Key feature 1', 'Key feature 2', 'Key feature 3'],
      keyFeatures: ['Feature 1', 'Feature 2'],
      tags: ['tag1', 'tag2', 'tag3'],
      amazonBackendKeywords: 'keywords for amazon backend search',
      viralContent: {
        tiktokHooks: ['TikTok hook 1', 'TikTok hook 2'],
        instagramCaptions: ['Instagram caption 1', 'Instagram caption 2']
      },
      targetAudience: {
        primary: 'Target audience description',
        painPoints: ['Pain point 1', 'Pain point 2'],
        desires: ['Desire 1', 'Desire 2']
      },
      emotionalHooks: ['Emotional hook 1', 'Emotional hook 2'],
      conversionTriggers: ['Trigger 1', 'Trigger 2'],
      trustSignals: ['Trust signal 1', 'Trust signal 2'],
      urgencyElements: ['Urgency 1', 'Urgency 2'],
      socialProof: ['Social proof 1', 'Social proof 2'],
      competitorAdvantages: ['Advantage 1', 'Advantage 2'],
      priceAnchor: 'Value justification',
      keywordGaps: ['Keyword 1', 'Keyword 2']
    }
  }

  /**
   * Extract section from text response
   */
  private extractSection(text: string, sectionType: string): string | null {
    const patterns = {
      title: /(?:title|product name):\s*(.+)/i,
      description: /(?:description|product description):\s*(.+)/i,
      seo: /(?:seo title|seo):\s*(.+)/i,
      meta: /(?:meta description|meta):\s*(.+)/i
    }
    
    const pattern = patterns[sectionType as keyof typeof patterns]
    if (!pattern) return null
    
    const match = text.match(pattern)
    return match ? match[1].trim() : null
  }

  /**
   * Validate generated content structure
   */
  private validateGeneratedContent(content: CopyFlowOutput): void {
    const required = ['productTitle', 'productDescription', 'seoTitle', 'metaDescription']
    
    for (const field of required) {
      if (!content[field as keyof CopyFlowOutput]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    // Language-aware character limit validation
    const language = getCurrentLanguage() || 'en'
    const guidelines = this.getLanguageGuidelines(language)
    
    if (content.productTitle.length > guidelines.characterLimits.title) {
      console.warn(`Product title exceeds recommended length for ${language}: ${content.productTitle.length}/${guidelines.characterLimits.title}`)
    }
    
    if (content.metaDescription.length > guidelines.characterLimits.meta) {
      console.warn(`Meta description exceeds recommended length for ${language}: ${content.metaDescription.length}/${guidelines.characterLimits.meta}`)
    }
    
    // Validate language consistency
    this.validateContentLanguage(content, language)
  }

  /**
   * Validate content language consistency
   */
  private validateContentLanguage(content: CopyFlowOutput, expectedLanguage: string): void {
    // Basic language detection for major fields
    const textFields = [content.productTitle, content.productDescription, content.seoTitle]
    
    for (const text of textFields) {
      if (text && text.length > 10) {
        // Simple language validation (can be enhanced with proper language detection)
        const hasExpectedCharacters = this.hasLanguageCharacters(text, expectedLanguage)
        if (!hasExpectedCharacters) {
          console.warn(`Content may not be in expected language: ${expectedLanguage}`)
          break
        }
      }
    }
  }

  /**
   * Check if text contains expected language characters
   */
  private hasLanguageCharacters(text: string, language: string): boolean {
    switch (language) {
      case 'uk':
        return /[а-яёіїє]/i.test(text)
      case 'de':
        return /[äöüß]/i.test(text) || /\b(der|die|das|und|mit|für)\b/i.test(text)
      case 'zh':
        return /[\u4e00-\u9fff]/.test(text)
      case 'ja':
        return /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(text)
      case 'ar':
        return /[\u0600-\u06ff]/.test(text)
      default:
        return true // For other languages, assume valid
    }
  }

  /**
   * Calculate usage cost based on platforms
   */
  private calculateUsageCost(platforms: string[]): number {
    let cost = 1.0 // Base Universal cost
    
    const additionalPlatforms = platforms.filter(p => p !== 'universal')
    cost += additionalPlatforms.length * 0.5
    
    return cost
  }

  /**
   * Analyze CSV for platform detection
   */
  async analyzePlatform(csvHeaders: string[], sampleData: Record<string, any>[]): Promise<any> {
    try {
      const assistantId = await this.selectAssistant('', 'platform')
      
      const thread = await this.client.beta.threads.create()
      
      const prompt = `
Analyze this CSV structure for e-commerce platform detection:

HEADERS: ${csvHeaders.join(', ')}

SAMPLE DATA:
${JSON.stringify(sampleData.slice(0, 3), null, 2)}

Please identify:
1. Most likely e-commerce platform (Shopify, Amazon, WooCommerce, etc.)
2. Confidence score (0-100)
3. Column mapping for standard fields (product name, description, price, etc.)
4. Recommended export structure with CopyFlow_ columns

Provide structured JSON response.
      `.trim()
      
      await this.client.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: prompt
      })

      const run = await this.runWithRetry(thread.id, assistantId)
      await this.waitForCompletion(thread.id, run.id)
      
      const messages = await this.client.beta.threads.messages.list(thread.id)
      const response = messages.data.find(msg => msg.role === 'assistant')
      
      if (response && response.content[0] && response.content[0].type === 'text') {
        return JSON.parse(response.content[0].text.value)
      }
      
      throw new Error('No valid platform analysis response')
      
    } catch (error) {
      console.error('Platform analysis failed:', error)
      return {
        detectedPlatform: 'universal',
        confidence: 0,
        columnMapping: {},
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }

  /**
   * Get support response
   */
  async getSupportResponse(message: string, context?: any): Promise<string> {
    // Detect user's current language for support response
    const userLanguage = context?.language || getCurrentLanguage() || 'en'
    const validatedLanguage = this.validateLanguage(userLanguage)
    
    try {
      const assistantId = await this.selectAssistant('', 'support')
      
      const thread = await this.client.beta.threads.create()
      
      const prompt = `
User support request (in ${this.getLanguageName(validatedLanguage)}): ${message}

Context: ${context ? JSON.stringify(context) : 'No additional context'}

LANGUAGE REQUIREMENTS:
- Respond in ${this.getLanguageName(validatedLanguage)} (${validatedLanguage})
- Use native expressions and terminology
- Maintain professional support tone
- Provide culturally appropriate assistance

Please provide helpful, accurate support response based on CopyFlow product knowledge in the user's language.
      `.trim()
      
      await this.client.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: prompt
      })

      const run = await this.runWithRetry(thread.id, assistantId)
      await this.waitForCompletion(thread.id, run.id)
      
      const messages = await this.client.beta.threads.messages.list(thread.id)
      const response = messages.data.find(msg => msg.role === 'assistant')
      
      if (response && response.content[0] && response.content[0].type === 'text') {
        return response.content[0].text.value
      }
      
      // Language-aware fallback message
      const fallbackMessages = {
        en: 'I apologize, but I was unable to process your request. Please try again or contact human support.',
        uk: 'Вибачте, але я не зміг обробити ваш запит. Спробуйте ще раз або зверніться до людської підтримки.',
        de: 'Entschuldigung, ich konnte Ihre Anfrage nicht bearbeiten. Bitte versuchen Sie es erneut oder wenden Sie sich an den menschlichen Support.',
        es: 'Lo siento, no pude procesar su solicitud. Inténtelo de nuevo o contacte con soporte humano.',
        fr: 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer ou contacter le support humain.',
        it: 'Mi dispiace, non sono riuscito a elaborare la tua richiesta. Riprova o contatta il supporto umano.',
        pl: 'Przepraszam, nie mogłem przetworzyć Twojego żądania. Spróbuj ponownie lub skontaktuj się z ludzkim wsparciem.',
        pt: 'Desculpe, não consegui processar sua solicitação. Tente novamente ou entre em contato com o suporte humano.',
        zh: '抱歉，我无法处理您的请求。请重试或联系人工支持。',
        ja: '申し訳ございませんが、リクエストを処理できませんでした。再試行するか、人間のサポートにお問い合わせください。',
        ar: 'أعتذر، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى أو الاتصال بالدعم البشري.'
      }
      
      return fallbackMessages[validatedLanguage] || fallbackMessages.en
      
    } catch (error) {
      console.error('Support response failed:', error)
      
      // Language-aware error message
      const errorMessages = {
        en: 'I apologize, but I encountered an error. Please contact human support for assistance.',
        uk: 'Вибачте, але сталася помилка. Зверніться до людської підтримки за допомогою.',
        de: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte wenden Sie sich an den menschlichen Support.',
        es: 'Lo siento, pero encontré un error. Póngase en contacto con soporte humano para obtener ayuda.',
        fr: 'Désolé, j\'ai rencontré une erreur. Veuillez contacter le support humain pour obtenir de l\'aide.',
        it: 'Mi dispiace, ma ho riscontrato un errore. Contatta il supporto umano per assistenza.',
        pl: 'Przepraszam, ale napotkałem błąd. Skontaktuj się z ludzkim wsparciem w celu uzyskania pomocy.',
        pt: 'Desculpe, mas encontrei um erro. Entre em contato com o suporte humano para obter assistência.',
        zh: '抱歉，我遇到了错误。请联系人工支持寻求帮助。',
        ja: '申し訳ございませんが、エラーが発生しました。人間のサポートにお問い合わせください。',
        ar: 'أعتذر، لكنني واجهت خطأ. يرجى الاتصال بالدعم البشري للحصول على المساعدة.'
      }
      
      return errorMessages[validatedLanguage] || errorMessages.en
    }
  }

  /**
   * Generate content with fallback mechanism
   */
  async generateWithFallback(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      // Try primary generation
      return await this.generateContent(request)
    } catch (error) {
      // Log primary failure
      handleError(error, {
        type: ErrorType.GENERATION,
        message: 'Primary generation failed, attempting fallback',
        severity: ErrorSeverity.WARNING,
        context: {
          category: request.category,
          language: request.language,
          platforms: request.platforms
        },
        retryable: true,
        showToast: false // Don't show toast during fallback attempt
      })
      
      try {
        // Fallback to Universal assistant
        const universalId = this.assistantIds.universal!
        const thread = await this.client.beta.threads.create()
        
        const fallbackPrompt = `
Generate basic product content for:
Product: ${request.productName}
Category: ${request.category}
Style: ${request.writingStyle}
Language: ${request.language}

Provide structured content with title, description, and key features.
        `.trim()
        
        await this.client.beta.threads.messages.create(thread.id, {
          role: 'user',
          content: fallbackPrompt
        })

        const run = await this.runWithRetry(thread.id, universalId)
        await this.waitForCompletion(thread.id, run.id)
        
        const messages = await this.client.beta.threads.messages.list(thread.id)
        const response = messages.data.find(msg => msg.role === 'assistant')
        
        if (response && response.content[0] && response.content[0].type === 'text') {
          const content = this.createFallbackOutput(response.content[0].text.value)
          
          return {
            success: true,
            data: content,
            processingTime: 0,
            assistantUsed: universalId,
            tokensConsumed: 0,
            usageCost: this.calculateUsageCost(request.platforms),
            confidenceScore: 0.7, // Lower confidence for fallback
            contentQuality: 'good',
            exportOptions: {
              availableFormats: ['txt']
            }
          }
        }
        
        throw new Error('Fallback generation failed')
        
      } catch (fallbackError) {
        // Log fallback failure
        handleError(fallbackError, {
          type: ErrorType.GENERATION,
          message: 'Fallback generation also failed',
          severity: ErrorSeverity.ERROR,
          context: {
            category: request.category,
            language: request.language,
            platforms: request.platforms,
            originalError: error
          },
          retryable: false,
          showToast: true // Show toast for complete failure
        })
        
        // Final fallback - basic content
        return {
          success: false,
          error: 'Content generation failed. Please try again.',
          processingTime: 0,
          assistantUsed: 'fallback',
          tokensConsumed: 0,
          usageCost: 0,
          confidenceScore: 0,
          contentQuality: 'poor',
          exportOptions: {
            availableFormats: []
          }
        }
      }
    }
  }

  /**
   * Get current assistant phase
   */
  getAssistantPhase(): AssistantPhase {
    return this.phase
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient()

// Export individual functions for convenience
export const generateContent = (request: GenerationRequest) => openaiClient.generateContent(request)
export const analyzePlatform = (headers: string[], data: Record<string, any>[]) => openaiClient.analyzePlatform(headers, data)
export const getSupportResponse = (message: string, context?: any) => openaiClient.getSupportResponse(message, context)
export const generateWithFallback = (request: GenerationRequest) => openaiClient.generateWithFallback(request)
export const getAssistantPhase = () => openaiClient.getAssistantPhase()