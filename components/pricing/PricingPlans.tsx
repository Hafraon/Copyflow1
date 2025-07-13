import React from 'react'
import { useState } from 'react'
import { 
  Check, 
  Crown, 
  Zap, 
  ArrowRight, 
  Star, 
  Shield, 
  Loader2,
  ExternalLink,
  CreditCard,
  Globe,
  Users,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Plan {
  id: 'free' | 'pro' | 'business'
  name: string
  price: number
  originalPrice?: number
  currency: string
  period: string
  description: string
  popular: boolean
  features: string[]
  exportFeatures: string[]
  limitations?: string[]
  cta: string
  highlight?: string
}

interface PricingPlansProps {
  currentPlan?: 'free' | 'pro' | 'business'
  currentUsage?: number
  onUpgrade?: (planId: string) => void
  className?: string
  showComparison?: boolean
  billingCycle?: 'monthly' | 'yearly'
  onBillingCycleChange?: (cycle: 'monthly' | 'yearly') => void
}

// WayForPay integration utilities
class WayForPayIntegration {
  private merchantAccount: string
  private secretKey: string
  private domain: string

  constructor() {
    this.merchantAccount = process.env.NEXT_PUBLIC_WAYFORPAY_MERCHANT_ACCOUNT || ''
    this.secretKey = process.env.WAYFORPAY_SECRET_KEY || ''
    this.domain = process.env.NEXT_PUBLIC_WAYFORPAY_DOMAIN || ''
  }

  // Generate payment signature
  private generateSignature(params: Record<string, any>): string {
    const signatureString = [
      this.merchantAccount,
      params.merchantDomainName,
      params.orderReference,
      params.orderDate,
      params.amount,
      params.currency,
      params.productName,
      params.productCount,
      params.productPrice
    ].join(';')

    // In production, use proper HMAC-MD5 with secret key
    return btoa(signatureString + this.secretKey).substring(0, 32)
  }

  // Create payment form data
  createPaymentForm(planId: string, amount: number, userEmail: string, userId: string) {
    const orderReference = `copyflow_${planId}_${userId}_${Date.now()}`
    const orderDate = Math.floor(Date.now() / 1000)
    
    const planNames = {
      pro: 'CopyFlow Pro Plan - 500 Generations',
      business: 'CopyFlow Business Plan - 2000 Generations'
    }

    const params = {
      merchantAccount: this.merchantAccount,
      merchantDomainName: this.domain,
      orderReference,
      orderDate,
      amount,
      currency: 'UAH',
      productName: planNames[planId as keyof typeof planNames] || 'CopyFlow Subscription',
      productCount: 1,
      productPrice: amount,
      clientEmail: userEmail,
      clientFirstName: 'CopyFlow',
      clientLastName: 'User',
      language: 'uk',
      returnUrl: `${window.location.origin}/payment/success`,
      serviceUrl: `${window.location.origin}/api/payment/webhook`
    }

    const signature = this.generateSignature(params)

    return {
      ...params,
      merchantSignature: signature
    }
  }

  // Submit payment form
  submitPayment(formData: Record<string, any>) {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = 'https://secure.wayforpay.com/pay'
    form.style.display = 'none'

    Object.entries(formData).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = String(value)
      form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }
}

export const PricingPlans: React.FC<PricingPlansProps> = ({
  currentPlan = 'free',
  currentUsage = 0,
  onUpgrade,
  className,
  showComparison = true,
  billingCycle = 'monthly',
  onBillingCycleChange
}) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const wayforpay = new WayForPayIntegration()

  // Plan configurations with Export workflow emphasis
  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'UAH',
      period: '/month',
      description: 'Perfect for testing Export → Import workflow',
      popular: false,
      features: [
        '5 generations per month',
        'Universal platform only',
        'TXT export format',
        'Community support',
        'Basic Magic Input'
      ],
      exportFeatures: [
        'Export → Import workflow',
        'Original columns preserved',
        'CopyFlow_ enhancement columns'
      ],
      limitations: [
        'Limited to Universal platform',
        'No CSV bulk processing',
        'No platform-specific optimization'
      ],
      cta: 'Current Plan',
      highlight: 'Great for testing'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? 570 : 5700, // $19 ≈ 570 UAH
      originalPrice: billingCycle === 'yearly' ? 6840 : undefined,
      currency: 'UAH',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'For growing e-commerce businesses',
      popular: true,
      features: [
        '500 generations per month',
        'All platforms (Universal + 4)',
        'All export formats (TXT, CSV, Excel)',
        'Priority support',
        'CSV bulk processing',
        'Platform auto-detection',
        'Multi-language content (11 languages)'
      ],
      exportFeatures: [
        'Enhanced Export → Super-Export workflow',
        'Platform-specific optimizations',
        'Bulk CSV processing',
        '98% import success rate'
      ],
      cta: 'Upgrade to Pro',
      highlight: 'Most Popular'
    },
    {
      id: 'business',
      name: 'Business',
      price: billingCycle === 'monthly' ? 1470 : 14700, // $49 ≈ 1470 UAH
      originalPrice: billingCycle === 'yearly' ? 17640 : undefined,
      currency: 'UAH',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'For enterprise teams and agencies',
      popular: false,
      features: [
        '2000 generations per month',
        'Unlimited platforms',
        'All export formats + API access',
        'Dedicated support',
        'White-label options',
        'Team collaboration',
        'Advanced analytics',
        'Custom integrations'
      ],
      exportFeatures: [
        'Enterprise Export → Import workflow',
        'Custom platform integrations',
        'API access for automation',
        'Team workspace management'
      ],
      cta: 'Upgrade to Business',
      highlight: 'Enterprise Ready'
    }
  ]

  // Handle upgrade with WayForPay
  const handleUpgrade = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan) return

    setIsProcessing(planId)

    try {
      const plan = plans.find(p => p.id === planId)
      if (!plan) throw new Error('Plan not found')

      // Mock user data (replace with real user context)
      const userEmail = 'user@example.com'
      const userId = 'user_123'

      // Create WayForPay payment form
      const paymentData = wayforpay.createPaymentForm(
        planId,
        plan.price,
        userEmail,
        userId
      )

      // Submit to WayForPay
      wayforpay.submitPayment(paymentData)

      // Call upgrade callback if provided
      onUpgrade?.(planId)

    } catch (error) {
      console.error('Payment initiation failed:', error)
      alert('Payment initiation failed. Please try again.')
    } finally {
      setIsProcessing(null)
    }
  }

  // Get usage percentage for current plan
  const getCurrentPlanLimit = () => {
    const currentPlanData = plans.find(p => p.id === currentPlan)
    if (currentPlan === 'free') return 5
    if (currentPlan === 'pro') return 500
    if (currentPlan === 'business') return 2000
    return 5
  }

  const usagePercentage = (currentUsage / getCurrentPlanLimit()) * 100

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">
          Choose Your Export Enhancement Plan
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transform your platform exports into super-exports with AI-powered content enhancement. 
          All plans preserve original columns and add CopyFlow_ enhancements.
        </p>

        {/* Billing Cycle Toggle */}
        {onBillingCycleChange && (
          <div className="flex items-center justify-center space-x-4">
            <span className={cn(
              'text-sm',
              billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground'
            )}>
              Monthly
            </span>
            <button
              onClick={() => onBillingCycleChange(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                billingCycle === 'yearly' ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className={cn(
              'text-sm flex items-center space-x-1',
              billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground'
            )}>
              <span>Yearly</span>
              <Badge variant="success" size="sm">Save 20%</Badge>
            </span>
          </div>
        )}
      </div>

      {/* Current Usage (if user has a plan) */}
      {currentPlan !== 'free' && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Current Usage</span>
                <span className="text-muted-foreground">
                  {currentUsage} / {getCurrentPlanLimit()} generations
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{currentPlan} Plan</span>
                <span>{Math.round(usagePercentage)}% used</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan
          const isUpgrade = plan.id !== 'free' && plan.id !== currentPlan
          const isProcessingThis = isProcessing === plan.id

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative transition-all duration-300',
                plan.popular && 'border-primary shadow-lg scale-105',
                isCurrentPlan && 'border-green-500 bg-green-50'
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Star className="w-3 h-3 mr-1" />
                  {plan.highlight}
                </Badge>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Check className="w-3 h-3 mr-1" />
                  Current Plan
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'Free' : `₴${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  
                  {plan.originalPrice && (
                    <div className="text-sm text-muted-foreground">
                      <span className="line-through">₴{plan.originalPrice.toLocaleString()}</span>
                      <Badge variant="success" size="sm" className="ml-2">
                        Save ₴{(plan.originalPrice - plan.price).toLocaleString()}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Export Features */}
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-primary" />
                    Export Enhancement
                  </h4>
                  <ul className="space-y-2">
                    {plan.exportFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Core Features */}
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-primary" />
                    Core Features
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {plan.limitations && (
                  <div>
                    <h4 className="font-medium text-sm mb-3 text-muted-foreground">
                      Limitations
                    </h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start text-sm text-muted-foreground">
                          <span className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0">•</span>
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan || isProcessingThis}
                  loading={isProcessingThis}
                  className={cn(
                    'w-full',
                    plan.popular && 'bg-primary hover:bg-primary/90',
                    isCurrentPlan && 'bg-green-600 hover:bg-green-600'
                  )}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {isProcessingThis ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Current Plan
                    </>
                  ) : isUpgrade ? (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {plan.cta}
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>

                {/* WayForPay Security Notice */}
                {isUpgrade && (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>Secure payment via WayForPay</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      {showComparison && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">Free</th>
                    <th className="text-center py-3 px-4">Pro</th>
                    <th className="text-center py-3 px-4">Business</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Monthly Generations</td>
                    <td className="text-center py-3 px-4">5</td>
                    <td className="text-center py-3 px-4">500</td>
                    <td className="text-center py-3 px-4">2,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Platforms Supported</td>
                    <td className="text-center py-3 px-4">Universal only</td>
                    <td className="text-center py-3 px-4">Universal + 4</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Export Formats</td>
                    <td className="text-center py-3 px-4">TXT</td>
                    <td className="text-center py-3 px-4">TXT, CSV, Excel</td>
                    <td className="text-center py-3 px-4">All + API</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">CSV Bulk Processing</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">✅</td>
                    <td className="text-center py-3 px-4">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Multi-language Content</td>
                    <td className="text-center py-3 px-4">English only</td>
                    <td className="text-center py-3 px-4">11 languages</td>
                    <td className="text-center py-3 px-4">11 languages</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Support Level</td>
                    <td className="text-center py-3 px-4">Community</td>
                    <td className="text-center py-3 px-4">Priority</td>
                    <td className="text-center py-3 px-4">Dedicated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trust Indicators */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Secure WayForPay payments</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>10,000+ satisfied customers</span>
          </div>
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>98% import success rate</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          All plans include our Export → Import workflow with original column preservation
        </p>
      </div>
    </div>
  )
}