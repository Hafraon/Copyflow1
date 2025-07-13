'use client'

import React from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthForms } from '@/components/auth/AuthForms'
import { AuthUtils, formatAuthError, type SignUpFormData } from '@/lib/auth-utils'
import { toast } from 'sonner'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Rate limiting check
      const rateLimit = AuthUtils.checkAuthRateLimit(data.email)
      if (!rateLimit.allowed) {
        throw new Error(`Too many attempts. Please try again in ${rateLimit.retryAfter} seconds.`)
      }

      // Simulate API call (replace with actual authentication)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: AuthUtils.getSecurityHeaders(),
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          acceptTerms: data.acceptTerms,
          marketingEmails: data.marketingEmails
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Sign up failed')
      }

      // Store authentication data
      AuthUtils.storeAuth(result.token, result.user)

      // Success notification
      toast.success(`Welcome to CopyFlow, ${result.user.name}!`)

      // Validate and redirect
      const safeRedirect = AuthUtils.isValidRedirectUrl(redirectTo) ? redirectTo : '/dashboard'
      router.push(safeRedirect)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(formatAuthError(errorMessage))
      toast.error('Sign up failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModeChange = (mode: 'signin' | 'signup' | 'reset') => {
    setError(null)
    
    if (mode === 'signin') {
      router.push('/auth/signin')
    } else if (mode === 'reset') {
      router.push('/auth/reset-password')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForms
          mode="signup"
          onSubmit={handleSignUp}
          onModeChange={handleModeChange}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  )
}