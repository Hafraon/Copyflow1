import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  X, 
  Send, 
  Paperclip, 
  Star, 
  User, 
  Bot, 
  Clock,
  Wifi,
  WifiOff,
  ChevronDown,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  attachments?: File[]
  quickReplies?: string[]
}

interface SupportChatProps {
  userId?: string
  userPlan?: 'free' | 'pro' | 'business'
  currentPage?: string
  className?: string
}

export const SupportChat: React.FC<SupportChatProps> = ({
  userId,
  userPlan = 'free',
  currentPage,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [escalated, setEscalated] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Quick reply options
  const quickReplies = [
    "How do I upload CSV?",
    "What's my usage limit?", 
    "Platform not detected correctly",
    "Export formats help",
    "Pricing information",
    "Account settings"
  ]

  // Initialize chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat()
    }
  }, [isOpen])

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize chat session
  const initializeChat = async () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `👋 Hi! I'm your CopyFlow AI assistant. I'm here 24/7 to help you with:

• CSV upload and processing
• Platform detection issues  
• Usage limits and billing
• Export formats and features
• Technical troubleshooting

How can I help you today?`,
      timestamp: new Date(),
      quickReplies: quickReplies.slice(0, 4)
    }

    setMessages([welcomeMessage])
    
    // Generate session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
  }

  // Send message
  const sendMessage = async (content: string, isQuickReply: boolean = false) => {
    if (!content.trim() && attachments.length === 0) return

    setIsSending(true)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setAttachments([])

    // Show typing indicator
    setIsTyping(true)

    try {
      // Simulate AI response delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Generate AI response based on content
      const aiResponse = await generateAIResponse(content, {
        userId,
        userPlan,
        currentPage,
        sessionId,
        isQuickReply
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        quickReplies: aiResponse.quickReplies
      }

      setMessages(prev => [...prev, aiMessage])

      // Check if escalation is needed
      if (aiResponse.shouldEscalate) {
        setEscalated(true)
        setTimeout(() => {
          const escalationMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: 'system',
            content: '🔄 Connecting you with a human support agent...',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, escalationMessage])
        }, 1000)
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: isOnline 
          ? '❌ Sorry, I encountered an error. Please try again or contact human support.'
          : '📧 You\'re offline. Your message will be sent via email when connection is restored.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setIsSending(false)
    }
  }

  // Generate AI response
  const generateAIResponse = async (userMessage: string, context: any) => {
    const lowerMessage = userMessage.toLowerCase()

    // CSV upload help
    if (lowerMessage.includes('csv') || lowerMessage.includes('upload')) {
      return {
        content: `📊 **CSV Upload Help:**

1. **Supported formats:** CSV, Excel (.xlsx), TXT
2. **File size limits:** 
   • Free: 10MB
   • Pro: 50MB  
   • Business: 200MB

3. **Upload process:**
   • Drag & drop or click to browse
   • We'll auto-detect your platform (Shopify, Amazon, etc.)
   • Select products to process
   • Choose global settings

4. **Platform detection:** We analyze your headers to optimize content for your specific platform.

Need help with a specific platform or error?`,
        quickReplies: ['Platform not detected', 'File too large', 'Upload failed']
      }
    }

    // Usage limits
    if (lowerMessage.includes('usage') || lowerMessage.includes('limit')) {
      const limits = {
        free: '5 generations',
        pro: '500 generations', 
        business: '2000 generations'
      }

      return {
        content: `📈 **Your Usage Limits (${context.userPlan} plan):**

• **Current limit:** ${limits[context.userPlan as keyof typeof limits]}
• **Reset:** Monthly on your billing date
• **Usage calculation:** 1 base + 0.5 per additional platform

**Platform limits:**
• Free: Universal only
• Pro: Universal + 4 additional platforms
• Business: Unlimited platforms

Want to upgrade for more generations?`,
        quickReplies: ['Upgrade plan', 'Check current usage', 'How usage works']
      }
    }

    // Platform detection issues
    if (lowerMessage.includes('platform') || lowerMessage.includes('detect')) {
      return {
        content: `🔍 **Platform Detection Help:**

Our AI analyzes your CSV headers to detect:
• **Shopify:** Handle, Title, Vendor columns
• **Amazon:** ASIN, Product Title patterns
• **WooCommerce:** SKU, Name, Regular price
• **eBay:** Item ID, Title, Category
• **Etsy:** Listing ID, Title, Tags

**If detection fails:**
1. Check your CSV headers match platform standards
2. Use manual platform selection
3. Ensure sample data is included

**Common issues:**
• Mixed platform data
• Custom column names
• Missing required fields

Need help with a specific platform?`,
        quickReplies: ['Shopify detection', 'Amazon detection', 'Manual selection']
      }
    }

    // Export formats
    if (lowerMessage.includes('export') || lowerMessage.includes('format')) {
      return {
        content: `📁 **Export Formats Available:**

**Current (Phase 1A):**
• **TXT format:** Structured text export with all content sections

**Coming Soon (Phase 1B):**
• **Enhanced CSV:** Original + CopyFlow_ columns
• **Excel (XLSX):** Formatted spreadsheet
• **JSON:** API-friendly format

**TXT Export includes:**
• Main content (title, description, SEO)
• Marketing content (bullets, features, tags)
• Viral content (TikTok, Instagram)
• Psychology triggers
• Competitive advantages

The TXT format is perfect for copying content to your platform!`,
        quickReplies: ['Download TXT', 'CSV format info', 'When Excel available?']
      }
    }

    // Pricing
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('plan')) {
      return {
        content: `💰 **CopyFlow Pricing:**

**🆓 Free Plan:**
• 5 generations/month
• Universal platform only
• TXT export
• Community support

**⭐ Pro Plan - $19/month:**
• 500 generations/month
• All platforms (Universal + 4)
• All export formats
• Priority support
• CSV bulk processing

**🚀 Business Plan - $49/month:**
• 2000 generations/month
• Unlimited platforms
• API access
• White-label options
• Dedicated support

Ready to upgrade?`,
        quickReplies: ['Upgrade to Pro', 'Upgrade to Business', 'Compare features']
      }
    }

    // Default response
    return {
      content: `I understand you're asking about "${userMessage}". 

I'm here to help with:
• **CSV processing** and platform detection
• **Usage limits** and billing questions  
• **Export formats** and features
• **Technical issues** and troubleshooting

Could you provide more details about what you need help with?`,
      quickReplies: ['Technical issue', 'Billing question', 'Feature request', 'Talk to human']
    }
  }

  // Handle file attachment
  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files.slice(0, 3 - prev.length)]) // Max 3 files
    }
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Handle quick reply
  const handleQuickReply = (reply: string) => {
    sendMessage(reply, true)
  }

  // Submit rating
  const submitRating = async (stars: number) => {
    setRating(stars)
    setShowRating(false)

    const ratingMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: `⭐ Thank you for rating our support ${stars}/5 stars!`,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, ratingMessage])
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  // Offline email fallback
  const sendOfflineEmail = () => {
    const subject = encodeURIComponent('CopyFlow Support Request')
    const body = encodeURIComponent(`Hi CopyFlow Support,

I need help with: ${inputValue}

User ID: ${userId || 'Not logged in'}
Plan: ${userPlan}
Page: ${currentPage || 'Unknown'}

Please respond when possible.

Thanks!`)
    
    window.open(`mailto:support@copyflow.ai?subject=${subject}&body=${body}`)
  }

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      {/* Chat Bubble */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open support chat</span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-80 h-96 shadow-xl border-2 flex flex-col">
          {/* Header */}
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary" />
                <span>CopyFlow Support</span>
                <div className="flex items-center space-x-1">
                  {isOnline ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <Badge variant={isOnline ? "success" : "destructive"} size="sm">
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* Message */}
                <div className={cn(
                  'flex',
                  message.type === 'user' ? 'justify-end' : 
                  message.type === 'system' ? 'justify-center' : 'justify-start'
                )}>
                  <div className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'system'
                        ? 'bg-muted text-muted-foreground text-center'
                        : 'bg-muted'
                  )}>
                    {message.type !== 'user' && message.type !== 'system' && (
                      <div className="flex items-center space-x-1 mb-1">
                        <Bot className="h-3 w-3" />
                        <span className="text-xs font-medium">AI Assistant</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 text-xs bg-background/50 rounded p-1">
                            <Paperclip className="h-3 w-3" />
                            <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>

                {/* Quick Replies */}
                {message.quickReplies && message.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-start">
                    {message.quickReplies.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickReply(reply)}
                        className="text-xs h-7"
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center space-x-2">
                  <Bot className="h-3 w-3" />
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <div className="border-t p-3 space-y-2">
            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-1 bg-muted rounded px-2 py-1 text-xs">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate max-w-20">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-4 w-4 p-0"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isOnline ? "Type your message..." : "Offline - will send via email"}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (isOnline) {
                        sendMessage(inputValue)
                      } else {
                        sendOfflineEmail()
                      }
                    }
                  }}
                  disabled={isSending}
                  className="pr-8"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileAttach}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  disabled={attachments.length >= 3}
                >
                  <Paperclip className="h-3 w-3" />
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  if (isOnline) {
                    sendMessage(inputValue)
                  } else {
                    sendOfflineEmail()
                  }
                }}
                disabled={(!inputValue.trim() && attachments.length === 0) || isSending}
                size="sm"
                loading={isSending}
              >
                {isOnline ? <Send className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              </Button>
            </div>

            {/* Offline Actions */}
            {!isOnline && (
              <div className="flex justify-center space-x-2 text-xs">
                <Button variant="outline" size="sm" onClick={sendOfflineEmail}>
                  <Mail className="h-3 w-3 mr-1" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open('tel:+1234567890')}>
                  <Phone className="h-3 w-3 mr-1" />
                  Call Support
                </Button>
              </div>
            )}
          </div>

          {/* Rating */}
          {showRating && (
            <div className="border-t p-3 text-center">
              <p className="text-sm mb-2">Rate your support experience:</p>
              <div className="flex justify-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    onClick={() => submitRating(star)}
                    className="p-1"
                  >
                    <Star 
                      className={cn(
                        "h-4 w-4",
                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      )} 
                    />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".csv,.xlsx,.txt,.png,.jpg,.jpeg,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}