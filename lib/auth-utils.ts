// ============================================================================
// AUTHENTICATION UTILITIES - SECURITY & VALIDATION
// ============================================================================

import { z } from 'zod'

// User types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  plan: 'free' | 'pro' | 'business'
  emailVerified: boolean
  createdAt: Date
  lastLoginAt?: Date
}

// Authentication state
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

// Sign in schema
export const SignInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().optional().default(false)
})

// Sign up schema
export const SignUpSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
  marketingEmails: z.boolean().optional().default(false)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Password reset schema
export const PasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
})

// New password schema
export const NewPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  token: z.string().min(1, 'Reset token is required')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export type SignInFormData = z.infer<typeof SignInSchema>
export type SignUpFormData = z.infer<typeof SignUpSchema>
export type PasswordResetFormData = z.infer<typeof PasswordResetSchema>
export type NewPasswordFormData = z.infer<typeof NewPasswordSchema>

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
  strength: 'weak' | 'fair' | 'good' | 'strong'
} {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) score += 1
  else feedback.push('Use at least 8 characters')

  if (password.length >= 12) score += 1
  else if (password.length >= 8) feedback.push('Consider using 12+ characters for better security')

  // Character variety
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Include lowercase letters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Include uppercase letters')

  if (/\d/.test(password)) score += 1
  else feedback.push('Include numbers')

  if (/[^a-zA-Z\d]/.test(password)) score += 1
  else feedback.push('Include special characters (!@#$%^&*)')

  // Common patterns
  if (!/(.)\1{2,}/.test(password)) score += 1
  else feedback.push('Avoid repeating characters')

  if (!/123|abc|qwe|password|admin/i.test(password)) score += 1
  else feedback.push('Avoid common patterns')

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong'
  if (score <= 3) strength = 'weak'
  else if (score <= 5) strength = 'fair'
  else if (score <= 7) strength = 'good'
  else strength = 'strong'

  return { score, feedback, strength }
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

// Generate secure password
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Format error messages
export function formatAuthError(error: string): string {
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password is too weak',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/internal-error': 'An internal error occurred. Please try again'
  }
  
  return errorMap[error] || 'An unexpected error occurred. Please try again'
}

// Session management
export function getStoredAuth(): { token?: string; user?: User } {
  if (typeof window === 'undefined') return {}
  
  try {
    const token = localStorage.getItem('copyflow-token')
    const userStr = localStorage.getItem('copyflow-user')
    const user = userStr ? JSON.parse(userStr) : null
    
    return { token: token || undefined, user }
  } catch {
    return {}
  }
}

export function storeAuth(token: string, user: User): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('copyflow-token', token)
  localStorage.setItem('copyflow-user', JSON.stringify(user))
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('copyflow-token')
  localStorage.removeItem('copyflow-user')
}

// Rate limiting for auth attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>()

export function checkAuthRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 5
  
  const attempts = authAttempts.get(identifier)
  
  if (!attempts || now - attempts.lastAttempt > windowMs) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now })
    return { allowed: true }
  }
  
  if (attempts.count >= maxAttempts) {
    const retryAfter = Math.ceil((windowMs - (now - attempts.lastAttempt)) / 1000)
    return { allowed: false, retryAfter }
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return { allowed: true }
}

// Security headers for auth requests
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}

// Validate redirect URL
export function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.origin === window.location.origin
  } catch {
    return false
  }
}

// Generate CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Auth utilities export
export const AuthUtils = {
  checkPasswordStrength,
  isValidEmail,
  generateSecurePassword,
  formatAuthError,
  getStoredAuth,
  storeAuth,
  clearAuth,
  checkAuthRateLimit,
  getSecurityHeaders,
  isValidRedirectUrl,
  generateCSRFToken
} as const