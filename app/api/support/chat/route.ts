import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupportResponse } from '@/lib/openai-client'

// ============================================================================
// SUPPORT CHAT API - REAL AI ASSISTANT INTEGRATION
// ============================================================================

// Request validation schema
const SupportChatRequestSchema = z.object({
  // Message content
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  
  // User context
  userId: z.string().optional(),
  userPlan: z.enum(['free', 'pro', 'business']).optional().default('free'),
  sessionId: z.string().optional(),
  
  // Context information
  currentPage: z.string().optional(),
  language: z.enum(['en', 'uk', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'zh', 'ja', 'ar']).optional().default('en'),
  
  // User state context
  userContext: z.object({
    currentUsage: z.number().optional(),
    planLimit: z.number().optional(),
    recentErrors: z.array(z.string()).optional(),
    lastGeneration: z.string().optional(),
    platformsUsed: z.array(z.string()).optional()
  }).optional(),
  
  // Message metadata
  messageType: z.enum(['text', 'quick_reply', 'escalation_request']).default('text'),
  category: z.enum(['technical', 'billing', 'feature', 'bug', 'general']).optional()
})

type SupportChatRequest = z.infer<typeof SupportChatRequestSchema>

// Response interface
interface SupportChatResponse {
  success: boolean
  response: string
  quickReplies?: string[]
  shouldEscalate: boolean
  escalationReason?: string
  helpfulLinks?: Array<{
    title: string
    url: string
    description: string
  }>
  sessionId: string
  responseTime: number
  language: string
  category?: string
  satisfactionPrompt?: boolean
}

// Session storage (in production, use Redis)
const chatSessions = new Map<string, {
  userId?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
  context: any
  createdAt: Date
  lastActivity: Date
}>()

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting check
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const limit = 20 // 20 messages per minute

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
 * Generate session ID
 */
function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Build context for Support Assistant
 */
function buildSupportContext(request: SupportChatRequest, sessionId: string): any {
  const session = chatSessions.get(sessionId)
  
  return {
    // User information
    userId: request.userId,
    userPlan: request.userPlan,
    language: request.language,
    currentPage: request.currentPage,
    
    // User state
    currentUsage: request.userContext?.currentUsage,
    planLimit: request.userContext?.planLimit,
    recentErrors: request.userContext?.recentErrors,
    lastGeneration: request.userContext?.lastGeneration,
    platformsUsed: request.userContext?.platformsUsed,
    
    // Session context
    messageHistory: session?.messages.slice(-5) || [], // Last 5 messages
    sessionDuration: session ? Date.now() - session.createdAt.getTime() : 0,
    
    // Message context
    messageType: request.messageType,
    category: request.category,
    
    // Knowledge base topics
    knowledgeBase: {
      magicInput: "Magic Input supports 3 methods: Text (single product), CSV (bulk), URL (competitor analysis)",
      platformDetection: "95%+ accuracy for Shopify, Amazon, WooCommerce, eBay, Etsy detection",
      usageCalculation: "1 base generation + 0.5 per additional platform",
      exportFormats: "TXT format available now, CSV/Excel coming in Phase 1B",
      planLimits: {
        free: "5 generations, Universal platform only",
        pro: "500 generations, Universal + 4 platforms",
        business: "2000 generations, unlimited platforms"
      },
      languages: "11 languages supported: EN, UK, DE, ES, FR, IT, PL, PT, ZH, JA, AR",
      troubleshooting: {
        csvUpload: "Check file format (CSV/Excel), size limits, column headers",
        platformDetection: "Ensure proper column names, sample data included",
        generationFailed: "Check usage limits, platform restrictions, content length"
      }
    }
  }
}

/**
 * Determine if escalation is needed
 */
function shouldEscalateToHuman(message: string, context: any): { shouldEscalate: boolean; reason?: string } {
  const escalationTriggers = [
    'human', 'agent', 'person', 'speak to someone',
    'billing issue', 'refund', 'cancel subscription',
    'bug report', 'not working', 'broken',
    'complaint', 'frustrated', 'angry'
  ]
  
  const lowerMessage = message.toLowerCase()
  
  // Check for escalation keywords
  for (const trigger of escalationTriggers) {
    if (lowerMessage.includes(trigger)) {
      return {
        shouldEscalate: true,
        reason: `User requested human assistance: "${trigger}"`
      }
    }
  }
  
  // Check for repeated similar messages
  const recentMessages = context.messageHistory?.slice(-3) || []
  const similarMessages = recentMessages.filter((msg: any) => 
    msg.role === 'user' && 
    msg.content.toLowerCase().includes(lowerMessage.split(' ')[0])
  )
  
  if (similarMessages.length >= 2) {
    return {
      shouldEscalate: true,
      reason: "User repeated similar questions - may need human assistance"
    }
  }
  
  // Check session duration (>10 minutes)
  if (context.sessionDuration > 10 * 60 * 1000) {
    return {
      shouldEscalate: true,
      reason: "Long session duration - complex issue may need human help"
    }
  }
  
  return { shouldEscalate: false }
}

/**
 * Generate helpful links based on message content
 */
function generateHelpfulLinks(message: string, category?: string): Array<{ title: string; url: string; description: string }> {
  const links: Array<{ title: string; url: string; description: string }> = []
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('csv') || lowerMessage.includes('upload')) {
    links.push({
      title: "CSV Upload Guide",
      url: "/docs/csv-upload",
      description: "Step-by-step guide for CSV file upload and processing"
    })
  }
  
  if (lowerMessage.includes('platform') || lowerMessage.includes('detect')) {
    links.push({
      title: "Platform Detection",
      url: "/docs/platform-detection", 
      description: "How our AI detects your e-commerce platform"
    })
  }
  
  if (lowerMessage.includes('usage') || lowerMessage.includes('limit')) {
    links.push({
      title: "Usage Calculator",
      url: "/dashboard/usage",
      description: "Check your current usage and plan limits"
    })
  }
  
  if (lowerMessage.includes('export') || lowerMessage.includes('download')) {
    links.push({
      title: "Export Formats",
      url: "/docs/export-formats",
      description: "Available export formats and how to use them"
    })
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('plan') || lowerMessage.includes('upgrade')) {
    links.push({
      title: "Pricing Plans",
      url: "/pricing",
      description: "Compare plans and upgrade options"
    })
  }
  
  return links.slice(0, 3) // Max 3 links
}

/**
 * Generate quick replies based on context
 */
function generateQuickReplies(message: string, userPlan: string): string[] {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('csv')) {
    return [
      "File size limits",
      "Supported formats", 
      "Platform detection help",
      "Column mapping issues"
    ]
  }
  
  if (lowerMessage.includes('usage') || lowerMessage.includes('limit')) {
    return [
      "Check current usage",
      "How usage calculated",
      "Upgrade plan",
      "Reset date"
    ]
  }
  
  if (lowerMessage.includes('platform')) {
    return [
      "Shopify detection",
      "Amazon detection", 
      "Manual platform selection",
      "Detection accuracy"
    ]
  }
  
  if (lowerMessage.includes('export')) {
    return [
      "TXT format help",
      "When CSV available",
      "Download issues",
      "File formats"
    ]
  }
  
  // Default quick replies
  return [
    "Upload help",
    "Usage questions",
    "Platform issues", 
    "Talk to human"
  ]
}

/**
 * Update chat session
 */
function updateChatSession(sessionId: string, request: SupportChatRequest, response: string): void {
  const session = chatSessions.get(sessionId) || {
    userId: request.userId,
    messages: [],
    context: {},
    createdAt: new Date(),
    lastActivity: new Date()
  }
  
  // Add user message
  session.messages.push({
    role: 'user',
    content: request.message,
    timestamp: new Date()
  })
  
  // Add assistant response
  session.messages.push({
    role: 'assistant', 
    content: response,
    timestamp: new Date()
  })
  
  // Update context
  session.context = { ...session.context, ...request.userContext }
  session.lastActivity = new Date()
  
  // Keep only last 20 messages
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20)
  }
  
  chatSessions.set(sessionId, session)
}

/**
 * POST /api/support/chat
 */
export async function POST(request: NextRequest): Promise<NextResponse<SupportChatResponse>> {
  const startTime = Date.now()
  
  try {
    // Parse and validate request
    const body = await request.json()
    const validationResult = SupportChatRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        response: "I'm sorry, but I couldn't understand your message. Could you please try again?",
        shouldEscalate: false,
        sessionId: generateSessionId(),
        responseTime: Date.now() - startTime,
        language: 'en'
      }, { status: 400 })
    }
    
    const requestData = validationResult.data
    
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitKey = requestData.userId || clientIP
    
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({
        success: false,
        response: "You're sending messages too quickly. Please wait a moment before trying again.",
        shouldEscalate: false,
        sessionId: requestData.sessionId || generateSessionId(),
        responseTime: Date.now() - startTime,
        language: requestData.language
      }, { status: 429 })
    }
    
    // Get or create session
    const sessionId = requestData.sessionId || generateSessionId()
    
    // Build context for Support Assistant
    const context = buildSupportContext(requestData, sessionId)
    
    // Check for escalation triggers
    const escalationCheck = shouldEscalateToHuman(requestData.message, context)
    
    // Get AI response from Support Assistant
    let aiResponse: string
    try {
      aiResponse = await getSupportResponse(requestData.message, context)
    } catch (error) {
      console.error('Support Assistant error:', error)
      aiResponse = "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact human support if the issue persists."
    }
    
    // Generate helpful links and quick replies
    const helpfulLinks = generateHelpfulLinks(requestData.message, requestData.category)
    const quickReplies = generateQuickReplies(requestData.message, requestData.userPlan)
    
    // Update session
    updateChatSession(sessionId, requestData, aiResponse)
    
    // Determine if satisfaction prompt should be shown
    const shouldShowSatisfaction = Math.random() < 0.1 // 10% chance
    
    // Prepare response
    const response: SupportChatResponse = {
      success: true,
      response: aiResponse,
      quickReplies: quickReplies.slice(0, 4), // Max 4 quick replies
      shouldEscalate: escalationCheck.shouldEscalate,
      escalationReason: escalationCheck.reason,
      helpfulLinks: helpfulLinks.length > 0 ? helpfulLinks : undefined,
      sessionId,
      responseTime: Date.now() - startTime,
      language: requestData.language,
      category: requestData.category,
      satisfactionPrompt: shouldShowSatisfaction
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${response.responseTime}ms`
      }
    })
    
  } catch (error) {
    console.error('Support chat API error:', error)
    
    return NextResponse.json({
      success: false,
      response: "I apologize, but I encountered an unexpected error. Please try again or contact human support.",
      shouldEscalate: true,
      escalationReason: "System error occurred",
      sessionId: generateSessionId(),
      responseTime: Date.now() - startTime,
      language: 'en'
    }, { status: 500 })
  }
}

/**
 * GET /api/support/chat - Health check and session info
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (sessionId) {
      // Get session info
      const session = chatSessions.get(sessionId)
      
      if (session) {
        return NextResponse.json({
          success: true,
          sessionId,
          messageCount: session.messages.length,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          userId: session.userId
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Session not found'
        }, { status: 404 })
      }
    }
    
    // Health check
    return NextResponse.json({
      success: true,
      service: 'support-chat',
      status: 'healthy',
      activeSessions: chatSessions.size,
      supportedLanguages: ['en', 'uk', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'zh', 'ja', 'ar'],
      features: {
        realTimeChat: true,
        multiLanguage: true,
        contextAware: true,
        escalation: true,
        sessionTracking: true,
        knowledgeBase: true
      },
      version: '1.0.0'
    })
    
  } catch (error) {
    console.error('Support chat info API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}