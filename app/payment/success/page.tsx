'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Crown, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PaymentStatus {
  status: 'loading' | 'success' | 'error'
  orderReference?: string
  planId?: string
  message?: string
}

export default function PaymentSuccessPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'loading' })
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get payment details from URL parameters
    const orderReference = searchParams.get('orderReference')
    const status = searchParams.get('transactionStatus')
    
    if (orderReference && status) {
      if (status === 'Approved') {
        // Extract plan info from order reference
        const parts = orderReference.split('_')
        const planId = parts.length >= 2 ? parts[1] : 'unknown'
        
        setPaymentStatus({
          status: 'success',
          orderReference,
          planId,
          message: 'Payment successful! Your subscription has been activated.'
        })
      } else {
        setPaymentStatus({
          status: 'error',
          orderReference,
          message: `Payment ${status.toLowerCase()}. Please try again or contact support.`
        })
      }
    } else {
      // Simulate payment verification (replace with actual API call)
      setTimeout(() => {
        setPaymentStatus({
          status: 'success',
          orderReference: 'copyflow_pro_user123_' + Date.now(),
          planId: 'pro',
          message: 'Payment successful! Your subscription has been activated.'
        })
      }, 2000)
    }
  }, [searchParams])

  const getPlanDetails = (planId: string) => {
    const plans = {
      pro: {
        name: 'Pro Plan',
        features: ['500 generations/month', 'All platforms', 'Priority support'],
        price: '₴570/month'
      },
      business: {
        name: 'Business Plan', 
        features: ['2000 generations/month', 'Unlimited platforms', 'Dedicated support'],
        price: '₴1470/month'
      }
    }
    return plans[planId as keyof typeof plans] || plans.pro
  }

  const handleContinue = () => {
    router.push('/dashboard')
  }

  if (paymentStatus.status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentStatus.status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-900">Payment Failed</h2>
            <p className="text-red-700 mb-6">
              {paymentStatus.message}
            </p>
            <div className="space-y-3">
              <Button onClick={() => router.push('/pricing')} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.push('/support')} className="w-full">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const planDetails = getPlanDetails(paymentStatus.planId || 'pro')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-green-200 bg-green-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-900">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-green-700 mb-4">
              {paymentStatus.message}
            </p>
            
            {paymentStatus.orderReference && (
              <div className="text-sm text-green-600">
                Order Reference: <code className="font-mono">{paymentStatus.orderReference}</code>
              </div>
            )}
          </div>

          {/* Plan Details */}
          <Card className="bg-white border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                  {planDetails.name}
                </h3>
                <Badge variant="success">Active</Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">{planDetails.price}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Features:</span>
                  <ul className="mt-1 space-y-1">
                    {planDetails.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="space-y-3">
            <h4 className="font-medium text-green-900">What's Next?</h4>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Your subscription is now active
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Start generating enhanced content immediately
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Access all platform-specific optimizations
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleContinue} className="w-full" size="lg">
              Start Creating Content
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/usage')}
                className="flex-1"
              >
                View Usage
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/support')}
                className="flex-1"
              >
                Get Help
              </Button>
            </div>
          </div>

          {/* Support Notice */}
          <div className="text-center text-xs text-green-600 border-t border-green-200 pt-4">
            Need help? Our support team is available 24/7 to assist you.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}