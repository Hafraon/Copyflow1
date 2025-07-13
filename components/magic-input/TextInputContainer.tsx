import React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, CheckCircle, AlertCircle, RotateCcw, Sparkles, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TextInputFormData } from '@/lib/form-schemas'
import { EmojiSettings, GenerationRequest, GenerationResponse, UserPlanType } from '@/lib/types'
import { 
  calculateUsage, 
  validateUsage, 
  getPlanLimit,
  validatePlatformSelection,
  getUsageStatus 
} from '@/lib/usage-tracker'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { ErrorType } from '@/lib/error-handling'
import { generateContent } from '@/lib/openai-client'
import { TextInputForm } from './TextInputForm'
import { PlatformSelector } from './PlatformSelector'
import { EmojiSystemControls } from './EmojiSystemControls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ErrorMessage } from '@/components/ui/error-message'
import { ApiErrorMessage } from '@/components/ui/api-error-message'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TextInputContainerProps {
  userId: string
  userPlan: UserPlanType
  currentUsage: number
  onGenerationComplete: (response: GenerationResponse) => void
  onUsageUpdate: (newUsage: number) => void
  className?: string
}

type WorkflowStep = 'form' | 'platforms' | 'emoji' | 'validation' | 'generation' | 'results'

interface FormState {
  formData: TextInputFormData | null
  selectedPlatforms: string[]
  emojiSettings: EmojiSettings
  isValid: boolean
  errors: string[]
}

export const TextInputContainer: React.FC<TextInputContainerProps> = ({
  userId,
  userPlan,
  currentUsage,
  onGenerationComplete,
  onUsageUpdate,
  className
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('form')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [formState, setFormState] = useState<FormState>({
    formData: null,
    selectedPlatforms: ['universal'],
    emojiSettings: {
      enabled: true,
      intensity: 'medium',
      categorySpecific: true,
      intensityConfig: {
        low: { count: '3-5', example: '✅ Quality 🚚 Fast' },
        medium: { count: '8-12', example: '✅ Quality 🔥 Price 🚚 Delivery ⚡ Fast 💯 Guaranteed' },
        high: { count: '15-20', example: '✅🔥⚡💯🎯🚀💎✨🌟⭐🏆🎁🔋📱💝' }
      }
    },
    isValid: false,
    errors: []
  })
  
  // Error handling
  const { 
    catchGenerationError, 
    lastError, 
    clearError 
  } = useErrorHandler({
    showToast: true,
    logToServer: true
  })

  // Calculate usage and limits
  const planLimit = getPlanLimit(userPlan)
  const estimatedUsage = calculateUsage(formState.selectedPlatforms)
  const totalUsage = currentUsage + estimatedUsage
  const usageStatus = getUsageStatus(totalUsage, planLimit)
  const canGenerate = validateUsage(currentUsage, estimatedUsage, planLimit)

  // Workflow steps configuration
  const workflowSteps = [
    { id: 'form', label: 'Product Info', icon: Sparkles },
    { id: 'platforms', label: 'Platforms', icon: ArrowRight },
    { id: 'emoji', label: 'Emoji Settings', icon: ArrowRight },
    { id: 'validation', label: 'Review', icon: CheckCircle },
    { id: 'generation', label: 'Generate', icon: Loader2 }
  ]

  // Form submission handler
  const handleFormSubmit = async (data: TextInputFormData) => {
    try {
      setFormState(prev => ({
        ...prev,
        formData: data,
        selectedPlatforms: data.platforms,
        isValid: true,
        errors: []
      }))
      
      // Auto-advance to platform selection
      setCurrentStep('platforms')
      
      toast.success('Product information saved!')
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to save product information')
    }
  }

  // Platform selection handler
  const handlePlatformChange = (platforms: string[]) => {
    const validation = validatePlatformSelection(platforms, userPlan)
    
    setFormState(prev => ({
      ...prev,
      selectedPlatforms: platforms,
      isValid: validation.valid,
      errors: validation.valid ? [] : [validation.error || 'Invalid platform selection']
    }))

    // Auto-advance if valid
    if (validation.valid && platforms.length > 0) {
      setTimeout(() => setCurrentStep('emoji'), 500)
    }
  }

  // Emoji settings handler
  const handleEmojiSettingsChange = (settings: EmojiSettings) => {
    setFormState(prev => ({
      ...prev,
      emojiSettings: settings
    }))
  }

  // Validation step
  const handleValidation = () => {
    const errors: string[] = []
    
    if (!formState.formData) {
      errors.push('Product information is required')
    }
    
    if (formState.selectedPlatforms.length === 0) {
      errors.push('At least one platform must be selected')
    }
    
    if (!canGenerate) {
      errors.push(`Insufficient usage limit. Need ${estimatedUsage} generations, but only ${planLimit - currentUsage} remaining.`)
    }

    setFormState(prev => ({
      ...prev,
      isValid: errors.length === 0,
      errors
    }))

    if (errors.length === 0) {
      setCurrentStep('generation')
    }
  }

  // Generation handler
  const handleGeneration = async () => {
    if (!formState.formData || !formState.isValid) return

    setIsGenerating(true)
    setGenerationProgress(0)

    // Progress simulation
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    // Define fallback generation methods
    const fallbackChain = [
      // Fallback 1: Try with universal platform only
      async () => {
        const simplifiedRequest: GenerationRequest = {
          ...request,
          platforms: ['universal']
        }
        return await generateContent(simplifiedRequest)
      },
      // Fallback 2: Try with minimal content
      async () => {
        const minimalRequest: GenerationRequest = {
          inputMethod: 'text',
          productName: formState.formData!.productName,
          category: 'universal',
          writingStyle: 'professional',
          platforms: ['universal'],
          language: 'en',
          emojiSettings: {
            enabled: false,
            intensity: 'low',
            categorySpecific: false,
            intensityConfig: formState.emojiSettings.intensityConfig
          },
          userId,
          userPlan: { type: userPlan, generationsLimit: planLimit, platformsAllowed: 0, features: {} as any, pricing: {} as any }
        }
        return await generateContent(minimalRequest)
      }
    ]

    // Primary generation function
    const generateWithErrorHandling = async () => {
      // Prepare generation request
      const request: GenerationRequest = {
        inputMethod: 'text',
        productName: formState.formData.productName,
        productDescription: formState.formData.productDescription,
        keyFeatures: formState.formData.keyFeatures,
        category: formState.formData.category,
        writingStyle: formState.formData.writingStyle,
        platforms: formState.selectedPlatforms,
        language: formState.formData.language,
        emojiSettings: formState.emojiSettings,
        userId,
        userPlan: { type: userPlan, generationsLimit: planLimit, platformsAllowed: 0, features: {} as any, pricing: {} as any }
      }

      return await generateContent(request)
    }

    // Execute generation with error handling
    const result = await catchGenerationError(
      generateWithErrorHandling,
      fallbackChain,
      {
        productName: formState.formData.productName,
        category: formState.formData.category,
        platforms: formState.selectedPlatforms,
        language: formState.formData.language
      }
    )

    // Clear progress interval
    clearInterval(progressInterval)
    
    // Handle result
    if (result.success && result.data?.success && result.data.data) {
      setGenerationProgress(100)
      
      // Update usage
      onUsageUpdate(totalUsage)
      
      // Complete generation
      onGenerationComplete(result.data)
      
      setCurrentStep('results')
      toast.success('Content generated successfully!')
    } else {
      setFormState(prev => ({
        ...prev,
        errors: [lastError?.message || 'Generation failed']
      }))
    }
    
    setIsGenerating(false)
  }

  // Reset form
  const handleReset = () => {
    setFormState({
      formData: null,
      selectedPlatforms: ['universal'],
      emojiSettings: {
        enabled: true,
        intensity: 'medium',
        categorySpecific: true,
        intensityConfig: {
          low: { count: '3-5', example: '✅ Quality 🚚 Fast' },
          medium: { count: '8-12', example: '✅ Quality 🔥 Price 🚚 Delivery ⚡ Fast 💯 Guaranteed' },
          high: { count: '15-20', example: '✅🔥⚡💯🎯🚀💎✨🌟⭐🏆🎁🔋📱💝' }
        }
      },
      isValid: false,
      errors: []
    })
    setCurrentStep('form')
    setGenerationProgress(0)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Workflow Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Single Product Generation</span>
            <div className="flex items-center space-x-2">
              <Badge variant={usageStatus.status === 'safe' ? 'success' : 'warning'}>
                {currentUsage + estimatedUsage}/{planLimit} generations
              </Badge>
              {currentStep !== 'form' && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {workflowSteps.map((step, index) => {
              const isActive = step.id === currentStep
              const isCompleted = workflowSteps.findIndex(s => s.id === currentStep) > index
              const Icon = step.icon

              return (
                <React.Fragment key={step.id}>
                  <div className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    isCompleted && 'bg-green-100 text-green-700',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className={cn(
                      'h-4 w-4',
                      isActive && currentStep === 'generation' && isGenerating && 'animate-spin'
                    )} />
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Status */}
      {!canGenerate && (
        <ErrorMessage
          type="warning"
          title="Usage Limit Warning"
          message={`You need ${estimatedUsage} generations but only have ${planLimit - currentUsage} remaining.`}
          actions={
            <Button variant="outline" size="sm">
              Upgrade Plan
            </Button>
          }
        />
      )}
      
      {/* API Error Message */}
      {lastError && lastError.type === ErrorType.GENERATION && (
        <ApiErrorMessage
          title="Generation Error"
          message={lastError.message}
          error={{
            type: lastError.type,
            code: lastError.code,
            details: lastError.details,
            retryable: lastError.retryable
          }}
          onRetry={() => {
            clearError()
            handleGeneration()
          }}
          onDismiss={clearError}
          className="mb-4"
        />
      )}

      {/* Step Content */}
      <Tabs value={currentStep} className="w-full">
        {/* Form Step */}
        <TabsContent value="form">
          <TextInputForm
            onSubmit={handleFormSubmit}
            defaultValues={formState.formData || undefined}
            isLoading={false}
          />
        </TabsContent>

        {/* Platform Selection Step */}
        <TabsContent value="platforms">
          <Card>
            <CardHeader>
              <CardTitle>Platform Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <PlatformSelector
                selectedPlatforms={formState.selectedPlatforms}
                onPlatformsChange={handlePlatformChange}
                userPlan={userPlan}
                currentUsage={currentUsage}
                planLimit={planLimit}
                error={formState.errors[0]}
              />
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep('form')}>
                  Back to Form
                </Button>
                <Button 
                  onClick={() => setCurrentStep('emoji')}
                  disabled={!formState.isValid}
                >
                  Continue to Emoji Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emoji Settings Step */}
        <TabsContent value="emoji">
          <Card>
            <CardHeader>
              <CardTitle>Emoji Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <EmojiSystemControls
                settings={formState.emojiSettings}
                onSettingsChange={handleEmojiSettingsChange}
                selectedCategory={formState.formData?.category}
                isBulkMode={false}
              />
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep('platforms')}>
                  Back to Platforms
                </Button>
                <Button onClick={handleValidation}>
                  Review & Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Step */}
        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Review Your Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Settings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Product Information</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Name: {formState.formData?.productName}</div>
                    <div>Category: {formState.formData?.category}</div>
                    <div>Language: {formState.formData?.language}</div>
                    <div>Style: {formState.formData?.writingStyle}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Generation Settings</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Platforms: {formState.selectedPlatforms.join(', ')}</div>
                    <div>Emojis: {formState.emojiSettings.enabled ? 'Enabled' : 'Disabled'}</div>
                    <div>Intensity: {formState.emojiSettings.intensity}</div>
                    <div>Usage Cost: {estimatedUsage} generations</div>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {formState.errors.length > 0 && (
                <ErrorMessage
                  type="error"
                  title="Please fix the following issues:"
                  message=""
                  details={formState.errors}
                />
              )}
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('emoji')}>
                  Back to Emoji Settings
                </Button>
                <Button 
                  onClick={handleGeneration}
                  disabled={!formState.isValid || !canGenerate}
                  loading={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Content'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generation Step */}
        <TabsContent value="generation">
          <Card>
            <CardHeader>
              <CardTitle>Generating Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div>
                  <h3 className="text-lg font-medium">Creating your content...</h3>
                  <p className="text-muted-foreground">
                    AI is analyzing your product and generating optimized content
                  </p>
                </div>
                
                <Progress 
                  value={generationProgress} 
                  className="w-full max-w-md mx-auto"
                  showPercentage
                />
                
                <div className="text-sm text-muted-foreground">
                  Estimated time: 30-60 seconds
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Step */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Content Generated Successfully!</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Your content has been generated and is ready for review and export.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <Button onClick={handleReset} variant="outline">
                    Generate Another
                  </Button>
                  <Button>
                    View Results
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}