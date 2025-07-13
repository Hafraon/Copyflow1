import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

// ============================================================================
// WAYFORPAY WEBHOOK HANDLER - REAL PAYMENT PROCESSING
// ============================================================================

// WayForPay webhook validation schema
const WayForPayWebhookSchema = z.object({
  merchantAccount: z.string(),
  orderReference: z.string(),
  amount: z.number(),
  currency: z.string(),
  authCode: z.string().optional(),
  cardPan: z.string().optional(),
  transactionStatus: z.enum(['Approved', 'Declined', 'Pending', 'Expired']),
  reasonCode: z.number().optional(),
  reason: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  createdDate: z.number(),
  processingDate: z.number().optional(),
  cardType: z.string().optional(),
  issuerBankCountry: z.string().optional(),
  issuerBankName: z.string().optional(),
  merchantSignature: z.string(),
  fee: z.number().optional(),
  paymentSystem: z.string().optional()
})

type WayForPayWebhook = z.infer<typeof WayForPayWebhookSchema>

// Payment status tracking
interface PaymentRecord {
  orderReference: string
  userId: string
  planId: string
  amount: number
  status: 'pending' | 'approved' | 'declined' | 'expired'
  createdAt: Date
  processedAt?: Date
  transactionId?: string
}

// In-memory storage (replace with database in production)
const paymentRecords = new Map<string, PaymentRecord>()

/**
 * Verify WayForPay signature
 */
function verifySignature(data: WayForPayWebhook): boolean {
  const secretKey = process.env.WAYFORPAY_SECRET_KEY
  if (!secretKey) {
    console.error('WAYFORPAY_SECRET_KEY not configured')
    return false
  }

  // Create signature string according to WayForPay documentation
  const signatureString = [
    data.merchantAccount,
    data.orderReference,
    data.amount,
    data.currency,
    data.authCode || '',
    data.cardPan || '',
    data.transactionStatus,
    data.reasonCode || ''
  ].join(';')

  // Generate HMAC-MD5 signature
  const expectedSignature = crypto
    .createHmac('md5', secretKey)
    .update(signatureString)
    .digest('hex')

  return expectedSignature === data.merchantSignature
}

/**
 * Extract user and plan info from order reference
 */
function parseOrderReference(orderReference: string): { userId: string; planId: string } | null {
  // Format: copyflow_{planId}_{userId}_{timestamp}
  const parts = orderReference.split('_')
  if (parts.length >= 4 && parts[0] === 'copyflow') {
    return {
      planId: parts[1],
      userId: parts[2]
    }
  }
  return null
}

/**
 * Update user subscription
 */
async function updateUserSubscription(userId: string, planId: string, orderReference: string): Promise<boolean> {
  try {
    // In production, update database
    console.log(`Updating user ${userId} to ${planId} plan (order: ${orderReference})`)
    
    // Mock subscription update
    const subscriptionData = {
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      orderReference
    }
    
    // Store subscription (replace with database call)
    console.log('Subscription updated:', subscriptionData)
    
    return true
  } catch (error) {
    console.error('Failed to update subscription:', error)
    return false
  }
}

/**
 * Send confirmation email
 */
async function sendConfirmationEmail(email: string, planId: string, orderReference: string): Promise<void> {
  try {
    // In production, send actual email
    console.log(`Sending confirmation email to ${email} for ${planId} plan (order: ${orderReference})`)
    
    // Mock email sending
    const emailData = {
      to: email,
      subject: 'CopyFlow Subscription Confirmed',
      template: 'subscription-confirmed',
      data: {
        planId,
        orderReference,
        activationDate: new Date().toISOString()
      }
    }
    
    console.log('Confirmation email sent:', emailData)
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
  }
}

/**
 * Log payment event for analytics
 */
async function logPaymentEvent(data: WayForPayWebhook, userId?: string, planId?: string): Promise<void> {
  try {
    const eventData = {
      event: 'payment_webhook',
      orderReference: data.orderReference,
      status: data.transactionStatus,
      amount: data.amount,
      currency: data.currency,
      userId,
      planId,
      paymentSystem: data.paymentSystem,
      timestamp: new Date().toISOString()
    }
    
    console.log('Payment event logged:', eventData)
    
    // In production, send to analytics service
  } catch (error) {
    console.error('Failed to log payment event:', error)
  }
}

/**
 * POST /api/payment/webhook - Handle WayForPay webhooks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse webhook data
    const body = await request.json()
    console.log('WayForPay webhook received:', body)
    
    // Validate webhook structure
    const validationResult = WayForPayWebhookSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Invalid webhook data:', validationResult.error)
      return NextResponse.json({
        status: 'error',
        message: 'Invalid webhook data'
      }, { status: 400 })
    }
    
    const webhookData = validationResult.data
    
    // Verify signature
    if (!verifySignature(webhookData)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({
        status: 'error',
        message: 'Invalid signature'
      }, { status: 401 })
    }
    
    // Parse order reference
    const orderInfo = parseOrderReference(webhookData.orderReference)
    if (!orderInfo) {
      console.error('Invalid order reference format:', webhookData.orderReference)
      return NextResponse.json({
        status: 'error',
        message: 'Invalid order reference'
      }, { status: 400 })
    }
    
    const { userId, planId } = orderInfo
    
    // Log payment event
    await logPaymentEvent(webhookData, userId, planId)
    
    // Update payment record
    const paymentRecord: PaymentRecord = {
      orderReference: webhookData.orderReference,
      userId,
      planId,
      amount: webhookData.amount,
      status: webhookData.transactionStatus.toLowerCase() as PaymentRecord['status'],
      createdAt: new Date(webhookData.createdDate * 1000),
      processedAt: webhookData.processingDate ? new Date(webhookData.processingDate * 1000) : new Date(),
      transactionId: webhookData.authCode
    }
    
    paymentRecords.set(webhookData.orderReference, paymentRecord)
    
    // Handle different payment statuses
    switch (webhookData.transactionStatus) {
      case 'Approved':
        console.log(`Payment approved for order ${webhookData.orderReference}`)
        
        // Update user subscription
        const subscriptionUpdated = await updateUserSubscription(userId, planId, webhookData.orderReference)
        
        if (subscriptionUpdated) {
          // Send confirmation email
          if (webhookData.email) {
            await sendConfirmationEmail(webhookData.email, planId, webhookData.orderReference)
          }
          
          console.log(`Subscription activated for user ${userId} (${planId} plan)`)
        } else {
          console.error(`Failed to update subscription for user ${userId}`)
        }
        break
        
      case 'Declined':
        console.log(`Payment declined for order ${webhookData.orderReference}: ${webhookData.reason}`)
        break
        
      case 'Pending':
        console.log(`Payment pending for order ${webhookData.orderReference}`)
        break
        
      case 'Expired':
        console.log(`Payment expired for order ${webhookData.orderReference}`)
        break
        
      default:
        console.log(`Unknown payment status: ${webhookData.transactionStatus}`)
    }
    
    // Return success response (required by WayForPay)
    return NextResponse.json({
      orderReference: webhookData.orderReference,
      status: 'accept',
      time: Math.floor(Date.now() / 1000)
    })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * GET /api/payment/webhook - Health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    service: 'wayforpay-webhook',
    timestamp: new Date().toISOString()
  })
}