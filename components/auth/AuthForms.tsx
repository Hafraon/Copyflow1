import React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  SignInSchema, 
  SignUpSchema, 
  PasswordResetSchema,
  type SignInFormData, 
  type SignUpFormData, 
  type PasswordResetFormData,
  checkPasswordStrength,
  AuthUtils
} from '@/lib/auth-utils'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ErrorMessage } from '@/components/ui/error-message'

interface AuthFormsProps {
  mode: 'signin' | 'signup' | 'reset'
  onSubmit: (data: any) => Promise<void>
  onModeChange: (mode: 'signin' | 'signup' | 'reset') => void
  isLoading?: boolean
  error?: string
  className?: string
}

export const AuthForms: React.FC<AuthFormsProps> = ({
  mode,
  onSubmit,
  onModeChange,
  isLoading = false,
  error,
  className
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<any>(null)

  // Sign In Form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  // Sign Up Form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      marketingEmails: false
    }
  })

  // Password Reset Form
  const resetForm = useForm<PasswordResetFormData>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: {
      email: ''
    }
  })

  // Handle password change for strength checking
  const handlePasswordChange = (password: string) => {
    if (password.length > 0) {
      const strength = checkPasswordStrength(password)
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(null)
    }
  }

  // Generate secure password
  const generatePassword = () => {
    const newPassword = AuthUtils.generateSecurePassword(16)
    signUpForm.setValue('password', newPassword)
    signUpForm.setValue('confirmPassword', newPassword)
    handlePasswordChange(newPassword)
    setShowPassword(true)
    setShowConfirmPassword(true)
  }

  // Get password strength color
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500'
      case 'fair': return 'bg-yellow-500'
      case 'good': return 'bg-blue-500'
      case 'strong': return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  // Get password strength percentage
  const getStrengthPercentage = (score: number) => {
    return Math.min((score / 8) * 100, 100)
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full mx-auto mb-4">
          <Zap className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {mode === 'signin' && 'Welcome back'}
          {mode === 'signup' && 'Create your account'}
          {mode === 'reset' && 'Reset your password'}
        </h1>
        <p className="text-muted-foreground">
          {mode === 'signin' && 'Sign in to your CopyFlow account'}
          {mode === 'signup' && 'Start generating amazing product content'}
          {mode === 'reset' && 'Enter your email to reset your password'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage
          type="error"
          message={error}
          className="mb-6"
          dismissible
        />
      )}

      {/* Sign In Form */}
      {mode === 'signin' && (
        <Card>
          <CardContent className="p-6">
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          leftIcon={<Mail className="h-4 w-4" />}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            leftIcon={<Lock className="h-4 w-4" />}
                            disabled={isLoading}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <FormField
                    control={signInForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => onModeChange('reset')}
                    disabled={isLoading}
                    className="p-0 h-auto"
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{' '}
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={() => onModeChange('signup')}
                disabled={isLoading}
                className="p-0 h-auto"
              >
                Sign up
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Up Form */}
      {mode === 'signup' && (
        <Card>
          <CardContent className="p-6">
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={signUpForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          leftIcon={<User className="h-4 w-4" />}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          leftIcon={<Mail className="h-4 w-4" />}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={generatePassword}
                          disabled={isLoading}
                          className="p-0 h-auto text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Generate
                        </Button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            leftIcon={<Lock className="h-4 w-4" />}
                            disabled={isLoading}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handlePasswordChange(e.target.value)
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      
                      {/* Password Strength Indicator */}
                      {passwordStrength && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Password strength</span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-xs',
                                passwordStrength.strength === 'weak' && 'border-red-500 text-red-600',
                                passwordStrength.strength === 'fair' && 'border-yellow-500 text-yellow-600',
                                passwordStrength.strength === 'good' && 'border-blue-500 text-blue-600',
                                passwordStrength.strength === 'strong' && 'border-green-500 text-green-600'
                              )}
                            >
                              {passwordStrength.strength}
                            </Badge>
                          </div>
                          <Progress 
                            value={getStrengthPercentage(passwordStrength.score)} 
                            className="h-1"
                          />
                          {passwordStrength.feedback.length > 0 && (
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {passwordStrength.feedback.slice(0, 3).map((feedback, index) => (
                                <li key={index} className="flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                  {feedback}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            leftIcon={<Shield className="h-4 w-4" />}
                            disabled={isLoading}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormField
                    control={signUpForm.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-normal leading-relaxed">
                            I agree to the{' '}
                            <a href="/terms" className="text-primary hover:underline">
                              Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="/privacy" className="text-primary hover:underline">
                              Privacy Policy
                            </a>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Send me product updates and marketing emails
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <span className="text-sm text-muted-foreground">
                Already have an account?{' '}
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={() => onModeChange('signin')}
                disabled={isLoading}
                className="p-0 h-auto"
              >
                Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Reset Form */}
      {mode === 'reset' && (
        <Card>
          <CardContent className="p-6">
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          leftIcon={<Mail className="h-4 w-4" />}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Send Reset Link
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <span className="text-sm text-muted-foreground">
                Remember your password?{' '}
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={() => onModeChange('signin')}
                disabled={isLoading}
                className="p-0 h-auto"
              >
                Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Your data is protected with enterprise-grade security</span>
        </div>
      </div>
    </div>
  )
}